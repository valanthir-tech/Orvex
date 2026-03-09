/**
 * POST /api/v1/auth/reset-password
 * 
 * Completes a storefront customer password reset.
 * Validates the token, updates the password hash, and marks the token as used.
 * 
 * Body: { email, token, newPassword }
 * Returns: { message } on success
 */

import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const resetSchema = z.object({
    email: z.string().email('Invalid email address'),
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
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
    const body = await req.json()
    const validation = resetSchema.safeParse(body)

    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', issues: validation.error.issues },
            { status: 400 }
        )
    }

    const { email, token, newPassword } = validation.data
    const supabase = getServiceClient()
    const tokenHash = hashToken(token)

    // Look up valid (unused, not expired) token
    const { data: resetToken, error: tokenError } = await supabase
        .from('storefront_password_reset_tokens')
        .select('id, customer_id, expires_at, used_at')
        .eq('tenant_id', ctx.tenantId)
        .eq('token_hash', tokenHash)
        .is('used_at', null)
        .single()

    if (tokenError || !resetToken) {
        return NextResponse.json(
            { error: 'Invalid or expired reset token' },
            { status: 400 }
        )
    }

    // Check expiry
    if (new Date(resetToken.expires_at) < new Date()) {
        return NextResponse.json(
            { error: 'Reset token has expired. Please request a new one.' },
            { status: 400 }
        )
    }

    // Verify the customer matches the email
    const { data: customer } = await supabase
        .from('storefront_customers')
        .select('id, email')
        .eq('id', resetToken.customer_id)
        .eq('tenant_id', ctx.tenantId)
        .eq('email', email.toLowerCase())
        .single()

    if (!customer) {
        return NextResponse.json(
            { error: 'Invalid or expired reset token' },
            { status: 400 }
        )
    }

    // Hash new password
    const passwordHash = await hash(newPassword, 12)

    // Update password
    const { error: updateError } = await supabase
        .from('storefront_customers')
        .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
        .eq('id', customer.id)
        .eq('tenant_id', ctx.tenantId)

    if (updateError) {
        console.error('[Reset Password] Update error:', updateError)
        return NextResponse.json(
            { error: 'Failed to update password' },
            { status: 500 }
        )
    }

    // Mark token as used
    await supabase
        .from('storefront_password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', resetToken.id)

    return NextResponse.json({
        message: 'Password has been reset successfully. You can now log in with your new password.',
    })
})

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
