import { CoreEngineClient as FrappeClient } from '@/lib/core';
import { createClient } from '@supabase/supabase-js';

export interface ProvisionConfig {
    companyName: string;
    companyAbbr: string;
    ownerEmail: string;
    ownerFirstName: string;
    ownerLastName?: string;
    ownerPhone?: string;
    country?: string;
    currency?: string;
}

export interface ProvisionResult {
    success: boolean;
    step?: string;
    error?: string;
    siteRecordId?: string;
    url?: string;
    apiKey?: string;
    apiSecret?: string;
    companyAbbr?: string;
    warehouse?: string;
    priceList?: string;
    posProfile?: string;
}

function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    return createClient(url, key);
}

export async function provisionTenant(config: ProvisionConfig): Promise<ProvisionResult> {
    const supabase = getServiceClient();

    try {
        // --- 1. Find an available warmup site ---
        const { data: siteRecord, error: siteError } = await supabase
            .from('erpnext_sites')
            .select('*')
            .eq('is_claimed', false)
            .eq('status', 'ready')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (siteError || !siteRecord) {
            return {
                success: false,
                step: 'claim_pool_site',
                error: 'No warm sites available in the pool. Provisioning pool might be empty or still initializing.',
            };
        }

        // --- 2. Claim the site ---
        const { error: updateError } = await supabase
            .from('erpnext_sites')
            .update({
                is_claimed: true,
                status: 'provisioning',
                claimed_by_tenant: config.companyName,
                claimed_at: new Date().toISOString()
            })
            .eq('site_name', siteRecord.site_name)
            .eq('is_claimed', false);

        if (updateError) {
             return { success: false, step: 'claim_conflict', error: 'Failed to claim pool site. Please try again.' };
        }

        const erpBaseUrl = `https://${siteRecord.site_name}`;
        
        // --- 3. Run Native Frappe Setup Wizard ---
        // Instead of piecewise manual creation (which leaves global defaults missing),
        // we execute the native setup python payload.
        
        console.log(`[Provisioning] Running Native Setup Wizard on ${siteRecord.site_name}...`);

        const systemClient = new FrappeClient({
            url: erpBaseUrl,
            apiKey: siteRecord.superadmin_api_key,
            apiSecret: siteRecord.superadmin_api_secret
        });

        const setupArgs = {
            language: "english",
            country: config.country || "Nepal",
            currency: config.currency || "NPR",
            timezone: "Asia/Kathmandu",
            first_name: config.ownerFirstName,
            last_name: config.ownerLastName || "",
            email: config.ownerEmail,
            company_name: config.companyName,
            company_abbr: config.companyAbbr,
            chart_of_accounts: "Standard with Numbers", // User explicit requirement
            bank_account: "Cash",
            fy_start_date: "2024-07-16", // Nepal Fiscal Year
        };

        const setupResult: any = await systemClient.post('/api/method/frappe.desk.page.setup_wizard.setup_wizard.setup_complete', {
            args: setupArgs
        });

        if (setupResult?.message !== 'Setup Complete') {
            console.warn('[Provisioning] Setup Wizard returned unexpected message. Continuing anyway...', setupResult);
        }

        // --- 4. Wait a few seconds for background jobs to finish ---
        // The wizard queues patch jobs and doctype creations
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // --- 4.1 Ensure Walk-in Customer exists ---
        try {
            await systemClient.post('/api/resource/Customer', {
                customer_name: "Walk-in Customer",
                customer_type: 'Individual',
                customer_group: 'All Customer Groups', // Setup wizard creates this
                territory: 'All Territories', // Setup wizard creates this
            });
            console.log('[Provisioning] Created Walk-in Customer');
        } catch (err: any) {
             // 409 Conflict means it already exists, which is fine
             console.log('[Provisioning] Walk-in Customer might already exist.', err?.message || '');
        }

        // --- 5. We now use the Superadmin API Key/Secret for the Tenant ---
        // Since we are creating a strict 1-to-1 relationship between tenant and site,
        // we can reuse the system credentials provided by the pool.

        // --- 6. Mark pool site as active ---
        await supabase
            .from('erpnext_sites')
            .update({ status: 'active' })
            .eq('site_name', siteRecord.site_name);

        return {
            success: true,
            siteRecordId: siteRecord.id, // This is what the tenant API needs
            url: erpBaseUrl,
            apiKey: siteRecord.superadmin_api_key,
            apiSecret: siteRecord.superadmin_api_secret,
            companyAbbr: config.companyAbbr,
            warehouse: `${config.companyAbbr} - Main`,
            priceList: 'Standard Selling', // Native setup wizard creates "Standard Selling"
            posProfile: `${config.companyAbbr} POS`
        };

    } catch (err: any) {
        console.error('[Provisioning Error]', err);
        return {
            success: false,
            step: 'unknown',
            error: err.message || 'An unexpected error occurred during provisioning.',
        };
    }
}
