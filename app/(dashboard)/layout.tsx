import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import DashboardLayoutClient from "./dashboard-layout-client"
import { getUserProfile } from "@/lib/user"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const sidebarCookie = cookieStore.get("sidebar_state")
    const defaultOpen = sidebarCookie ? sidebarCookie.value === "true" : true

    const profile = await getUserProfile()

    // Authenticated users who haven't been assigned to a tenant yet
    if (profile && !profile.tenant_id) {
        redirect("/pending")
    }

    // Fetch subscription status for reminder banner
    let subscriptionInfo: {
        status: string
        gracePeriodEnd: string | null
        daysRemaining: number | null
    } | null = null

    if (profile?.tenant_id) {
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
            }
        }
    }

    return (
        <DashboardLayoutClient
            defaultOpen={defaultOpen}
            userProfile={profile}
            subscriptionInfo={subscriptionInfo}
        >
            {children}
        </DashboardLayoutClient>
    )
}
