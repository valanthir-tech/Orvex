import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

export async function createSupabaseServerClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: 'sb-pos-auth',
            },
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

// 
// TENANT CONTEXT HELPER
// 
// This is the "Brain" logic that decides WHO is logged in and WHAT credentials to use.
// 

import { CoreEngineClient, CoreEngineConfig } from './core'
import { decryptCredentials } from './encryption'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

// Tenant context: Core client + company name for data isolation
export interface TenantContext {
    client: CoreEngineClient
    tenantId: string
    companyName: string
    warehouseName: string
    priceList: string | null
}

// Security Helper: Although not strictly needed for isolation in a 1-to-1 site,
// Frappe still requires these fields for standard operations.
// We strictly scope this to the tenant's own isolated environment.
export function tenantFilter(warehouseName: string): [string, string, unknown][] {
    return [["warehouse", "=", warehouseName]];
}

// Cached per request to avoid double DB hits
export const getTenantContext = cache(async (): Promise<TenantContext> => {
    const supabase = await createSupabaseServerClient();

    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect("/login");
    }

    // 2. Get Profile to find Role & Tenant (use service-role to bypass RLS)
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let { data: profile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Self-heal: create profile if DB trigger didn't fire
    // Use insert (not upsert) so we never overwrite an existing row's role
    if (!profile) {
        const meta = user.user_metadata || {}
        const { data: created, error: insertError } = await adminClient
            .from('profiles')
            .insert({
                id: user.id,
                email: user.email!,
                first_name: meta.first_name || null,
                last_name: meta.last_name || null,
                role: meta.role || 'cashier',
                tenant_id: null,
            })
            .select()
            .single()

        if (insertError) {
            const { data: existing } = await adminClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            profile = existing
        } else {
            profile = created
        }
    }

    if (!profile) {
        throw new Error("Unauthorized: No profile found.");
    }

    // 3. Logic: Determine which Tenant ID to use
    let targetTenantId = profile.tenant_id;

    // SUPERADMIN OVERRIDE (Identity B)
    if (profile.role === 'superadmin') {
        const cookieStore = await cookies();
        const impersonating = cookieStore.get('x-admin-tenant-view')?.value;

        if (impersonating) {
            targetTenantId = impersonating;

        } else {
            // Superadmin has no "default" tenant. They must select one or be in the admin dashboard.
            // If this is called, it means code is trying to access Core data without context.
            throw new Error("Superadmin Context: No tenant selected for impersonation.");
        }
    }

    if (!targetTenantId) {
        throw new Error("Configuration Error: User has no linked tenant.");
    }

    // 4. Fetch Isolated Tenant Keys (1 Client = 1 Isolated Frappe Site)
    // Use service-role client to bypass RLS — auth is already verified above.
    const { data: tenant, error: tenantError } = await adminClient
        .from('tenants')
        .select('erpnext_url, erpnext_api_key, erpnext_api_secret, status, company_name, warehouse_name, price_list')
        .eq('id', targetTenantId)
        .single();

    if (tenantError || !tenant) {
        throw new Error("Tenant Not Found: " + targetTenantId);
    }

    // 5. Check System Status (Kill Switch)
    if (tenant.status !== 'active') {
        throw new Error(`Tenant Suspended: Status is ${tenant.status}`);
    }

    // 6. Decrypt Isolated Credentials
    let decryptedApiKey = tenant.erpnext_api_key;
    let decryptedApiSecret = tenant.erpnext_api_secret;

    try {
        const decrypted = decryptCredentials({
            encryptedApiKey: tenant.erpnext_api_key,
            encryptedApiSecret: tenant.erpnext_api_secret
        });
        decryptedApiKey = decrypted.apiKey;
        decryptedApiSecret = decrypted.apiSecret;
    } catch (err) {
        console.error("Failed to decrypt tenant API keys:", err);
        throw new Error("Misconfigured Tenant: Unable to access credentials");
    }

    // 7. Return Configured Client mapped specifically to this single site
    return {
        client: new CoreEngineClient({
            url: tenant.erpnext_url, // Unique isolated Frappe instance (e.g. client1.valanthir.com)
            apiKey: decryptedApiKey,
            apiSecret: decryptedApiSecret
        }),
        tenantId: targetTenantId,
        companyName: tenant.company_name, // Frappe still requires 'company' field for records
        warehouseName: tenant.warehouse_name || 'Stores - ' + (tenant.company_name.split(' ')[0] || 'COMP'), 
        priceList: tenant.price_list || 'Standard Selling'
    };
});

// Backward-compatible helper: returns just the Core client
export const getTenantClient = cache(async () => {
    const ctx = await getTenantContext();
    return ctx.client;
});
