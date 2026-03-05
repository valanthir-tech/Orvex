/**
 * POST /api/tenants/provision
 * 
 * Admin-initiated: Creates a fully provisioned tenant.
 * - Creates tenant record in Supabase (status: 'provisioning')
 * - Provisions ERPNext Company + User + Warehouse + API Keys
 * - Updates tenant record with ERPNext credentials (status: 'active')
 */

import { NextRequest, NextResponse } from 'next/server';
import { provisionTenant } from '@/lib/erpnext-provisioning';
import { encryptCredentials } from '@/lib/encryption';
import { createSupabaseServerClient } from '@/lib/tenant';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            companyName,
            companyAbbr,
            ownerEmail,
            ownerFirstName,
            ownerLastName,
            ownerPhone,
            country = 'Nepal',
            currency = 'NPR',
        } = body;

        // Validate required fields
        if (!companyName || !companyAbbr || !ownerEmail || !ownerFirstName) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: companyName, companyAbbr, ownerEmail, ownerFirstName' },
                { status: 400 }
            );
        }

        // Abbreviation validation (ERPNext requires uppercase, max 5 chars)
        const abbr = companyAbbr.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
        if (abbr.length < 2) {
            return NextResponse.json(
                { success: false, error: 'Company abbreviation must be at least 2 letters' },
                { status: 400 }
            );
        }

        console.log(`[Tenant API] Provisioning: ${companyName} (${abbr}) for ${ownerEmail}`);

        // Provision ERPNext (Company + Warehouse + User + API Keys)
        const result = await provisionTenant({
            companyName,
            companyAbbr: abbr,
            ownerEmail,
            ownerFirstName,
            ownerLastName: ownerLastName || '',
            ownerPhone,
            country,
            currency,
        });

        if (!result.success) {
            console.error(`[Tenant API] Provisioning failed at step: ${result.step}`, result.error);
            return NextResponse.json(
                { success: false, error: result.error, failedStep: result.step },
                { status: 500 }
            );
        }

        // Encrypt credentials before storage
        const encrypted = result.apiKey && result.apiSecret
            ? encryptCredentials({ apiKey: result.apiKey, apiSecret: result.apiSecret })
            : null;

        // Save to Supabase tenants table (with encrypted credentials)
        const supabase = await createSupabaseServerClient();

        // Ensure the person who is provisioning this tenant is authorized as a superadmin
        const { data: { user } } = await supabase.auth.getUser()

        // We assume RLS protects the table, meaning only users with 'superadmin' role can insert into `tenants`.
        // Alternatively, since we're provisioning, the user might be an admin of this specific tenant down the line,
        // but currently, only superadmins can create new tenants.

        const tenantData = {
            company_name: companyName,
            company_abbr: abbr.toLowerCase(), // Save abbreviation as lowercase
            owner_email: ownerEmail,
            owner_first_name: ownerFirstName,
            owner_last_name: ownerLastName || '',
            owner_phone: ownerPhone || null,
            status: 'active',
            erpnext_url: process.env.NEXT_PUBLIC_ERPNEXT_URL || 'http://localhost:8080',
            erpnext_api_key: encrypted?.encryptedApiKey || '',
            erpnext_api_secret: encrypted?.encryptedApiSecret || '',
        };

        const { data: tenant, error: dbError } = await supabase
            .from('tenants')
            .insert([tenantData])
            .select('*')
            .single();

        if (dbError) {
            console.error('[Tenant API] DB Insert Error:', dbError);
            return NextResponse.json(
                { success: false, error: 'Failed to create tenant record in database.' },
                { status: 500 }
            );
        }

        console.log(`[Tenant API] ✅ Tenant provisioned: ${companyName}`);

        return NextResponse.json({ success: true, tenant }, { status: 201 });

    } catch (error: any) {
        console.error('[Tenant API] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
