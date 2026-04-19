import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Next.js Route Handler for Internal Storefront Products Fetching
export async function GET(request: Request) {
  try {
    // 1. Authenticate the Storefront Engine (Server-to-Server Only)
    const authHeader = request.headers.get("x-storefront-internal-key");
    const internalKey = process.env.STOREFRONT_INTERNAL_API_KEY;
    const reqId = request.headers.get("x-request-id") || "unknown-req";
    
    console.log(`[Storefront Fetch] Products requested. Trace ID: ${reqId}`);

    if (!internalKey || authHeader !== internalKey) {
      console.warn(`[Storefront Fetch] Unauthorized attempt blocked. Trace ID: ${reqId}`);
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // TODO: Implement Upstash/KV Rate Limiting Here
    // const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    // const { success } = await ratelimit.limit(ip);
    // if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    // 2. Grab Tenant ID from Query Params
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
    }

    // 3. Connect to Supabase as Admin (Service Role)
    // Client has ZERO keys, all data securely fetched by the BFF.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Fetch Products for this specific tenant
    // Supabase has the table `tenant_items`, not `erpnext_items`.
    const { data: rawProducts, error } = await supabaseAdmin
      .from("tenant_items")
      .select("*")
      .eq("tenant_id", tenantId)
      // Only returning active, web-enabled products
      .eq("active", true)
      .eq("storefront_status", "visible");

    if (error) {
      console.error("Product fetch failed for tenant:", tenantId, error);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    // 5. Map the items to what the Storefront UI expects
    const mappedProducts = (rawProducts || []).map((p) => ({
      item_code: p.item_code || "Unknown",
      item_name: p.display_name || "Unnamed Product",
      description: null, // Extend later if description is stored in metafields
      standard_rate: p.price || 0,
      image: p.image || null,
      stock_uom: "Nos", // Default stock keeping unit
      has_variants: p?.matrix_pricing?.enabled ? 1 : 0,
      is_stock_item: 1,
      item_group: "Catalog"
    }));

    // Return the sanitized list of products to the Storefront Engine
    return NextResponse.json({ products: mappedProducts });

  } catch (err) {
    console.error("Storefront API Products Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
