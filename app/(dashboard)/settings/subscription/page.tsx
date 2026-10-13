import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { getTenantSubscription, getPaymentSubmissions, getSubscriptionPlans, getPaymentQrCodes } from "@/app/actions/subscriptions"
import { SubscriptionSettingsClient } from "@/components/payment/subscription-settings-client"

export const metadata = {
    title: "Subscription – Onedexo",
}

export default async function SubscriptionSettingsPage() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminClient
        .from("profiles")
        .select("tenant_id, role")
        .eq("id", user.id)
        .single()

    if (!profile?.tenant_id) redirect("/pending")

    const { data: tenant } = await adminClient
        .from("tenants")
        .select("created_at")
        .eq("id", profile.tenant_id)
        .single()

    const [subscription, submissions, plans, qrCodes] = await Promise.all([
        getTenantSubscription(),
        getPaymentSubmissions(),
        getSubscriptionPlans(),
        getPaymentQrCodes(),
    ])

    return (
        <SubscriptionSettingsClient
            subscription={subscription}
            submissions={submissions}
            plans={plans}
            qrCodes={qrCodes}
            tenantId={profile.tenant_id}
            tenantCreatedAt={tenant?.created_at}
        />
    )
}
