const fs = require('fs');
const content = `import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isInternalAdminRequest } from '@/lib/internal-admin-auth';

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: NextRequest) {
    try {
        const isInternalRequest = isInternalAdminRequest(req);
        const supabase = getServiceClient();

        if (!isInternalRequest) {
            const authHeader = req.headers.get('Authorization');
            const token = authHeader ? authHeader.replace('Bearer ', '') : '';
            const { data: { user } } = await supabase.auth.getUser(token);
            if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { signupId } = body;

        if (!signupId) {
            return NextResponse.json({ success: false, error: 'Missing signupId' }, { status: 400 });
        }

        const { data: signup, error: fetchError } = await supabase
            .from('tenant_signups')
            .select('*')
            .eq('id', signupId)
            .single();

        if (fetchError || !signup) {
            return NextResponse.json({ success: false, error: 'Signup not found' }, { status: 404 });
        }

        if (signup.status !== 'pending_approval') {
            return NextResponse.json({ success: false, error: 'Signup is in status ' + signup.status + ', cannot approve.' }, { status: 400 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const provisionRes = await fetch(appUrl + '/api/tenants/provision', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-admin-secret': process.env.INTERNAL_ADMIN_API_SECRET || '',
            },
            body: JSON.stringify({
                companyName: signup.company_name,
                companyAbbr: signup.company_abbr,
                ownerEmail: signup.owner_email,
                ownerFirstName: signup.owner_first_name,
                ownerLastName: signup.owner_last_name,
                ownerPhone: signup.owner_phone,
                country: signup.country || 'Nepal',
                currency: 'NPR',
                signupId: signup.id,
            })
        });

        const result = await provisionRes.json();

        if (!provisionRes.ok || !result.success) {
            throw new Error(result.error || 'Provisioning failed');
        }

        return NextResponse.json({ success: true, tenant: result.tenant });

    } catch (error: any) {
        console.error('[Approve API] Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
`;

fs.writeFileSync('C:/Users/LOQ/Desktop/Valanthir Product/Valanthir IMS/Orvex/Orvex-main-app/app/api/tenants/approve/route.ts', content, { encoding: 'utf8' });
console.log('File written!');