/**
 * POST /api/tenants/status
 * 
 * Admin-initiated: Updates a tenant's status and enforces teardown/suspension.
 */

import { NextRequest, NextResponse } from 'next/server';
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
            tenantId,
            status // e.g., 'suspended', 'active'
        } = body;

        if (!tenantId || !status) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: tenantId, status' },
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



        // Update Supabase Tenant record
        const { error: updateError } = await supabase
            .from('tenants')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', tenantId);

        if (updateError) {
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        // Feature Enhancement: If suspended, we could instantiate ERPNext admin client
        // and disable the specific user associated with the tenant here. 
        // For now, updating the status immediately blocks all SSR requests via tenant.ts Check #5 (Kill Switch).

        return NextResponse.json({ 
            success: true, 
            message: `Tenant status updated to ${status}`
        });

    } catch (error: any) {
        console.error('[Tenant API] Status update error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
