/**
 * POST /api/v1/auth/forgot-password
 * 
 * Initiates password reset for a storefront customer.
 * Generates a secure token, stores its hash, and sends a reset email.
 * 
 * Body: { email, resetBaseUrl }
 * - resetBaseUrl: The storefront's password reset page URL (e.g., "https://store.com/reset-password")
 *   The token will be appended as a query param: ?token=xxx
 * 
 * Always returns 200 to prevent email enumeration.
 */

import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { randomBytes, createHash } from 'crypto'
import { sendEmail, storefrontPasswordResetEmail } from '@/lib/email'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const forgotSchema = z.object({
    email: z.string().email('Invalid email address'),
    resetBaseUrl: z.string().url('resetBaseUrl must be a valid URL'),
})

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
}

export const POST = withApiAuth(async (req, ctx) => {
    // Rate limit: 5 password reset requests per IP per hour
    const ip = getClientIp(req)
    const rl = rateLimit(`forgot:${ip}`, { limit: 5, windowSecs: 3600, prefix: 'auth' })
    if (!rl.success) {
        return NextResponse.json(
            { message: 'If an account with that email exists, a password reset link has been sent.' },
            { status: 200 }
        )
    }

    const body = await req.json()
    const validation = forgotSchema.safeParse(body)

    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', issues: validation.error.issues },
            { status: 400 }
        )
    }

    const { email, resetBaseUrl } = validation.data
    const supabase = getServiceClient()

    // Look up customer (don't reveal if they exist or not)
    const { data: customer } = await supabase
        .from('storefront_customers')
        .select('id, full_name, email')
        .eq('tenant_id', ctx.tenantId)
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single()

    if (!customer) {
        // Return success even if customer doesn't exist (prevents enumeration)
        return NextResponse.json({
            message: 'If an account with that email exists, a password reset link has been sent.',
        })
    }

    // Generate secure token
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Invalidate any existing unused tokens for this customer
    await supabase
        .from('storefront_password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('customer_id', customer.id)
        .is('used_at', null)

    // Store hashed token
    const { error: insertError } = await supabase
        .from('storefront_password_reset_tokens')
        .insert({
            tenant_id: ctx.tenantId,
            customer_id: customer.id,
            token_hash: tokenHash,
            expires_at: expiresAt.toISOString(),
        })

    if (insertError) {
        console.error('[Forgot Password] Token insert error:', insertError)
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        )
    }

    // Build reset URL with token
    const resetUrl = `${resetBaseUrl}?token=${rawToken}&email=${encodeURIComponent(email.toLowerCase())}`

    // Send email
    const storeName = ctx.tenantSettings.storeName || 'Store'
    const emailContent = storefrontPasswordResetEmail({
        customerName: customer.full_name,
        resetUrl,
        storeName,
    })

    await sendEmail({
        to: customer.email,
        subject: emailContent.subject,
        html: emailContent.html,
    })

    return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
    })
})

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
