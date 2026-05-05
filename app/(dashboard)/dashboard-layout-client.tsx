"use client"

import { useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { PaymentReminderBanner } from "@/components/payment/payment-reminder-banner"
import { NepaliDateDisplay } from "@/components/ui/nepali-date-display"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

// Page titles based on routes
const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/pos": "Point of Sale",
    "/orders": "Orders",
    "/products": "Products",
    "/stock/inventory": "Inventory",
    "/customers": "Customers",
    "/stock/entries": "Stock Entries",
    "/reports": "Reports",
    "/settings": "Settings",
    "/settings/subscription": "Subscription",
    "/notifications": "Notifications",
}

export default function DashboardLayoutClient({
    children,
    defaultOpen,
    userProfile,
    subscriptionInfo,
    features,
}: {
    children: React.ReactNode
    defaultOpen: boolean
    userProfile?: any
    subscriptionInfo?: {
        status: string
        gracePeriodEnd: string | null
        daysRemaining: number | null
    } | null
    features: any
}) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(defaultOpen)

    const handleOpenChange = useCallback((open: boolean) => {
        setSidebarOpen(open)
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    }, [])

    let title = pageTitles[pathname]
    if (!title) {
        if (pathname.startsWith("/products/")) title = "Products"
        else title = "Dashboard"
    }

    return (
        <SidebarProvider open={sidebarOpen} onOpenChange={handleOpenChange} className="bg-zinc-100 dark:bg-zinc-950 p-2 md:p-3 overflow-hidden rounded-[1.5rem]">
            <AppSidebar userProfile={userProfile ? {
                name: [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') || userProfile.email?.split('@')[0] || 'Admin',
                email: userProfile.email,
                avatar: "/avatars/shadcn.jpg"
            } : undefined} features={features} />
            <SidebarInset className="bg-background rounded-[1.5rem] border border-border/50 shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex-1 m-0 md:ml-2 relative min-h-[calc(100vh-1.5rem)]">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/">
                                        Inventory
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{title}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    
                    <div className="hidden md:flex items-center">
                        <NepaliDateDisplay />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {subscriptionInfo && ["past_due", "pending_payment"].includes(subscriptionInfo.status) && (
                        <PaymentReminderBanner
                            status={subscriptionInfo.status as "past_due" | "pending_payment" | "blocked"}
                            daysRemaining={subscriptionInfo.daysRemaining}
                            gracePeriodEnd={subscriptionInfo.gracePeriodEnd}
                        />
                    )}
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
