import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import DashboardLayoutClient from "./dashboard-layout-client"
import { getUserProfile } from "@/lib/user"
import { createSubscriptionExpiryNotification } from "@/app/actions/notifications"
import { getTenantFeatures } from "@/app/actions/subscriptions"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const sidebarCookie = cookieStore.get("sidebar_state")
    const defaultOpen = sidebarCookie ? sidebarCookie.value === "true" : true

    const profile = await getUserProfile()

    const activeProfile = profile || {
        id: "demo-user",
        tenant_id: "demo-tenant",
        email: "owner@onedexo.com",
        first_name: "Store",
        last_name: "Owner",
        role: "admin" as const,
    }

    // Authenticated users who haven't been assigned to a tenant yet
    if (profile && !profile.tenant_id) {
        redirect("/pending")
    }

    // Fetch subscription status for reminder banner
    let subscriptionInfo: {
        status: string
        gracePeriodEnd: string | null
        daysRemaining: number | null
        features: Awaited<ReturnType<typeof getTenantFeatures>>
    } | null = null

    // Get features safely
    const features = await getTenantFeatures()

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")

    if (profile?.tenant_id && hasSupabase) {
        try {
            const adminClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )
            const { data: tenant } = await adminClient
                .from("tenants")
                .select("subscription_status")
                .eq("id", profile.tenant_id)
                .single()

            if (tenant && ["past_due", "pending_payment"].includes(tenant.subscription_status)) {
                const { data: sub } = await adminClient
                    .from("tenant_subscriptions")
                    .select("grace_period_end, current_period_end")
                    .eq("tenant_id", profile.tenant_id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle()

                const end = sub?.current_period_end ? new Date(sub.current_period_end) : null
                subscriptionInfo = {
                    status: tenant.subscription_status,
                    gracePeriodEnd: sub?.grace_period_end ?? null,
                    daysRemaining: end ? Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
                    features
                }
            } else {
                 subscriptionInfo = {
                    status: tenant?.subscription_status || 'active',
                    gracePeriodEnd: null,
                    daysRemaining: null,
                    features
                }
            }
        } catch {
            // Ignore DB error in dev/mock
        }
    }

    // Trigger subscription expiry notification (non-blocking, once per day)
    if (subscriptionInfo?.daysRemaining !== null && subscriptionInfo !== null && (subscriptionInfo.daysRemaining ?? 99) <= 7) {
        createSubscriptionExpiryNotification({
            daysRemaining: subscriptionInfo.daysRemaining ?? 0,
            expiryDate: subscriptionInfo.gracePeriodEnd ?? new Date().toISOString(),
        }).catch(() => {})
    }

    return (
        <DashboardLayoutClient
            defaultOpen={defaultOpen}
            userProfile={activeProfile}
            subscriptionInfo={subscriptionInfo}
            features={features}
        >
            {children}
        </DashboardLayoutClient>
    )
}
