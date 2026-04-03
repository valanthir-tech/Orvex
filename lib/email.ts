/**
 * Email Utility
 * 
 * Sends transactional emails via Resend.
 * Used for:
 * - Storefront customer password reset emails
 * - Staff invite notifications (optional — Supabase handles IMS staff invites)
 */

import { Resend } from 'resend'

// Provide a dummy fallback key to prevent Next.js build-time prerendering failures
// It will use the actual process.env variable at runtime.
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_fallback_key')

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'Valanthir <noreply@valanthir.com>'

interface SendEmailOptions {
    to: string
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[Email] RESEND_API_KEY not set — skipping email send')

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

// ─── Payment Approved Email ───────────────────────────────────────────────────

export function paymentApprovedEmail(params: {
    tenantName: string
    planName: string
    amountNpr: number
    periodEnd: string
}) {
    const formattedDate = new Date(params.periodEnd).toLocaleDateString('en-NP', {
        year: 'numeric', month: 'long', day: 'numeric'
    })
    return {
        subject: `Payment Approved — ${escapeHtml(params.planName)} Plan is Active`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
  <div style="display:inline-block; background:#dcfce7; color:#166534; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:600; margin-bottom:24px;">✓ Payment Approved</div>
  <h2 style="margin:0 0 12px;">Your subscription is now active</h2>
  <p>Hi <strong>${escapeHtml(params.tenantName)}</strong>,</p>
  <p>We've confirmed your payment of <strong>Rs. ${params.amountNpr.toLocaleString('en-NP')}</strong> for the <strong>${escapeHtml(params.planName)}</strong> plan.</p>
  <div style="background:#f9fafb; border-radius:12px; padding:16px 20px; margin:24px 0;">
    <p style="margin:0 0 6px; font-size:13px; color:#6b7280;">Plan active until</p>
    <p style="margin:0; font-size:18px; font-weight:700;">${formattedDate}</p>
  </div>
  <p style="color:#6b7280; font-size:14px;">You now have full access to all features included in your plan. Log in to your store dashboard to continue.</p>
  <hr style="border:none; border-top:1px solid #eee; margin:32px 0;">
  <p style="color:#9ca3af; font-size:12px;">Valanthir IMS &middot; <a href="mailto:support@valanthir.com" style="color:#9ca3af;">support@valanthir.com</a></p>
</body>
</html>`.trim(),
    }
}

// ─── Payment Rejected Email ───────────────────────────────────────────────────

export function paymentRejectedEmail(params: {
    tenantName: string
    planName: string
    adminNotes: string | null
}) {
    return {
        subject: `Action Required — Payment Update for Valanthir IMS`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
  <div style="display:inline-block; background:#fee2e2; color:#991b1b; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:600; margin-bottom:24px;">Payment Update Required</div>
  <h2 style="margin:0 0 12px;">We couldn't process your payment</h2>
  <p>Hi <strong>${escapeHtml(params.tenantName)}</strong>,</p>
  <p>Unfortunately, your payment for the <strong>${escapeHtml(params.planName)}</strong> plan could not be approved.</p>
  ${params.adminNotes ? `
  <div style="background:#fff7ed; border-left:3px solid #f97316; border-radius:0 8px 8px 0; padding:12px 16px; margin:20px 0;">
    <p style="margin:0; font-size:14px; color:#9a3412;"><strong>Reason:</strong> ${escapeHtml(params.adminNotes)}</p>
  </div>` : ''}
  <p>Please resubmit your payment with the correct proof and details. If you believe this is an error, contact our support team.</p>
  <p style="margin:24px 0;">
    <a href="https://app.valanthir.com/settings/subscription"
       style="display:inline-block; padding:12px 24px; background:#171717; color:#fff; text-decoration:none; border-radius:8px; font-weight:500;">
      Resubmit Payment
    </a>
  </p>
  <hr style="border:none; border-top:1px solid #eee; margin:32px 0;">
  <p style="color:#9ca3af; font-size:12px;">Valanthir IMS &middot; <a href="mailto:support@valanthir.com" style="color:#9ca3af;">support@valanthir.com</a></p>
</body>
</html>`.trim(),
    }
}

// ─── Subscription Expiry Reminder Email ───────────────────────────────────────

export function subscriptionExpiryEmail(params: {
    tenantName: string
    planName: string
    daysRemaining: number
    expiryDate: string
}) {
    const formattedDate = new Date(params.expiryDate).toLocaleDateString('en-NP', {
        year: 'numeric', month: 'long', day: 'numeric'
    })
    const isExpired = params.daysRemaining <= 0

    return {
        subject: isExpired
            ? `Your Valanthir IMS subscription has expired`
            : `Your subscription expires in ${params.daysRemaining} day${params.daysRemaining !== 1 ? 's' : ''}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
  <div style="display:inline-block; background:#fef3c7; color:#92400e; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:600; margin-bottom:24px;">
    ${isExpired ? '⚠ Subscription Expired' : `⏰ Expiring in ${params.daysRemaining} day${params.daysRemaining !== 1 ? 's' : ''}`}
  </div>
  <h2 style="margin:0 0 12px;">${isExpired ? 'Your subscription has expired' : 'Time to renew your subscription'}</h2>
  <p>Hi <strong>${escapeHtml(params.tenantName)}</strong>,</p>
  ${isExpired
    ? `<p>Your <strong>${escapeHtml(params.planName)}</strong> subscription has expired as of <strong>${formattedDate}</strong>. Some features may be limited until you renew.</p>`
    : `<p>Your <strong>${escapeHtml(params.planName)}</strong> subscription expires on <strong>${formattedDate}</strong>. Renew now to keep everything running without interruption.</p>`
  }
  <p style="margin:24px 0;">
    <a href="https://app.valanthir.com/settings/subscription"
       style="display:inline-block; padding:12px 24px; background:#171717; color:#fff; text-decoration:none; border-radius:8px; font-weight:500;">
      Renew Subscription
    </a>
  </p>
  <hr style="border:none; border-top:1px solid #eee; margin:32px 0;">
  <p style="color:#9ca3af; font-size:12px;">Valanthir IMS &middot; <a href="mailto:support@valanthir.com" style="color:#9ca3af;">support@valanthir.com</a></p>
</body>
</html>`.trim(),
    }
}
