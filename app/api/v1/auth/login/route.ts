/**
 * POST /api/v1/auth/login
 * 
 * Authenticate a storefront customer.
 * Body: { email, password }
 * Returns: { token, customer }
 */

import { NextResponse } from 'next/server'
import { withApiAuth, signCustomerJwt } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export const POST = withApiAuth(async (req, ctx) => {
    // Rate limit: 10 login attempts per IP per 15 minutes
    const ip = getClientIp(req)
    const rl = await rateLimit(`login:${ip}:${ctx.tenantId}`, { limit: 10, windowSecs: 900, prefix: 'auth' })
    if (!rl.success) {
        return NextResponse.json(
            { error: 'Too many login attempts. Please try again later.' },
            { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
        )
    }

    const body = await req.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', issues: validation.error.issues },
            { status: 400 }
        )
    }

    const { email, password } = validation.data
    const supabase = getServiceClient()

    // Fetch customer with password hash
    const { data: customer, error } = await supabase
        .from('storefront_customers')
        .select('id, email, password_hash, full_name, phone')
        .eq('tenant_id', ctx.tenantId)
        .eq('email', email.toLowerCase())
        .single()

    if (error || !customer) {
        // Use generic message to prevent email enumeration
        return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
        )
    }

    // Verify password
    const passwordValid = await compare(password, customer.password_hash)
    if (!passwordValid) {
        return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
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
    })
})

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
