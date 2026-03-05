import { getUserProfile } from "@/lib/user"
import { OwnerDashboard } from "@/components/dashboard/owner-view"
import { SuperadminDashboard } from "@/components/dashboard/superadmin-view"

export default async function DashboardPage() {
    // Determine the current user's profile and roles.
    const profile = await getUserProfile()

    // 1. If explicitly a superadmin, show the control panel
    if (profile?.role === 'superadmin') {
        return <SuperadminDashboard />
    }

    // 2. Otherwise, return the standard Store Owner dashboard
    // Note: We'll likely refine this if 'staff' has a highly restricted view later.
    return <OwnerDashboard />
}
