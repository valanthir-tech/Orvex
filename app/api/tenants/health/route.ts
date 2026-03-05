/**
 * GET /api/tenants/health
 * 
 * Health check: Verify ERPNext connectivity and API credentials.
 */

import { NextResponse } from 'next/server';
import { ERPNextClient } from '@/lib/erpnext';

export async function GET() {
    const url = process.env.NEXT_PUBLIC_ERPNEXT_URL || '';
    const apiKey = process.env.ERPNEXT_API_KEY || '';
    const apiSecret = process.env.ERPNEXT_API_SECRET || '';

    if (!url || !apiKey || !apiSecret) {
        return NextResponse.json({
            status: 'misconfigured',
            error: 'ERPNext environment variables not set',
            required: ['NEXT_PUBLIC_ERPNEXT_URL', 'ERPNEXT_API_KEY', 'ERPNEXT_API_SECRET'],
        }, { status: 500 });
    }

    const client = new ERPNextClient({ url, apiKey, apiSecret });

    // Try to fetch the logged-in user
    const user = await client.get<any>('/api/method/frappe.auth.get_logged_user');

    if (!user) {
        return NextResponse.json({
            status: 'unreachable',
            error: 'Cannot connect to ERPNext or invalid credentials',
            url,
        }, { status: 503 });
    }

    // Try to list companies
    const companies = await client.getList<{ name: string }>('Company', {
        fields: ['name'],
        limit: 10,
    });

    return NextResponse.json({
        status: 'connected',
        erpnextUrl: url,
        loggedInAs: user,
        companies: companies.map(c => c.name),
    });
}
