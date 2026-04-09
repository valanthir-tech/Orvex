/**
 * POST /api/tenants/signup
 * 
 * Customer self-signup: Creates a PENDING tenant record in Supabase.
 * Admin must approve before ERPNext provisioning happens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    // Rate limit: 3 signup attempts per IP per hour
    const ip = getClientIp(req)
    const rl = await rateLimit(`signup:${ip}`, { limit: 3, windowSecs: 3600, prefix: 'tenant' })
    if (!rl.success) {
        return NextResponse.json(
            { success: false, error: 'Too many signup attempts. Please try again later.' },
            { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
        )
    }

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
            status: 'pending_payment', // Require payment step next
            user_id: userId || null,
        };

        const { data, error } = await supabase
            .from('tenant_signups')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('[Signup] Database error saving signup:', error);
            
            // Check for foreign key violation on user_id (usually error code 23503)
            if (error.code === '23503' && error.message.includes('tenant_signups_user_id_fkey')) {
                return NextResponse.json(
                    { success: false, error: 'Database error: Invalid user session or duplicate email detected. Please log out and start over.' },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { success: false, error: 'Database error saving signup: ' + error.message },
                { status: 500 }
            );
        }



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
