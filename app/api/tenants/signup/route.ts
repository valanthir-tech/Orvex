/**
 * POST /api/tenants/signup
 * 
 * Customer self-signup: Creates a PENDING tenant record in Supabase.
 * Admin must approve before ERPNext provisioning happens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
            userId = null,
        } = body;

        if (!companyName || !ownerEmail || !ownerFirstName) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: companyName, ownerEmail, ownerFirstName' },
                { status: 400 }
            );
        }

        // Generate abbreviation from company name
        // Multi-word: use initials (e.g. "My Shop" → "MS")
        // Single-word / too short: use first 3 letters (e.g. "ShopXYZ" → "SHO")
        const words = companyName.trim().split(/\s+/);
        let abbr = words.length >= 2
            ? words.map((w: string) => w[0]).join('').toUpperCase().slice(0, 5)
            : companyName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
        if (abbr.length < 2) {
            abbr = companyName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'CO';
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const payload = {
            company_name: companyName,
            company_abbr: abbr,
            owner_email: ownerEmail,
            owner_first_name: ownerFirstName,
            owner_last_name: ownerLastName || '',
            owner_phone: ownerPhone || null,
            country,
            status: 'pending_approval',
            user_id: userId || null,
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
