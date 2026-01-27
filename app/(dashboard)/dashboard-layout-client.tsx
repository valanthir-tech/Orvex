"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/common"
import { Bell, Search, User } from "lucide-react"

// Page titles based on routes
const pageTitles: Record<string, { title: string; description?: string }> = {
    "/": { title: "Dashboard", description: "Overview of your inventory and sales" },
    "/pos": { title: "Point of Sale", description: "Create new sales transactions" },
    "/items": { title: "Items & Products", description: "Manage your product catalog" },
    "/items/new": { title: "New Item", description: "Add a new product" },
    "/warehouses": { title: "Warehouses", description: "Manage storage locations" },
    "/stock/entries": { title: "Stock Entries", description: "Track stock movements" },
    "/reports": { title: "Reports", description: "Analytics and insights" },
    "/settings": { title: "Settings", description: "Configure your preferences" },
}

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    // Handle dynamic routes matching (simple startsWith for now)
    let pageInfo = pageTitles[pathname]

    if (!pageInfo) {
        // Fallback for sub-routes
        if (pathname.startsWith("/items/")) pageInfo = { title: "Items", description: "Item Details" }
        else pageInfo = { title: "Dashboard", description: "" }
    }

    return (
        <SidebarProvider>z
            <AppSidebar />
            <SidebarInset>
                {/* Header - Floating Glass Effect */}
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 glass border-b border-border/50 px-6">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-5" />

                    {/* Page Title */}
                    <div className="flex-1">
                        <h1 className="text-base font-semibold font-heading">{pageInfo.title}</h1>
                    </div>

                    {/* Search - Pill Style */}
                    <Button
                        variant="secondary"
                        size="sm"
                        className="hidden md:flex gap-2 text-muted-foreground hover:text-foreground w-64 justify-start rounded-full h-10 px-4"
                    >
                        <Search className="h-4 w-4" />
                        <span className="flex-1 text-left">Search...</span>
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded-md border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </Button>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full relative">
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                                3
                            </span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                            <User className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-muted/30">
                    <div className="p-6 md:p-8">
                        {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
