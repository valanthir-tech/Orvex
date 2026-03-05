import { cookies } from "next/headers"
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

    return (
        <DashboardLayoutClient defaultOpen={defaultOpen} userProfile={profile}>
            {children}
        </DashboardLayoutClient>
    )
}
