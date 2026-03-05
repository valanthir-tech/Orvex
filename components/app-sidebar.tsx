"use client"

import * as React from "react"
import {
    Archive,
    BarChart3,
    Box,
    Command,
    Home,
    LayoutDashboard,
    LifeBuoy,
    Package,
    Send,
    Settings2,
    ShoppingCart,
    Warehouse,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

const navigationBlocks = {
    navMain: [
        {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
            isActive: true,
        },
        {
            title: "Point of Sale",
            url: "/pos",
            icon: ShoppingCart,
        },
        {
            title: "Products",
            url: "/products",
            icon: Package,
        },
        {
            title: "Inventory",
            url: "/inventory",
            icon: Warehouse,
        },
        {
            title: "Stock Management",
            url: "#",
            icon: Box,
            items: [
                {
                    title: "Items & Products",
                    url: "/items",
                },
                {
                    title: "Warehouses",
                    url: "/warehouses",
                },
                {
                    title: "Stock Entries",
                    url: "/stock/entries",
                },
            ],
        },
        {
            title: "Analytics",
            url: "/reports",
            icon: BarChart3,
        },
        {
            title: "Settings",
            url: "/settings",
            icon: Settings2,
        },
    ],
    navSecondary: [
        {
            title: "Support",
            url: "#",
            icon: LifeBuoy,
        },
        {
            title: "Feedback",
            url: "#",
            icon: Send,
        },
    ]
}

export function AppSidebar({ userProfile, ...props }: React.ComponentProps<typeof Sidebar> & { userProfile?: { name: string, email: string, avatar: string } }) {
    return (
        <Sidebar variant="inset" collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/">
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">Inventory POS</span>
                                    <span className="truncate text-xs">Valanthir</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navigationBlocks.navMain} />
                <NavSecondary items={navigationBlocks.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                {userProfile && <NavUser user={userProfile} />}
            </SidebarFooter>
        </Sidebar>
    )
}
