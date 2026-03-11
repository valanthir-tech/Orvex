import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isInternalAdminRequest } from "@/lib/internal-admin-auth"

// ─── Trigger: GET /api/cron/check-subscriptions
// Protected by x-internal-admin-secret header (or CRON_SECRET for Vercel scheduled cron)
// Configure in vercel.json:
//   { "crons": [{ "path": "/api/cron/check-subscriptions", "schedule": "0 1 * * *" }] }

export async function GET(request: NextRequest) {
    // Allow Vercel cron (CRON_SECRET) or internal admin secret
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")
    const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`
    const isInternalAdmin = isInternalAdminRequest(request)

    if (!isVercelCron && !isInternalAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date()
    const results = {
        markedPastDue: 0,
        markedBlocked: 0,
        errors: [] as string[],
    }

    // 1. Find subscriptions that have expired but are still "active"
    const { data: expiredSubs, error: expiredError } = await adminClient
        .from("tenant_subscriptions")
        .select("id, tenant_id, current_period_end, grace_period_end, status")
        .eq("status", "active")
        .lt("current_period_end", now.toISOString())

    if (expiredError) {
        return NextResponse.json({ error: expiredError.message }, { status: 500 })
    }

    for (const sub of expiredSubs ?? []) {
        try {
            const gracePeriodEnd = sub.grace_period_end ? new Date(sub.grace_period_end) : null

            if (gracePeriodEnd && now < gracePeriodEnd) {
                // Within grace period → mark as past_due
                await adminClient
                    .from("tenant_subscriptions")
                    .update({ status: "past_due" })
                    .eq("id", sub.id)

                await adminClient
                    .from("tenants")
                    .update({ subscription_status: "past_due" })
                    .eq("id", sub.tenant_id)

                results.markedPastDue++
            } else {
                // Grace period ended → block tenant
                await adminClient
                    .from("tenant_subscriptions")
                    .update({ status: "blocked" })
                    .eq("id", sub.id)

                await adminClient
                    .from("tenants")
                    .update({
                        subscription_status: "blocked",
                        is_blocked: true,
                        blocked_reason: "Subscription expired and grace period has ended. Please renew to restore access.",
                        blocked_at: now.toISOString(),
                    })
                    .eq("id", sub.tenant_id)

                results.markedBlocked++
            }
        } catch (err) {
            results.errors.push(`Sub ${sub.id}: ${err instanceof Error ? err.message : String(err)}`)
        }
    }

    // 2. Find "past_due" subscriptions whose grace period has now ended
    const { data: pastDueSubs } = await adminClient
        .from("tenant_subscriptions")
        .select("id, tenant_id, grace_period_end")
        .eq("status", "past_due")
        .lt("grace_period_end", now.toISOString())

    for (const sub of pastDueSubs ?? []) {
        try {
            await adminClient
                .from("tenant_subscriptions")
                .update({ status: "blocked" })
                .eq("id", sub.id)

            await adminClient
                .from("tenants")
                .update({
                    subscription_status: "blocked",
                    is_blocked: true,
                    blocked_reason: "Subscription expired and grace period has ended. Please renew to restore access.",
                    blocked_at: now.toISOString(),
                })
                .eq("id", sub.tenant_id)

            results.markedBlocked++
        } catch (err) {
            results.errors.push(`Sub ${sub.id}: ${err instanceof Error ? err.message : String(err)}`)
        }
    }

    return NextResponse.json({
        success: true,
        timestamp: now.toISOString(),
        ...results,
    })
}
