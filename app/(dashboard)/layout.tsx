import { redirect } from "next/navigation"
import { getProfile, getCurrentUser } from "@/lib/auth"
import DashboardLayoutClient from "./dashboard-layout-client"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // 1. Check Auth (Middleware handles this but good to be safe)
    const user = await getCurrentUser()
    if (!user) {
        redirect("/login")
    }

    // 2. Check Profile/Organization
    const profile = await getProfile()
    if (!profile) {
        redirect("/setup")
    }

    return (
        <DashboardLayoutClient>
            {children}
        </DashboardLayoutClient>
    )
}
