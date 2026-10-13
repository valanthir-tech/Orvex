import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/tenant"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldX } from "lucide-react"

export const metadata = {
    title: "Account Blocked – Onedexo",
}

export default async function BlockedPage() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminClient
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

    if (!profile?.tenant_id) redirect("/pending")

    const { data: tenant } = await adminClient
        .from("tenants")
        .select("company_name, blocked_reason, subscription_status, is_blocked")
        .eq("id", profile.tenant_id)
        .single()

    if (!tenant?.is_blocked && tenant?.subscription_status !== "blocked") {
        redirect("/")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <div className="w-full max-w-md">
                <Card className="border-0 shadow-lg rounded-2xl text-center">
                    <CardHeader className="pb-2">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                                <ShieldX className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-heading">Account Suspended</CardTitle>
                        <CardDescription className="text-base mt-1">
                            {tenant?.company_name ? `${tenant.company_name} — ` : ""}
                            Access has been suspended due to an overdue subscription.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        {tenant?.blocked_reason && (
                            <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                                {tenant.blocked_reason}
                            </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                            To restore access, please submit your renewal payment. Your account will be
                            reactivated once our team verifies the payment.
                        </p>
                        <Button asChild className="w-full h-11">
                            <Link href="/payment">Submit Renewal Payment</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full h-11">
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
