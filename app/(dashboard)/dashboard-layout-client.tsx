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
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

// Page titles based on routes
const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/pos": "Point of Sale",
    "/products": "Products",
    "/inventory": "Inventory",
    "/items": "Items & Products",
    "/items/new": "New Item",
    "/warehouses": "Warehouses",
    "/stock/entries": "Stock Entries",
    "/reports": "Reports",
    "/settings": "Settings",
}

export default function DashboardLayoutClient({
    children,
    defaultOpen,
    userProfile,
}: {
    children: React.ReactNode
    defaultOpen: boolean
    userProfile?: any
}) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(defaultOpen)

    const handleOpenChange = useCallback((open: boolean) => {
        setSidebarOpen(open)
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    }, [])

    let title = pageTitles[pathname]
    if (!title) {
        if (pathname.startsWith("/items/")) title = "Items"
        else title = "Dashboard"
    }

    return (
        <SidebarProvider open={sidebarOpen} onOpenChange={handleOpenChange}>
            <AppSidebar userProfile={userProfile ? {
                name: `${userProfile.first_name} ${userProfile.last_name}`.trim() || 'Admin',
                email: userProfile.email,
                avatar: "/avatars/shadcn.jpg"
            } : undefined} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2">
                    <div className="flex items-center gap-2 px-4">
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
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-20 lg:pb-4">
                    {children}
                </div>
            </SidebarInset>
            <MobileBottomNav />
        </SidebarProvider>
    )
}
