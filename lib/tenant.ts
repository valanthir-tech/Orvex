import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

export async function createSupabaseServerClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
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

import { ERPNextClient, ERPNextConfig } from './erpnext'
import { decryptCredentials } from './encryption'

// Cached per request to avoid double DB hits
export const getTenantClient = cache(async () => {
    // Check if we are running in MOCK_MODE for local development without Supabase
    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
        const url = process.env.NEXT_PUBLIC_ERPNEXT_URL;
        const apiKey = process.env.ERPNEXT_API_KEY;
        const apiSecret = process.env.ERPNEXT_API_SECRET;

        if (!url || !apiKey || !apiSecret) {
            throw new Error("Missing ERPNext credentials in .env.local for mock mode.");
        }

        return new ERPNextClient({ url, apiKey, apiSecret });
    }

    const supabase = await createSupabaseServerClient();

    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized: No user session found.");
    }

    // 2. Get Profile to find Role & Tenant
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
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
            console.log(`[Superadmin] Impersonating tenant: ${targetTenantId}`);
        } else {
            // Superadmin has no "default" tenant. They must select one or be in the admin dashboard.
            // If this is called, it means code is trying to access ERPNext data without context.
            throw new Error("Superadmin Context: No tenant selected for impersonation.");
        }
    }

    if (!targetTenantId) {
        throw new Error("Configuration Error: User has no linked tenant.");
    }

    // 4. Fetch Decrypted Credentials for this Tenant
    // In production, use KMS or similar. For MVP, we assume RLS protects the row.
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('erpnext_url, erpnext_api_key, erpnext_api_secret, status')
        .eq('id', targetTenantId)
        .single();

    if (tenantError || !tenant) {
        throw new Error("Tenant Not Found: " + targetTenantId);
    }

    // 5. Check System Status (Kill Switch)
    if (tenant.status !== 'active' && tenant.status !== 'trial') {
        throw new Error(`Tenant Suspended: Status is ${tenant.status}`);
    }

    // 6. Decrypt Credentials
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

    // 7. Return Configured Client
    return new ERPNextClient({
        url: tenant.erpnext_url,
        apiKey: decryptedApiKey,
        apiSecret: decryptedApiSecret
    });
});
