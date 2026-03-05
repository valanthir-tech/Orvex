/**
 * POST /api/tenants/signup
 * 
 * Customer self-signup: Creates a PENDING tenant record in Supabase.
 * Admin must approve before ERPNext provisioning happens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/tenant';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            companyName,
            ownerEmail,
            ownerFirstName,
            ownerLastName,
            ownerPhone,
            country = 'Nepal',
        } = body;

        if (!companyName || !ownerEmail || !ownerFirstName) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: companyName, ownerEmail, ownerFirstName' },
                { status: 400 }
            );
        }

        // Generate abbreviation from company name
        const abbr = companyName
            .split(/\s+/)
            .map((w: string) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 5);

        const supabase = await createSupabaseServerClient();

        const payload = {
            company_name: companyName,
            company_abbr: abbr,
            owner_email: ownerEmail,
            owner_first_name: ownerFirstName,
            owner_last_name: ownerLastName || '',
            owner_phone: ownerPhone || null,
            country,
            status: 'pending_approval'
        };

        const { data, error } = await supabase
            .from('tenant_signups')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('[Signup] Database error saving signup:', error);
            return NextResponse.json(
                { success: false, error: 'Database error saving signup' },
                { status: 500 }
            );
        }

        console.log(`[Signup] New signup request: ${companyName} (${ownerEmail}) — awaiting approval`);

        return NextResponse.json(
            { success: true, signupId: data.id, message: "Signup queued for approval" },
            { status: 201 }
        );

    } catch (err: any) {
        console.error('[Signup] Processing error:', err);
        return NextResponse.json(
            { success: false, error: err.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
