"use client"

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

// Page titles based on routes
const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/pos": "Point of Sale",
    "/items": "Items & Products",
    "/items/new": "New Item",
    "/warehouses": "Warehouses",
    "/stock/entries": "Stock Entries",
    "/reports": "Reports",
    "/settings": "Settings",
}

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    let title = pageTitles[pathname]

    if (!title) {
        if (pathname.startsWith("/items/")) title = "Items"
        else title = "Dashboard"
    }

    // Split title for breadcrumbs (simple implementation)
    // For now just Home > Title

    return (
        <SidebarProvider>
            <AppSidebar />
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
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
