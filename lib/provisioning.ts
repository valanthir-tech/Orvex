/**
 * CoreEngine Tenant Provisioning
 * 
 * Automates creating Company + Warehouse + User + API Keys
 * for new tenants. Called by the provisioning API route.
 */

import { CoreEngineClient, CoreEngineConfig, CoreEngineAPIError } from './core';
import { POS_DEFAULT_CUSTOMER } from './constants';

export interface TenantProvisionInput {
    companyName: string;
    companyAbbr: string;
    ownerEmail: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerPhone?: string;
    country?: string;
    currency?: string;
}

export class ProvisioningError extends Error {
    step: string;
    constructor(message: string, step: string) {
        super(message);
        this.step = step;
        this.name = 'ProvisioningError';
    }
}

export interface TenantProvisionResult {
    success: boolean;
    url?: string;
    siteRecordId?: string;
    company?: string;
    companyAbbr?: string;
    warehouse?: string;
    priceList?: string;
    customer?: string;
    posProfile?: string;
    user?: string;
    apiKey?: string;
    apiSecret?: string;
    error?: string;
    step?: string;
}

import { createClient } from '@supabase/supabase-js';

// Function to fetch a pre-provisioned site from the Pre-Provisioned Container
async function allocateTenantSite(): Promise<{ client: CoreEngineClient, url: string, siteRecordId: string, apiKey: string, apiSecret: string }> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Find an available site in the pool within the tenants table
    const { data: site, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('status', 'pool')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

    if (error || !site) {
        console.error("Pre-Provisioned Container Exhausted or Error:", error);
        throw new Error("No available infrastructure environments. Please contact support.");
    }

    // 2. Mark it as provisioning so no one else grabs it at the exact same moment
    const { error: updateError } = await supabase
        .from('tenants')
        .update({ status: 'provisioning' })
        .eq('id', site.id);

    if (updateError) {
        throw new Error("Concurrency error allocating site. Please try again.");
    }

    const config: CoreEngineConfig = {
        url: site.erpnext_url,
        apiKey: site.erpnext_api_key,
        apiSecret: site.erpnext_api_secret,
    };

    return {
        client: new CoreEngineClient(config),
        url: site.erpnext_url,
        siteRecordId: site.id,
        apiKey: site.erpnext_api_key,
        apiSecret: site.erpnext_api_secret,
    };
}

