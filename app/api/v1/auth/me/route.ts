/**
 * GET /api/v1/auth/me
 * 
 * Returns the currently authenticated storefront customer's profile.
 * Requires: x-api-key + Authorization: Bearer <token>
 */

import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export const GET = withApiAuth(async (_req, ctx) => {
    if (!ctx.customer) {
        return NextResponse.json(
            { error: 'Authentication required. Include Authorization: Bearer <token>' },
            { status: 401 }
        )
    }

    const supabase = getServiceClient()

    const { data: customer, error } = await supabase
        .from('storefront_customers')
        .select('id, email, full_name, phone, address, is_active, email_verified, created_at')
        .eq('id', ctx.customer.sub)
        .eq('tenant_id', ctx.tenantId)
        .single()

    if (error || !customer) {
        return NextResponse.json(
            { error: 'Customer not found' },
            { status: 404 }
        )
    }

    if (!customer.is_active) {
        return NextResponse.json(
            { error: 'Account has been deactivated' },
            { status: 403 }
        )
    }

    return NextResponse.json({
        customer: {
            id: customer.id,
            email: customer.email,
            fullName: customer.full_name,
            phone: customer.phone,
            address: customer.address,
            emailVerified: customer.email_verified,
            createdAt: customer.created_at,
        },
    })
})

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
