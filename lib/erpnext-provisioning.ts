/**
 * ERPNext Tenant Provisioning
 * 
 * Automates creating Company + Warehouse + User + API Keys
 * for new tenants. Called by the provisioning API route.
 */

import { ERPNextClient, ERPNextConfig } from './erpnext';

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
    warehouse?: string;
    user?: string;
    apiKey?: string;
    apiSecret?: string;
    error?: string;
    step?: string;
}

function getAdminClient(): ERPNextClient {
    const config: ERPNextConfig = {
        url: process.env.NEXT_PUBLIC_ERPNEXT_URL || 'http://localhost:8080',
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
        if (!company) {
            company = await client.createDoc<any>('Company', {
                company_name: companyName,
                abbr: companyAbbr,
                default_currency: currency,
                country: country,
                chart_of_accounts: 'Standard',
            });
        }

        if (!company) {
            return { success: false, error: 'Failed to create Company in ERPNext', step: 'company' };
        }

        console.log(`[Provision] Company ready: ${company.name}`);

        // Step 2: Create default Warehouse (non-fatal if it already exists)
        const warehouseName = `${companyName} - Stores - ${companyAbbr}`;
        let warehouse = await client.getDoc<any>('Warehouse', `Stores - ${companyAbbr}`);
        if (!warehouse) {
            warehouse = await client.createDoc<any>('Warehouse', {
                warehouse_name: 'Stores',
                company: company.name,
                is_group: 0,
            });
        }

        if (!warehouse) {
            console.warn(`[Provision] Warehouse may already exist or failed for ${companyName}`);
        } else {
            console.log(`[Provision] Warehouse ready: ${warehouse.name}`);
        }

        // Step 3: Create User (idempotent — reuse if already exists)
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
                ],
            });
        }

        if (!user) {
            return { success: false, error: 'Failed to create User in ERPNext', step: 'user', company: company.name };
        }

        console.log(`[Provision] User ready: ${user.name}`);

        // Step 4: Set User Permission (idempotent — ignore duplicate errors)
        const existingPerms = await client.getList<any>('User Permission', {
            filters: [['user', '=', ownerEmail], ['allow', '=', 'Company'], ['for_value', '=', company.name]],
            fields: ['name'],
            limit: 1,
        });
        if (!existingPerms || existingPerms.length === 0) {
            await client.createDoc('User Permission', {
                user: ownerEmail,
                allow: 'Company',
                for_value: company.name,
                apply_to_all_doctypes: 1,
            });
        }

        console.log(`[Provision] User permission ready for ${ownerEmail} → ${company.name}`);

        // Step 4.5: Create Global Walk-in Customer for this POS tenant if not exists
        const customerName = `Walk-in Customer - ${companyAbbr}`;
        try {
            await client.createDoc('Customer', {
                customer_name: 'Walk-in Customer',
                customer_type: 'Individual',
                customer_group: 'All Customer Groups', // Default in ERPNext
                territory: 'All Territories', // Default in ERPNext
                company: company.name,
            });
            console.log(`[Provision] Created default POS customer for ${company.name}`);
        } catch (err: any) {
            console.warn(`[Provision] Default customer setup notice: ${err.message || 'May already exist'}`);
        }

        // Step 5: Generate API Keys for the user
        const apiKeys = await client.post<{ api_key: string; api_secret: string }>(
            `/api/method/frappe.core.doctype.user.user.generate_keys`,
            { user: ownerEmail }
        );

        if (!apiKeys) {
            return {
                success: false,
                error: 'Failed to generate API keys',
                step: 'api_keys',
                company: company.name,
                user: ownerEmail,
            };
        }

        // Fetch the api_secret (generate_keys returns api_secret only on creation)
        const userDoc = await client.getDoc<any>('User', ownerEmail);
        const apiSecret = userDoc?.api_secret || apiKeys.api_secret;

        console.log(`[Provision] API keys generated for ${ownerEmail}`);

        return {
            success: true,
            company: company.name,
            warehouse: warehouse?.name || warehouseName,
            user: ownerEmail,
            apiKey: apiKeys.api_key || userDoc?.api_key,
            apiSecret: apiSecret,
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
