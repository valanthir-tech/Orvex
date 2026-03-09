/**
 * POST /api/v1/auth/register
 * 
 * Register a new storefront customer account.
 * Body: { email, password, fullName, phone? }
 * Returns: { token, customer }
 */

import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'
import { signCustomerJwt } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(1, 'Name is required').max(100),
    phone: z.string().optional(),
})

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export const POST = withApiAuth(async (req, ctx) => {
    const body = await req.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', issues: validation.error.issues },
            { status: 400 }
        )
    }

    const { email, password, fullName, phone } = validation.data
    const supabase = getServiceClient()

    // Check if email already exists for this tenant
    const { data: existing } = await supabase
        .from('storefront_customers')
        .select('id')
        .eq('tenant_id', ctx.tenantId)
        .eq('email', email.toLowerCase())
        .single()

    if (existing) {
        return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 409 }
        )
    }

    // Hash password
    const passwordHash = await hash(password, 12)

    // Create customer record
    const { data: customer, error } = await supabase
        .from('storefront_customers')
        .insert({
            tenant_id: ctx.tenantId,
            email: email.toLowerCase(),
            password_hash: passwordHash,
            full_name: fullName,
            phone: phone || null,
        })
        .select('id, email, full_name, phone, created_at')
        .single()

    if (error || !customer) {
        console.error('Register error:', error)
        return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
        )
    }

    // Issue JWT
    const token = await signCustomerJwt({
        id: customer.id,
        tenantId: ctx.tenantId,
        email: customer.email,
        fullName: customer.full_name,
    })

    return NextResponse.json({
        token,
        customer: {
            id: customer.id,
            email: customer.email,
            fullName: customer.full_name,
            phone: customer.phone,
        },
    }, { status: 201 })
})

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
