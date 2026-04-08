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
    History,
    Warehouse,
    Store,
    Inbox,
} from "lucide-react"

import Image from "next/image"

import { usePathname } from "next/navigation"

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
        },
        {
            title: "Point of Sale",
            url: "/pos",
            icon: ShoppingCart,
        },
        {
            title: "Activity Log",
            url: "/history",
            icon: History,
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
            title: "Storefront",
            url: "/storefront",
            icon: Store,
        },
        {
            title: "Inbox",
            url: "/inbox",
            icon: Inbox,
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
                    title: "Inventory",
                    url: "/stock/inventory",
                },
                {
                    title: "Categories",
                    url: "/categories",
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
            url: "mailto:orvex@valanthir.com",
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
    const pathname = usePathname()
    const [feedbackOpen, setFeedbackOpen] = useState(false)

    // Filter main navigation based on features
    const filteredNavMain = navigationBlocks.navMain.map(item => ({
        ...item,
        isActive: pathname === item.url || !!(item.items && item.items.some(subItem => pathname && pathname.startsWith(subItem.url)))
    }))

    const navSecondaryWithHandlers = navigationBlocks.navSecondary.map((item) =>
        item.title === "Feedback"
            ? { ...item, onClick: () => setFeedbackOpen(true) }
            : item
    )

    return (
        <Sidebar variant="floating" className="rounded-[1.5rem] !drop-shadow-xl overflow-hidden border-border/10" collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/">
                                <div className="flex h-12 items-center justify-center p-1">
                                    <Image src="/orvex-horizontal.png" alt="Orvex" width={140} height={40} className="h-9 w-auto mix-blend-multiply" />
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
