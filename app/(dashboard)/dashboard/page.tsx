import Link from "next/link"
import { redirect } from "next/navigation"

import { OwnerDashboard } from "@/components/dashboard/owner-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminPortalUrl } from "@/lib/admin-portal"
import { getUserProfile } from "@/lib/user"

export default async function DashboardPage() {
    const profile = await getUserProfile()

    if (profile?.role === "superadmin") {
        const adminPortalUrl = getAdminPortalUrl()

        if (adminPortalUrl) {
            redirect(adminPortalUrl)
        }
    }

    return <OwnerDashboard />
}
