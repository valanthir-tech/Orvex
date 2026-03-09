/**
 * POST /api/tenants/approve
 * 
 * Admin approves a pending signup → triggers ERPNext provisioning.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isInternalAdminRequest } from '@/lib/internal-admin-auth';
import { createSupabaseServerClient } from '@/lib/tenant';

// Ensure we don't cache this endpoint
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { signupId } = await req.json();
        const isInternalRequest = isInternalAdminRequest(req);

        if (!signupId) {
            return NextResponse.json(
                { success: false, error: 'signupId is required' },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseServerClient();

        if (!isInternalRequest) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }

            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role !== 'superadmin') {
                return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
            }
        }

        // 2. Fetch the stored signup request
        const { data: signup, error: fetchError } = await supabase
            .from('tenant_signups')
            .select('*')
            .eq('id', signupId)
            .single();

        if (fetchError || !signup) {
            return NextResponse.json(
                { success: false, error: 'Signup not found' },
                { status: 404 }
            );
        }

        if (signup.status !== 'pending_approval') {
            return NextResponse.json(
                { success: false, error: `Signup is already ${signup.status}` },
                { status: 400 }
            );
        }

        console.log(`[Approve] Approving: ${signup.company_name} (${signup.owner_email})`);

        // 3. Update status to 'provisioning'
        await supabase
            .from('tenant_signups')
            .update({ status: 'provisioning', updated_at: new Date().toISOString() })
            .eq('id', signupId);

        // 4. Provision ERPNext via our script
        const host = req.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const provisionUrl = `${protocol}://${host}/api/tenants/provision`;

        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        const internalSecret = process.env.INTERNAL_ADMIN_API_SECRET?.trim();

        if (internalSecret) {
            headers['x-internal-admin-secret'] = internalSecret;
        }

        const provisionResult = await fetch(provisionUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                companyName: signup.company_name,
                companyAbbr: signup.company_abbr,
                ownerEmail: signup.owner_email,
                ownerFirstName: signup.owner_first_name,
                ownerLastName: signup.owner_last_name,
                ownerPhone: signup.owner_phone,
                country: signup.country,
            }),
        });

        const provisionData = await provisionResult.json();

        if (!provisionData.success) {
            // Rollback state visually
            await supabase
                .from('tenant_signups')
                .update({ status: 'failed', error_message: provisionData.error, updated_at: new Date().toISOString() })
                .eq('id', signupId);

            return NextResponse.json(
                { success: false, error: provisionData.error },
                { status: 500 }
            );
        }

        // 5. Finalize the Signup record since the ERPNext environment is fully launched
        await supabase
            .from('tenant_signups')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', signupId);

        return NextResponse.json(
            { success: true, message: 'ERPNext Provisioning completed successfully' },
            { status: 200 }
        );

    } catch (err: any) {
        console.error('[Approve] Error:', err);
        return NextResponse.json(
            { success: false, error: err.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
