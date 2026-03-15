"use client"

import * as React from "react"
import { useState } from "react"
import {
    Archive,
    BarChart3,
    Box,
    Command,
    Home,
    LifeBuoy,
    Package,
    Send,
    Settings2,
    ShoppingCart,
    Tag,
    Users,
    Warehouse,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { FeedbackDialog } from "@/components/feedback/feedback-dialog"
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
            title: "Home",
            url: "/",
            icon: Home,
            isActive: true,
        },
        {
            title: "Point of Sale",
            url: "/pos",
            icon: ShoppingCart,
        },
        {
            title: "Orders",
            url: "/orders",
            icon: Archive,
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
            title: "Customers",
            url: "/customers",
            icon: Users,
        },
        {
            title: "Stock Management",
            url: "#",
            icon: Box,
            items: [
                {
                    title: "Categories",
                    url: "/categories",
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
            items: [
                {
                    title: "Store Settings",
                    url: "/settings",
                },
                {
                    title: "Subscription",
                    url: "/settings/subscription",
                },
            ],
        },
    ],
    navSecondary: [
        {
            title: "Support",
            url: "mailto:support@valanthir.com",
            icon: LifeBuoy,
        },
        {
            title: "Feedback",
            url: "#",
            icon: Send,
        },
    ]
}

export function AppSidebar({ userProfile, features, ...props }: React.ComponentProps<typeof Sidebar> & { 
    userProfile?: { name: string, email: string, avatar: string }, 
    features?: any 
}) {
    const [feedbackOpen, setFeedbackOpen] = useState(false)

    // Filter main navigation based on features
    const filteredNavMain = navigationBlocks.navMain.map(navItem => {
        if (navItem.title === "Stock Management") {
            // Filter warehouses from Stock Management if no multi_warehouse feature
            const filteredItems = navItem.items?.filter(subItem => {
                if (subItem.url === "/warehouses" && !features?.multi_warehouse) return false;
                return true;
            })
            return { ...navItem, items: filteredItems }
        }
        return navItem;
    })

    const navSecondaryWithHandlers = navigationBlocks.navSecondary.map((item) =>
        item.title === "Feedback"
            ? { ...item, onClick: () => setFeedbackOpen(true) }
            : item
    )

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
                                    <span className="truncate font-medium">Valanthir IMS</span>
                                    <span className="truncate text-xs">Store Workspace</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={filteredNavMain} />
                <NavSecondary items={navSecondaryWithHandlers} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                {userProfile && <NavUser user={userProfile} />}
            </SidebarFooter>
            <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
        </Sidebar>
    )
}
