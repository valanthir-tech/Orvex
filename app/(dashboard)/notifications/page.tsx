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
    RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { cardStyles, badgeStyles } from "@/lib/theme"
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    type AppNotification,
} from "@/app/actions/notifications"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TypeIcon({ type, className }: { type: AppNotification["type"]; className?: string }) {
    const cls = cn("h-5 w-5 text-white", className)
    switch (type) {
        case "low_stock":           return <Package className={cls} />
        case "payment_approved":    return <CreditCard className={cls} />
        case "payment_rejected":    return <CreditCard className={cls} />
        case "subscription_expiry": return <CalendarClock className={cls} />
        default:                    return <Info className={cls} />
    }
}

function typeCardStyle(type: AppNotification["type"]) {
    switch (type) {
        case "low_stock":           return cardStyles.amber
        case "payment_approved":    return cardStyles.emerald
        case "payment_rejected":    return cardStyles.rose
        case "subscription_expiry": return cardStyles.violet
        default:                    return cardStyles.sky
    }
}

function typeBadge(type: AppNotification["type"]): string {
    switch (type) {
        case "low_stock":           return badgeStyles.warning
        case "payment_approved":    return badgeStyles.success
        case "payment_rejected":    return badgeStyles.danger
        case "subscription_expiry": return badgeStyles.violet
        default:                    return badgeStyles.info
    }
}

function typeLabel(type: AppNotification["type"]): string {
    switch (type) {
        case "low_stock":           return "Low Stock"
        case "payment_approved":    return "Approved"
        case "payment_rejected":    return "Rejected"
        case "subscription_expiry": return "Subscription"
        default:                    return "General"
    }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    const unreadCount = notifications.filter((n) => !n.is_read).length

    const load = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await getNotifications()
            setNotifications(data)
        } catch {
            // silent
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    // Realtime
    useEffect(() => {
        const supabase = createSupabaseBrowserClient()
        let channel: ReturnType<typeof supabase.channel> | null = null

        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return
            const { data: profile } = await supabase
                .from("profiles")
                .select("tenant_id")
                .eq("id", user.id)
                .single()
            if (!profile?.tenant_id) return

            channel = supabase
                .channel(`notifications-page:${profile.tenant_id}`)
                .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `tenant_id=eq.${profile.tenant_id}` },
                    (payload) => setNotifications((prev) => [payload.new as AppNotification, ...prev])
                )
                .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `tenant_id=eq.${profile.tenant_id}` },
                    (payload) => setNotifications((prev) =>
                        prev.map((n) => n.id === (payload.new as AppNotification).id ? (payload.new as AppNotification) : n)
                    )
                )
                .subscribe()
        })

        return () => { if (channel) supabase.removeChannel(channel) }
    }, [])

    function handleMarkRead(id: string) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        startTransition(() => markNotificationRead(id))
    }

    function handleMarkAllRead() {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        startTransition(() => markAllNotificationsRead())
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading tracking-tight">Notifications</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {unreadCount > 0
                            ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                            : "Alerts for payments, stock, and subscriptions appear here"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-11 w-11"
                        onClick={load}
                        disabled={isLoading}
                        title="Refresh"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                    {unreadCount > 0 && (
                        <Button
                            className="btn-pill gap-2 h-11 shadow-lg shadow-primary/20"
                            onClick={handleMarkAllRead}
                            disabled={isPending}
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                    <div className={cn(cardStyles.sky.icon, "mb-4")}>
                        <Bell className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-base font-semibold">No notifications yet</p>
                    <p className="text-sm mt-1">Alerts for payments, stock, and subscriptions will appear here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((n) => {
                        const style = typeCardStyle(n.type)
                        return (
                            <button
                                key={n.id}
                                onClick={() => !n.is_read && handleMarkRead(n.id)}
                                className={cn(
                                    "w-full text-left",
                                    !n.is_read ? "cursor-pointer" : "cursor-default"
                                )}
                            >
                                <Card className={cn(style.card, n.is_read && "opacity-60")}>
                                    <div className={style.overlay} />
                                    <CardHeader className="relative flex flex-row items-center gap-4 pb-2 pt-4 px-4">
                                        <div className={style.icon}>
                                            <TypeIcon type={n.type} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <CardTitle className="text-sm font-semibold leading-tight">
                                                    {n.title}
                                                </CardTitle>
                                                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", typeBadge(n.type))}>
                                                    {typeLabel(n.type)}
                                                </span>
                                                {!n.is_read && (
                                                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground shrink-0">
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="relative px-4 pb-4 pt-0">
                                        <p className="text-sm text-muted-foreground leading-snug pl-14">{n.message}</p>
                                    </CardContent>
                                </Card>
                            </button>
                        )
                    })}
                    <p className="text-center text-xs text-muted-foreground pt-2">
                        Showing last {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                    </p>
                </div>
            )}
        </div>
    )
}
