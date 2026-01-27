"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
    Archive,
    BarChart3,
    Box,
    ChevronRight,
    Home,
    LayoutDashboard,
    Settings,
    ShoppingCart,
    Sparkles,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar"

// Main navigation items based on PRD modules
const mainNavItems = [
    {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Point of Sale",
        url: "/pos",
        icon: ShoppingCart,
        badge: "POS",
    },
]

const inventoryItems = [
    {
        title: "Items & Products",
        url: "/items",
        icon: Box,
    },
    {
        title: "Warehouses",
        url: "/warehouses",
        icon: Home,
    },
    {
        title: "Stock Entries",
        url: "/stock/entries",
        icon: Archive,
    },
]

const analyticsItems = [
    {
        title: "Reports",
        url: "/reports",
        icon: BarChart3,
    },
]

export function AppSidebar() {
    const pathname = usePathname()

    const isActive = (url: string) => {
        if (url === "/") return pathname === "/"
        return pathname.startsWith(url)
    }

    return (
        <Sidebar className="border-r">
            <SidebarHeader className="p-4">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                        <Box className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-semibold tracking-tight">Inventory POS</span>
                        <span className="text-xs text-muted-foreground">Nepal Edition</span>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-2">
                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                        Main
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                        tooltip={item.title}
                                        className="transition-all duration-150"
                                    >
                                        <Link href={item.url} className="relative">
                                            <item.icon className="h-4 w-4" />
                                            <span className="flex-1">{item.title}</span>
                                            {item.badge && (
                                                <span className="ml-auto flex h-5 items-center justify-center rounded bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="my-2" />

                {/* Inventory */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                        Inventory
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {inventoryItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                        tooltip={item.title}
                                        className="transition-all duration-150"
                                    >
                                        <Link href={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="my-2" />

                {/* Analytics */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                        Analytics
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {analyticsItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                        tooltip={item.title}
                                        className="transition-all duration-150"
                                    >
                                        <Link href={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive("/settings")}
                            tooltip="Settings"
                            className="transition-all duration-150"
                        >
                            <Link href="/settings">
                                <Settings className="h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* Pro Upgrade Banner */}
                <div className="mt-2 rounded-lg border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-3">
                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">Upgrade to Pro</p>
                            <p className="text-xs text-muted-foreground">
                                Access AI insights & more
                            </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}
