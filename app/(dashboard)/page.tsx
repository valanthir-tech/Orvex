import Link from "next/link"
import { redirect } from "next/navigation"

import { OwnerDashboard } from "@/components/dashboard/owner-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminPortalUrl } from "@/lib/admin-portal"
import { getUserProfile } from "@/lib/user"

export default async function DashboardPage() {
    const profile = await getUserProfile()

    if (!profile) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-xl items-center">
                <Card className="w-full rounded-2xl border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle>Profile Not Found</CardTitle>
                        <CardDescription>
                            Your account exists but no store profile was found. Please contact support or try logging out and back in.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" className="btn-pill">
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (profile.role === "superadmin") {
        const adminPortalUrl = getAdminPortalUrl()

        if (adminPortalUrl) {
            redirect(adminPortalUrl)
        }

        return (
            <div className="mx-auto flex min-h-[60vh] max-w-xl items-center">
                <Card className="w-full rounded-2xl border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle>Admin Portal Required</CardTitle>
                        <CardDescription>
                            Superadmin tools now live in a separate portal so the store app stays focused on tenant operations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Set <code>NEXT_PUBLIC_ADMIN_PORTAL_URL</code> in this app to forward superadmins directly into the standalone portal.
                        </p>
                        <Button asChild className="btn-pill">
                            <Link href="/settings">Open Store Settings</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return <OwnerDashboard />
}
