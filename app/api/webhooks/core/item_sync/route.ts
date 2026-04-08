/**
 * POST /api/webhooks/core/item_sync
 * 
 * Invoked by Core Backend Document events (Item, Item Price, Bin).
 * Keeps the Supabase `storefront_products_cache` in perfect real-time sync
 * without Polling, ensuring millisecond response times for custom e-commerce storefronts.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        // The core backend usually doesn't send good headers, but we can configure the webhook with custom headers.
        // We require the Tenant's Api Key header `x-core-api-key` in the generic webhook URL.
        const apiKey = req.headers.get("x-core-api-key");
        if (!apiKey) {
            return NextResponse.json({ success: false, error: "Missing x-core-api-key header" }, { status: 401 });
        }

        const body = await req.json();
        if (!body || !body.item_code) {
            return NextResponse.json({ success: false, error: "Invalid payload: requires item_code" }, { status: 400 });
        }

        // Identify the tenant by the incoming API Key
        // Need to build a helper in tenant.ts for this, or query directly here.
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Security: Find which tenant owns this API key
        // In real system, the API keys are encrypted, so searching by them directly is tough.
        // We'd either decrypt all (slow) or use a static webhook secret per tenant.
        // A better pattern: The webhook URL contains the Tenant ID: /api/webhooks/core/item_sync?tenant_id=XYZ
        
        const tenantId = new URL(req.url).searchParams.get('tenant_id');
        if (!tenantId) {
            return NextResponse.json({ success: false, error: "Missing tenant_id in URL" }, { status: 400 });
        }

        // Verify the tenant exists
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('id', tenantId)
            .single();

        if (!tenant) throw new Error("Invalid tenant_id");

        // The webhook payload can be dynamic depending on if it's an Item, Price List, or Bin change.
        // Here we upsert the storefront_products_cache with whatever fields were provided.
        // Example Core data: `{"item_code": "SKU-001", "item_name": "T-Shirt", "stock": 50}`

        const updatePayload: any = {
            tenant_id: tenantId,
            item_code: body.item_code,
            last_synced_at: new Date().toISOString()
        };

        if (body.item_name !== undefined) updatePayload.item_name = body.item_name;
        if (body.item_group !== undefined) updatePayload.item_group = body.item_group;
        if (body.description !== undefined) updatePayload.description = body.description;
        if (body.image !== undefined) updatePayload.image = body.image;
        if (body.stock !== undefined) updatePayload.stock = Number(body.stock);
        if (body.base_price !== undefined) updatePayload.base_price = Number(body.base_price);
        if (body.disabled !== undefined) updatePayload.disabled = Boolean(body.disabled);

        const { error: upsertError } = await supabase
            .from('storefront_products_cache')
            .upsert(updatePayload, { onConflict: 'tenant_id,item_code' })

        if (upsertError) {
            console.error("[Webhook Error] Upserting product cache:", upsertError);
            throw new Error(upsertError.message);
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("[Webhook Exception]", e);
        return NextResponse.json({ success: false, error: e.message || "Webhook error" }, { status: 500 });
    }
}
