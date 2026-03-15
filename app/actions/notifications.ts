"use server"

import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/tenant"

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationType =
    | "low_stock"
    | "payment_approved"
    | "payment_rejected"
    | "subscription_expiry"
    | "general"

export interface AppNotification {
    id: string
    tenant_id: string
    type: NotificationType
    title: string
    message: string
    data: Record<string, unknown>
    is_read: boolean
    created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

async function getAuthenticatedTenantId(): Promise<{ userId: string; tenantId: string }> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const adminClient = getAdminClient()
    const { data: profile } = await adminClient
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

    if (!profile?.tenant_id) throw new Error("No tenant associated with this account")
    return { userId: user.id, tenantId: profile.tenant_id }
}

// ─── Get Notifications ────────────────────────────────────────────────────────

export async function getNotifications(): Promise<AppNotification[]> {
    const { tenantId } = await getAuthenticatedTenantId()
    const adminClient = getAdminClient()

    const { data, error } = await adminClient
        .from("notifications")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(30)

    if (error) throw new Error(error.message)
    return (data ?? []) as AppNotification[]
}

// ─── Mark Single Notification Read ───────────────────────────────────────────

export async function markNotificationRead(id: string): Promise<void> {
    const { tenantId } = await getAuthenticatedTenantId()
    const adminClient = getAdminClient()

    await adminClient
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("tenant_id", tenantId)
}

// ─── Mark All Notifications Read ─────────────────────────────────────────────

export async function markAllNotificationsRead(): Promise<void> {
    const { tenantId } = await getAuthenticatedTenantId()
    const adminClient = getAdminClient()

    await adminClient
        .from("notifications")
        .update({ is_read: true })
        .eq("tenant_id", tenantId)
        .eq("is_read", false)
}

// ─── Internal: Create Notification ───────────────────────────────────────────
// Called server-side from other actions (not exposed as a public server action)

export async function createNotification(params: {
    tenantId: string
    type: NotificationType
    title: string
    message: string
    data?: Record<string, unknown>
}): Promise<void> {
    const adminClient = getAdminClient()

    await adminClient.from("notifications").insert({
        tenant_id: params.tenantId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data ?? {},
    })
}

// ─── Create Subscription Expiry Notification ─────────────────────────────────
// Called from dashboard layout when subscription is within 7 days of expiry.
// Deduplicates: only one notification created per day.

export async function createSubscriptionExpiryNotification(params: {
    daysRemaining: number
    expiryDate: string
}): Promise<void> {
    const { tenantId } = await getAuthenticatedTenantId()
    const adminClient = getAdminClient()

    // Only one per day
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count } = await adminClient
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("type", "subscription_expiry")
        .gte("created_at", todayStart.toISOString())

    if ((count ?? 0) > 0) return

    const { daysRemaining, expiryDate } = params

    await adminClient.from("notifications").insert({
        tenant_id: tenantId,
        type: "subscription_expiry",
        title: daysRemaining <= 0 ? "Subscription Expired" : "Subscription Expiring Soon",
        message:
            daysRemaining <= 0
                ? "Your subscription has expired. Please renew to keep all features running."
                : `Your subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}. Renew now to avoid interruption.`,
        data: { days_remaining: daysRemaining, expiry_date: expiryDate },
    })
}

// ─── Report Low-Stock Items ───────────────────────────────────────────────────
// Called from the Products/Inventory page after items are loaded.
// Accepts an array of low-stock items returned by getInventory().
// Deduplicates: one notification per item per day.

export async function reportLowStockItems(
    items: Array<{ productCode: string; productName: string; currentQty: number; threshold: number }>
): Promise<void> {
    if (!items.length) return

    const { tenantId } = await getAuthenticatedTenantId()
    const adminClient = getAdminClient()

    // Check if low-stock alerts are enabled
    const { data: settings } = await adminClient
        .from("tenant_settings")
        .select("enable_low_stock_alerts")
        .eq("tenant_id", tenantId)
        .single()

    if (!settings?.enable_low_stock_alerts) return

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Fetch item codes already notified today to avoid duplicates
    const { data: existing } = await adminClient
        .from("notifications")
        .select("data")
        .eq("tenant_id", tenantId)
        .eq("type", "low_stock")
        .gte("created_at", todayStart.toISOString())

    const alreadyNotified = new Set(
        (existing ?? []).map((n) => (n.data as { item_code?: string })?.item_code).filter(Boolean)
    )

    const toInsert = items
        .filter((item) => !alreadyNotified.has(item.productCode))
        .map((item) => ({
            tenant_id: tenantId,
            type: "low_stock" as NotificationType,
            title: `Low Stock: ${item.productName}`,
            message: `${item.productName} has only ${item.currentQty} unit${item.currentQty !== 1 ? "s" : ""} remaining (threshold: ${item.threshold}).`,
            data: {
                item_code: item.productCode,
                item_name: item.productName,
                current_qty: item.currentQty,
                threshold: item.threshold,
            },
        }))

    if (toInsert.length === 0) return

    await adminClient.from("notifications").insert(toInsert)
}
