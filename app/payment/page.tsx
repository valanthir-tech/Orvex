import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/tenant"
import { getSubscriptionPlans, getPaymentQrCodes } from "@/app/actions/subscriptions"
import { PaymentForm } from "@/components/payment/payment-form"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Box, Clock } from "lucide-react"

export const metadata = {
    title: "Complete Payment – Orvex",
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

    const { data: pendingSubmission } = await adminClient
        .from("payment_submissions")
        .select("id, status, submitted_at")
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "pending")
        .maybeSingle()

    const [plans, qrCodes] = await Promise.all([
        getSubscriptionPlans(),
        getPaymentQrCodes(),
    ])

    return (
        <div className="min-h-screen bg-muted/50 flex flex-col items-center justify-center p-4 gap-6">
            {/* Header */}
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Box className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold font-heading">Orvex</h1>
                <p className="text-sm text-muted-foreground">
                    {tenant?.company_name
                        ? `Welcome, ${tenant.company_name}!`
                        : "Activate your subscription to get started."}
                </p>
            </div>

            {/* Content */}
            <div className="w-full max-w-2xl">
                {pendingSubmission ? (
                    <Card className="border-0 shadow-lg rounded-2xl">
                        <CardHeader className="text-center py-10">
                            <div className="flex justify-center mb-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                    <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                            <CardTitle className="text-xl font-heading">Payment Under Review</CardTitle>
                            <CardDescription className="mt-2 max-w-sm mx-auto">
                                Your payment was submitted on{" "}
                                {new Date(pendingSubmission.submitted_at).toLocaleDateString("en-NP", {
                                    dateStyle: "long",
                                })}
                                . Our team will verify it within 24 hours and activate your account.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <PaymentForm plans={plans} qrCodes={qrCodes} tenantId={profile.tenant_id} />
                )}
            </div>
        </div>
    )
}
