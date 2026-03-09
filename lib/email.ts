/**
 * Email Utility
 * 
 * Sends transactional emails via Resend.
 * Used for:
 * - Storefront customer password reset emails
 * - Staff invite notifications (optional — Supabase handles IMS staff invites)
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'Valanthir <noreply@valanthir.com>'

interface SendEmailOptions {
    to: string
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[Email] RESEND_API_KEY not set — skipping email send')
        console.log(`[Email] Would send to ${to}: ${subject}`)
        return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
    })

    if (error) {
        console.error('[Email] Send failed:', error)
        return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export function storefrontPasswordResetEmail(params: {
    customerName: string
    resetUrl: string
    storeName: string
}) {
    return {
        subject: `Reset your password — ${params.storeName}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
  <h2 style="margin-bottom: 16px;">Password Reset</h2>
  <p>Hi ${escapeHtml(params.customerName)},</p>
  <p>We received a request to reset your password for <strong>${escapeHtml(params.storeName)}</strong>.</p>
  <p style="margin: 24px 0;">
    <a href="${escapeHtml(params.resetUrl)}" 
       style="display: inline-block; padding: 12px 24px; background: #171717; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
      Reset Password
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #999; font-size: 12px;">Powered by Valanthir IMS</p>
</body>
</html>`.trim(),
    }
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
