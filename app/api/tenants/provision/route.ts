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
import { isInternalAdminRequest } from '@/lib/internal-admin-auth';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const supabase = getServiceClient();
        const isInternalRequest = isInternalAdminRequest(req);

        const {
            companyName,
            companyAbbr,
            ownerEmail,
            ownerFirstName,
            ownerLastName,
            ownerPhone,
            country = 'Nepal',
            currency = 'NPR',
            signupId = null,
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

        if (!isInternalRequest) {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized' },
                    { status: 401 }
                );
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'superadmin') {
                return NextResponse.json(
                    { success: false, error: 'Forbidden' },
                    { status: 403 }
                );
            }
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
        const tenantData = {
            company_name: companyName,
            company_abbr: (result.companyAbbr || abbr).toLowerCase(),
            owner_email: ownerEmail,
            owner_first_name: ownerFirstName,
            owner_last_name: ownerLastName || '',
            owner_phone: ownerPhone || null,
            status: 'active',
            plan: 'starter',
            warehouse_name: result.warehouse || `${companyName} - Main`,
            price_list: result.priceList || `${companyName} Selling`,
            pos_profile: result.posProfile || `${companyName} POS`,
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
        // Link owner to tenant — update existing profile if user already exists, else invite
        try {
            // Look up if this email already has a Supabase account
            const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
            const existingUser = userList?.users?.find((u) => u.email === ownerEmail) ?? null;

            if (existingUser) {
                // User already has an account — link them to this tenant directly
                await supabase
                    .from('profiles')
                    .update({ tenant_id: tenant.id, role: 'admin' })
                    .eq('id', existingUser.id);
                console.log(`[Tenant API] Linked existing user ${ownerEmail} to tenant ${tenant.id}`);
            } else {
                // No account yet — send invite email
                const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
                    ownerEmail,
                    {
                        data: {
                            first_name: ownerFirstName,
                            last_name: ownerLastName || '',
                            role: 'admin',
                        },
                        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
                    }
                );

                if (inviteError) {
                    console.error('[Tenant API] Owner invite failed:', inviteError.message);
                } else {
                    console.log(`[Tenant API] Owner invite sent to: ${ownerEmail}`);
                }
            }

            // Mark the signup request as provisioned if we have a signupId
            if (signupId) {
                await supabase
                    .from('tenant_signups')
                    .update({ status: 'provisioned' })
                    .eq('id', signupId);
            }
        } catch (linkErr) {
            console.error('[Tenant API] Owner link/invite error:', linkErr);
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