export async function provisionTenant(input: TenantProvisionInput): Promise<TenantProvisionResult> {
    
    let tenantSite;
    try {
        tenantSite = await allocateTenantSite();
    } catch (error: any) {
        return { success: false, error: error.message, step: 'infrastructure_pool' };
    }

    const client = tenantSite.client;
    const {
        companyName,
        companyAbbr,
        ownerEmail,
        ownerFirstName,
        ownerLastName,
        country = 'Nepal',
        currency = 'NPR',
    } = input;

    try {
        // Step 1: Create Company (isolated site, no collisions possible)
        let company = await client.getDoc<any>('Company', companyName);
        let finalAbbr = companyAbbr;

        if (!company) {
            try {
                company = await client.createDoc<any>('Company', {
                    company_name: companyName,
                    abbr: companyAbbr,
                    default_currency: currency,
                    country: country,
                    chart_of_accounts: 'Standard with Numbers',
                    create_chart_of_accounts_based_on: 'Standard Template',
                });
            } catch (err: unknown) {
                console.error("[Provision] Failed to create company isolated:", err);
                throw new ProvisioningError('Frappe API Error: ' + (err instanceof Error ? err.message : JSON.stringify(err)), 'company');
            }
        } else {
            finalAbbr = company.abbr || companyAbbr;
        }

        // Create missing custom payment modes
        const modes = ['Cash', 'eSewa', 'Khalti', 'FonePay', 'Card', 'Credit Card'];
        for (const mode of modes) {
            try {
                await client.createDoc<any>('Mode of Payment', {
                    mode_of_payment: mode,
                    enabled: 1,
                    type: mode === 'Cash' ? 'Cash' : 'Bank'
                });
            } catch (e) {
                // Ignore if it already exists
            }
        }

        // Step 1.5: Ensure Mode of Payment links to this company's accounts
        try {
            const compDoc = await client.getDoc<any>('Company', company.name);
            const cashAcc = compDoc?.default_cash_account;
            const incomeAcc = compDoc?.default_income_account;
            const expenseAcc = compDoc?.default_expense_account;
            
            // Save these to the company object to reuse in POS Profile
            company._default_cash = cashAcc;
            company._default_income = incomeAcc;
            company._default_expense = expenseAcc;
            
            if (cashAcc) {
                const mopCash = await client.getDoc<any>('Mode of Payment', 'Cash');
                if (mopCash) {
                    const hasCompany = mopCash.accounts?.some((a: any) => a.company === company.name);
                    if (!hasCompany) {
                        const newAccounts = [...(mopCash.accounts || []), {
                            company: company.name,
                            default_account: cashAcc
                        }];
                        await client.updateDoc('Mode of Payment', 'Cash', { accounts: newAccounts });
                        console.log(`[Provision] Mapped Cash account to Mode of Payment for ${company.name}`);
                    }
                }
            }
        } catch (mopErr: any) {
            console.warn(`[Provision] Mode of payment setup notice: ${mopErr.message}`);
        }



        // Step 2: Create default Warehouse
        const warehouseName = `${companyName} - Main`;
        let warehouse = await client.getDoc<any>('Warehouse', warehouseName);
        if (!warehouse) {
            try {
                warehouse = await client.createDoc<any>('Warehouse', {
                    warehouse_name: `${companyName} - Main`,
                    company: company.name,
                    is_group: 0,
                });
            } catch (whErr: any) {
                console.warn(`[Provision] Warehouse creation notice: ${whErr.message || 'May already exist'}`);
            }
        }

        if (!warehouse) {
            console.warn(`[Provision] Warehouse may already exist or failed for ${companyName}`);
        } else {

        }

        // Step 3: Create Price List
        const priceListName = `${companyName} Selling`;
        let priceList = await client.getDoc<any>('Price List', priceListName);
        if (!priceList) {
            try {
                priceList = await client.createDoc<any>('Price List', {
                    price_list_name: priceListName,
                    enabled: 1,
                    buying: 0,
                    selling: 1,
                    currency: currency,
                });

            } catch (plErr: any) {
                console.warn(`[Provision] Price List creation notice: ${plErr.message || 'May already exist'}`);
            }
        }

        // Step 4: Create User (idempotent — reuse if already exists)
        let user = await client.getDoc<any>('User', ownerEmail);
        if (!user) {
            user = await client.createDoc<any>('User', {
                email: ownerEmail,
                first_name: ownerFirstName,
                last_name: ownerLastName,
                send_welcome_email: 0,
                new_password: generateTempPassword(),
                user_type: 'System User',
                roles: [
                    { role: 'Sales User' },
                    { role: 'Stock User' },
                    { role: 'Accounts User' },
                    { role: 'Item Manager' },
                    { role: 'Stock Manager' },
                    { role: 'Sales Master Manager' },
                    { role: 'Sales Manager' },
                ],
            });
        }

        if (!user) {
            throw new ProvisioningError('Failed to create User in CoreEngine', 'user');
        }



        // Step 4: Set User Permission (idempotent — ignore duplicate errors)
        const existingPerms = await client.getList<any>('User Permission', {
            filters: [['user', '=', ownerEmail], ['allow', '=', 'Company'], ['for_value', '=', company.name]],
            fields: ['name'],
            limit: 1,
        });
        if (!existingPerms || existingPerms.length === 0) {
            try {
                await client.createDoc('User Permission', {
                    user: ownerEmail,
                    allow: 'Company',
                    for_value: company.name,
                    apply_to_all_doctypes: 1,
                });
            } catch (permErr: any) {
                console.warn(`[Provision] User permission notice: ${permErr.message || 'May already exist'}`);
            }
        }



        // Step 4.5: Create Global Walk-in Customer for this POS tenant if not exists
        let customerName = POS_DEFAULT_CUSTOMER;
        try {
            const cust = await client.createDoc('Customer', {
                customer_name: customerName,
                customer_type: 'Individual',
                customer_group: 'All Customer Groups', // Default in CoreEngine
                territory: 'All Territories', // Default in CoreEngine
                company: company.name,
            });
            customerName = (cust as {name?: string})?.name || POS_DEFAULT_CUSTOMER;

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`[Provision] Default customer setup notice: ${msg || 'May already exist'}`);
            // If exists, name is usually "Walk-in Customer" or appended by abbreviation
            customerName = POS_DEFAULT_CUSTOMER;
        }
        // Step 4.2.1: Add necessary custom fields
        try {

            await client.createDoc('Custom Field', {
                dt: 'Sales Invoice',
                fieldname: 'custom_pos_uuid',
                label: 'POS UUID',
                fieldtype: 'Data',
                insert_after: 'customer_name'
            });

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            // Usually fails if it already exists, which is fine

        }
        // Step 4.6: Create POS Profile
        const posProfileName = `${companyName} POS`;
        let posProfile;
        try {
            posProfile = await client.createDoc<any>('POS Profile', {
                name: posProfileName,
                company: company.name,
                warehouse: warehouse?.name || warehouseName,
                selling_price_list: priceListName,
                campaign: '',
                company_address: '',
                currency: currency,
                customer: customerName,
                disabled: 0,
                hide_images: 0,
                hide_unavailable_items: 0,
                ignore_pricing_rule: 0,
                update_stock: 1, // Keep stock updated immediately
                write_off_account: '',
                write_off_cost_center: '',
                income_account: company._default_income || '',
                expense_account: company._default_expense || '',
                payments: [{
                    mode_of_payment: 'Cash',
                    default: 1
                }]
            });

        } catch (err: unknown) {
             const msg = err instanceof Error ? err.message : String(err);
             console.warn(`[Provision] POS Profile setup notice: ${msg || 'May already exist'}`);
        }

        // Step 5: Generate API Keys for the user
        const apiKeys = await client.post<{ api_key: string; api_secret: string }>(
            `/api/method/frappe.core.doctype.user.user.generate_keys`,
            { user: ownerEmail }
        );

        if (!apiKeys?.api_secret) {
            throw new ProvisioningError('Failed to generate API keys', 'api_keys');
        }

        // generate_keys returns the real api_secret; the User doc masks it as "***************"
        // so we must use the value from generate_keys directly
        const apiKey = apiKeys.api_key;
        const apiSecret = apiKeys.api_secret;



        return {
            success: true,
            url: tenantSite.url,
            siteRecordId: tenantSite.siteRecordId,
            company: company.name,
            companyAbbr: finalAbbr,
            warehouse: warehouse?.name || warehouseName,
            priceList: priceListName,
            customer: customerName,
            posProfile: posProfileName,
            user: ownerEmail,
            apiKey: tenantSite.apiKey, // In a Pre-Provisioned Container, we assign the System Administrator API keys directly to the tenant's admin, or we generate one for them. Actually, using the pool's system keys is standard for single-tenant nodes.
            apiSecret: tenantSite.apiSecret,
        };

    } catch (error: any) {
        console.error('[Provision] Error:', error);

        // IMMEDIATE ROLLBACK: Release the lock so the pool isn't exhausted by failed attempts
        if (tenantSite?.siteRecordId) {
            try {
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );
                await supabase.from('tenants').update({ status: 'pool' }).eq('id', tenantSite.siteRecordId);
                console.log(`[Provision] Success! Rolled back lock on pool site ${tenantSite.siteRecordId}`);
            } catch (rollbackErr) {
                console.error('[Provision] CRITICAL: Failed to rollback pool lock:', rollbackErr);
            }
        }

        return { success: false, error: error.message || 'Unknown error', step: error.step || 'unknown' };
    }
}

function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
