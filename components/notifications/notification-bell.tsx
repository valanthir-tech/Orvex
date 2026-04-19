"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"
import {
    Bell,
    CheckCheck,
    Package,
    CreditCard,
    CalendarClock,
    Info,
    X,
    ShoppingBag,
    ShieldAlert,
    Printer,
    ServerCrash,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    type AppNotification,
} from "@/app/actions/notifications"

// ─── Icon per notification type ──────────────────────────────────────────────

function TypeIcon({ type }: { type: AppNotification["type"] }) {
    const cls = "h-4 w-4"
    switch (type) {
        case "low_stock":          return <Package className={cls} />
        case "payment_approved":   return <CreditCard className={cls} />
        case "payment_rejected":   return <CreditCard className={cls} />
        case "subscription_expiry": return <CalendarClock className={cls} />
        case "order":              return <ShoppingBag className={cls} />
        case "security":           return <ShieldAlert className={cls} />
        case "hardware":           return <Printer className={cls} />
        case "system":             return <ServerCrash className={cls} />
        default:                   return <Info className={cls} />
    }
}

function typeIconBg(type: AppNotification["type"]): string {
    switch (type) {
        case "low_stock":           return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        case "payment_approved":    return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        case "payment_rejected":    return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        case "subscription_expiry": return "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
        case "order":               return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        case "security":            return "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
        case "hardware":            return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        case "system":              return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400"
        default:                    return "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface NotificationBellProps {
    tenantId: string
}

export function NotificationBell({ tenantId }: NotificationBellProps) {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    const unreadCount = notifications.filter((n) => !n.is_read).length

    // ── Load ─────────────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        try {
            const data = await getNotifications()
            setNotifications(data)
        } catch {
            // silent — bell failing shouldn't break the page
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    // ── Realtime subscription ─────────────────────────────────────────────────
    useEffect(() => {
        const supabase = createSupabaseBrowserClient()

        const channel = supabase
            .channel(`notifications:${tenantId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `tenant_id=eq.${tenantId}`,
                },
                (payload) => {
                    setNotifications((prev) => [payload.new as AppNotification, ...prev])
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "notifications",
                    filter: `tenant_id=eq.${tenantId}`,
                },
                (payload) => {
                    setNotifications((prev) =>
                        prev.map((n) =>
                            n.id === (payload.new as AppNotification).id
                                ? (payload.new as AppNotification)
                                : n
                        )
                    )
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [tenantId])

    // ── Handlers ─────────────────────────────────────────────────────────────
    function handleMarkRead(id: string) {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
        startTransition(() => markNotificationRead(id))
    }

    function handleMarkAllRead() {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        startTransition(() => markAllNotificationsRead())
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative h-9 w-9 rounded-xl"
                    aria-label="Notifications"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[340px] p-0 rounded-2xl shadow-xl border-0 ring-1 ring-border overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <div>
                        <p className="font-semibold text-sm">Notifications</p>
                        <p className="text-xs text-muted-foreground">
                            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1 rounded-lg px-2"
                                onClick={handleMarkAllRead}
                                disabled={isPending}
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                All read
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={() => setOpen(false)}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* List */}
                <ScrollArea className="max-h-[420px]">
                    {isLoading ? (
                        <div className="space-y-px p-3">
                            {Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse mb-2" />
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                            <Bell className="h-9 w-9 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No notifications yet</p>
                            <p className="text-xs mt-1">You'll see alerts here as they arrive</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {notifications.map((n) => (
                                <button
                                    key={n.id}
                                    className={cn(
                                        "w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-muted/40",
                                        !n.is_read && "bg-primary/5 hover:bg-primary/8"
                                    )}
                                    onClick={() => { if (!n.is_read) { handleMarkRead(n.id) }; if (n.action_url) { window.location.href = n.action_url } }}
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                        typeIconBg(n.type)
                                    )}>
                                        <TypeIcon type={n.type} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium leading-tight line-clamp-1">
                                                {n.title}
                                            </p>
                                            {!n.is_read && (
                                                <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                            {n.message}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground/60 mt-1">
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {!isLoading && notifications.length > 0 && (
                    <div className="border-t px-4 py-2 bg-muted/20 text-center">
                        <p className="text-[11px] text-muted-foreground">
                            Showing last {notifications.length} notifications
                        </p>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}


