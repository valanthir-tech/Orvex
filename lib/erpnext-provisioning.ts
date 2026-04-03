/**
 * ERPNext Tenant Provisioning
 * 
 * Automates creating Company + Warehouse + User + API Keys
 * for new tenants. Called by the provisioning API route.
 */

import { ERPNextClient, ERPNextConfig, ERPNextAPIError } from './erpnext';
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

export interface TenantProvisionResult {
    success: boolean;
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

function getAdminClient(): ERPNextClient {
    const config: ERPNextConfig = {
        url: process.env.NEXT_PUBLIC_ERPNEXT_URL || 'https://erp.valanthir.com',
        apiKey: process.env.ERPNEXT_API_KEY || '',
        apiSecret: process.env.ERPNEXT_API_SECRET || '',
    };

    if (!config.apiKey || !config.apiSecret) {
        throw new Error('ERPNext admin API credentials not configured');
    }

    return new ERPNextClient(config);
}

export async function provisionTenant(input: TenantProvisionInput): Promise<TenantProvisionResult> {
    const client = getAdminClient();
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
        // Step 1: Create Company (idempotent — reuse if already exists)
        let company = await client.getDoc<any>('Company', companyName);
        let finalAbbr = companyAbbr;

        if (!company) {
            // Try creating with the given abbreviation; if it conflicts, append a digit
            let created = false;
            for (let attempt = 0; attempt < 10; attempt++) {
                const tryAbbr = attempt === 0 ? companyAbbr : `${companyAbbr.slice(0, 4)}${attempt}`;
                try {
                    company = await client.createDoc<any>('Company', {
                        company_name: companyName,
                        abbr: tryAbbr,
                        default_currency: currency,
                        country: country,
                        chart_of_accounts: 'Standard with Numbers',
                        create_chart_of_accounts_based_on: 'Standard Template',
                    });
                    finalAbbr = tryAbbr;
                    created = true;
                    break;
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    if (msg.toLowerCase().includes('abbreviation already used') && attempt < 9) {
                        console.warn(`[Provision] Abbr "${tryAbbr}" taken, trying next...`);
                        continue;
                    }
                    throw err;
                }
            }
            if (!created || !company) {
                return { success: false, error: 'Failed to create Company — all abbreviation variants taken', step: 'company' };
            }
        } else {
            finalAbbr = company.abbr || companyAbbr;
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
            return { success: false, error: 'Failed to create User in ERPNext', step: 'user', company: company.name };
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
                customer_group: 'All Customer Groups', // Default in ERPNext
                territory: 'All Territories', // Default in ERPNext
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
            return {
                success: false,
                error: 'Failed to generate API keys',
                step: 'api_keys',
                company: company.name,
                user: ownerEmail,
            };
        }

        // generate_keys returns the real api_secret; the User doc masks it as "***************"
        // so we must use the value from generate_keys directly
        const apiKey = apiKeys.api_key;
        const apiSecret = apiKeys.api_secret;



        return {
            success: true,
            company: company.name,
            companyAbbr: finalAbbr,
            warehouse: warehouse?.name || warehouseName,
            priceList: priceListName,
            customer: customerName,
            posProfile: posProfileName,
            user: ownerEmail,
            apiKey,
            apiSecret,
        };

    } catch (error: any) {
        console.error('[Provision] Error:', error);
        return { success: false, error: error.message, step: 'unknown' };
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
