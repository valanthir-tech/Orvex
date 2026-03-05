"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Warehouse,
    Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    {
        label: "Home",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        label: "POS",
        href: "/pos",
        icon: ShoppingCart,
    },
    {
        label: "Products",
        href: "/products",
        icon: Package,
    },
    {
        label: "Inventory",
        href: "/inventory",
        icon: Warehouse,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
    },
]

export function MobileBottomNav() {
    const pathname = usePathname()

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 safe-area-inset-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive =
                        item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-5 w-5 transition-all",
                                    isActive && "scale-110"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[10px] leading-tight",
                                    isActive
                                        ? "font-semibold"
                                        : "font-medium"
                                )}
                            >
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute top-0 h-0.5 w-8 bg-primary rounded-full" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
