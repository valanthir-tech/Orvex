"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Plus, Calendar, Filter, MoreHorizontal, ShoppingCart, Globe, Clock, CheckCircle2, Package, Truck, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getOrders, updateOrderStatus, type OrderRecord } from "@/app/actions/orders"
import { badgeStyles, cardStyles } from "@/lib/theme"

export default function OrdersPageClient() {
    const [orders, setOrders] = useState<OrderRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filterSource, setFilterSource] = useState<"all" | "pos" | "web">("all")

    const loadOrders = useCallback(async () => {
        try {
            const data = await getOrders()
            setOrders(data)
        } catch {
            toast.error("Failed to load orders")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { loadOrders() }, [loadOrders])

    const filteredOrders = useMemo(() => {
        return orders.filter(o =>
            (filterSource === "all" || o.source === filterSource) &&
            (o.name.toLowerCase().includes(search.toLowerCase()) ||
                o.customer.toLowerCase().includes(search.toLowerCase()))
        )
    }, [orders, search, filterSource])

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0]
        const todayOrders = orders.filter(o => o.posting_date === today)
        return {
            total: orders.length,
            web: orders.filter(o => o.source === 'web').length,
            pos: orders.filter(o => o.source === 'pos').length,
            revenue: orders.reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0)
        }
    }, [orders])

    // UI Helpers
    const getSourceIcon = (source: string) => {
        return source === 'web' ? <Globe className="h-4 w-4 text-sky-500" /> : <ShoppingCart className="h-4 w-4 text-teal-500" />
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Paid':
            case 'Dispatched':
            case 'Completed':
                return <Badge className={`${badgeStyles.success} text-xs`}>{status}</Badge>
            case 'Pending':
            case 'Processing':
                return <Badge className={`${badgeStyles.warning} text-xs`}>{status}</Badge>
            case 'Draft':
                return <Badge className={`${badgeStyles.info} text-xs`}>{status}</Badge>
            default:
                return <Badge variant="outline" className="text-xs">{status}</Badge>
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold font-heading tracking-tight">Omnichannel Orders</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Manage online website orders and in-store POS transactions
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className={cardStyles.teal.card}>
                    <div className={cardStyles.teal.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <div className={cardStyles.teal.icon}>
                            <ShoppingCart className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold font-heading">Rs. {(Number(stats.revenue) || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className={cardStyles.sky.card}>
                    <div className={cardStyles.sky.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Online Orders</CardTitle>
                        <div className={cardStyles.sky.icon}>
                            <Globe className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold font-heading">{stats.web}</div>
                        <p className="text-xs text-muted-foreground mt-1">From custom storefront</p>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search order ID or customer..."
                                className="pl-9 h-10 w-64 rounded-xl"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={filterSource === "all" ? "default" : "outline"}
                            size="sm"
                            className={filterSource === "all" ? "rounded-xl shadow-lg shadow-primary/20" : "rounded-xl"}
                            onClick={() => setFilterSource("all")}
                        >
                            All
                        </Button>
                        <Button
                            variant={filterSource === "pos" ? "default" : "outline"}
                            size="sm"
                            className={filterSource === "pos" ? "rounded-xl shadow-lg shadow-primary/20" : "rounded-xl"}
                            onClick={() => setFilterSource("pos")}
                        >
                            In-Store (POS)
                        </Button>
                        <Button
                            variant={filterSource === "web" ? "default" : "outline"}
                            size="sm"
                            className={filterSource === "web" ? "rounded-xl shadow-lg shadow-primary/20" : "rounded-xl"}
                            onClick={() => setFilterSource("web")}
                        >
                            Online (Web)
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Source</TableHead>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Fulfillment</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto opacity-50" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order: any) => (
                                    <TableRow key={order.name} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="p-2 rounded-lg bg-muted/50 inline-flex" title={order.source === 'web' ? 'Online Store' : 'POS Cashier'}>
                                                {getSourceIcon(order.source)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm font-medium">{order.name}</TableCell>
                                        <TableCell>{order.customer}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{order.posting_date}</TableCell>
                                        <TableCell className="text-right font-semibold">Rs. {(Number(order.grand_total) || 0).toLocaleString()}</TableCell>
                                        <TableCell>{getStatusBadge(order.payment_status)}</TableCell>
                                        <TableCell>{getStatusBadge(order.delivery_status)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <ArrowRight className="h-4 w-4 mr-2" /> View Details
                                                    </DropdownMenuItem>
                                                    {order.source === 'web' && order.delivery_status === 'Processing' && (
                                                        <DropdownMenuItem className="cursor-pointer font-medium text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/50">
                                                            <Truck className="h-4 w-4 mr-2" /> Mark as Dispatched
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
