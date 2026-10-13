import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/tenant"
import { getSubscriptionPlans, getPaymentQrCodes } from "@/app/actions/subscriptions"
import { PaymentForm } from "@/components/payment/payment-form"
import { Clock } from "lucide-react"
import Image from "next/image"

export const metadata = {
    title: "Complete Payment | Onedexo",
}

export default async function PaymentPage() {
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
    if (profile.role === "superadmin") redirect("/login")

    const { data: tenant } = await adminClient
        .from("tenants")
        .select("subscription_status, is_blocked, company_name")
        .eq("id", profile.tenant_id)
        .single()

    if (tenant?.subscription_status === "active" && !tenant?.is_blocked) {
        redirect("/")
    }

    if (tenant?.subscription_status === "waiting_approval") {
        redirect("/pending")
    }

    const [plans, qrCodes] = await Promise.all([
        getSubscriptionPlans(),
        getPaymentQrCodes(),
    ])

    return (
        <div className="min-h-screen bg-[#fcfbf9] flex flex-col items-center py-20 px-4 font-sans text-[#171717]">
            {/* Header */}
            <div className="flex flex-col items-center gap-4 text-center mb-12">
                <Image src="/onedexo-horizontal.png" alt="Onedexo" width={220} height={60} className="h-12 w-auto object-contain" priority />
                <p className="text-base tracking-wide text-[#171717]/60">
                    {tenant?.company_name
                        ? `Welcome, ${tenant.company_name}!`
                        : "Activate your subscription to get started."}
                </p>
            </div>

            {/* Content */}
            <div className="w-full max-w-4xl">
                <PaymentForm plans={plans} qrCodes={qrCodes} tenantId={profile.tenant_id} />
            </div>
        </div>
    )
}
