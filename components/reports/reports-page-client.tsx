"use client"

import { useState, useEffect, useCallback } from "react"
import {
    DollarSign,
    Receipt,
    TrendingUp,
    CreditCard,
    Calendar,
    Package,
    Loader2,
    RefreshCw,
    BarChart3,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { Progress } from "@/components/ui/progress"
import { cardStyles } from "@/lib/theme"
import {
    getSalesSummary,
    getDailySales,
    getTopSellingItems,
    getPaymentBreakdown,
    type SalesSummary,
    type DailySalesData,
    type TopSellingItem,
    type PaymentBreakdown,
} from "@/app/actions/reports"

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReportsPageClient() {
    const [summary, setSummary] = useState<SalesSummary | null>(null)
    const [dailySales, setDailySales] = useState<DailySalesData[]>([])
    const [topItems, setTopItems] = useState<TopSellingItem[]>([])
    const [payments, setPayments] = useState<PaymentBreakdown[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadData = useCallback(async () => {
        try {
            const [s, d, t, p] = await Promise.all([
                getSalesSummary(),
                getDailySales(7),
                getTopSellingItems(10),
                getPaymentBreakdown(),
            ])
            setSummary(s)
            setDailySales(d)
            setTopItems(t)
            setPayments(p)
        } catch {
            toast.error("Failed to load reports data")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const maxDailySales = Math.max(
        ...dailySales.map((d) => d.totalSales),
        1
    )
    const totalPaymentAmount = payments.reduce((s, p) => s + p.amount, 0)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading tracking-tight">
                        Reports & Analytics
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Sales performance and business insights
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => {
                        setIsLoading(true)
                        loadData()
                    }}
                    className="rounded-xl h-11 gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className={cardStyles.emerald.card}>
                    <div className={cardStyles.emerald.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Today&apos;s Sales
                        </CardTitle>
                        <div className={cardStyles.emerald.icon}>
                            <DollarSign className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">
                            Rs.{" "}
                            {(summary?.todaySales || 0).toLocaleString()}
                        </div>
                        <div className="text-xs mt-2 text-muted-foreground">
                            {summary?.todayInvoices || 0} invoices today
                        </div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.sky.card}>
                    <div className={cardStyles.sky.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            VAT Collected
                        </CardTitle>
                        <div className={cardStyles.sky.icon}>
                            <Receipt className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">
                            Rs.{" "}
                            {(summary?.todayTax || 0).toLocaleString()}
                        </div>
                        <div className="text-xs mt-2 text-muted-foreground">
                            13% VAT today
                        </div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.violet.card}>
                    <div className={cardStyles.violet.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            This Week
                        </CardTitle>
                        <div className={cardStyles.violet.icon}>
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">
                            Rs.{" "}
                            {(summary?.weekSales || 0).toLocaleString()}
                        </div>
                        <div className="text-xs mt-2 text-muted-foreground">
                            {summary?.weekInvoices || 0} invoices
                        </div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.amber.card}>
                    <div className={cardStyles.amber.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            This Month
                        </CardTitle>
                        <div className={cardStyles.amber.icon}>
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">
                            Rs.{" "}
                            {(summary?.monthSales || 0).toLocaleString()}
                        </div>
                        <div className="text-xs mt-2 text-muted-foreground">
                            {summary?.monthInvoices || 0} invoices
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Two-column layout: Daily Sales + Payment Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Sales (last 7 days) */}
                <Card className="card-float border-0 rounded-2xl lg:col-span-2">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <CardTitle className="text-lg font-heading">
                                    Daily Sales (Last 7 Days)
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Sales trend overview
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {dailySales.length === 0 ? (
                            <div className="h-32 flex items-center justify-center text-muted-foreground">
                                <p className="text-sm">No sales data available</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dailySales.map((day) => {
                                    const dayName = new Date(
                                        day.date + "T00:00:00"
                                    ).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                    })
                                    const pct =
                                        (day.totalSales / maxDailySales) * 100
                                    return (
                                        <div
                                            key={day.date}
                                            className="flex items-center gap-4"
                                        >
                                            <span className="text-sm text-muted-foreground w-24 shrink-0">
                                                {dayName}
                                            </span>
                                            <div className="flex-1">
                                                <Progress
                                                    value={pct}
                                                    className="h-3"
                                                />
                                            </div>
                                            <div className="text-right w-28 shrink-0">
                                                <span className="text-sm font-semibold">
                                                    Rs.{" "}
                                                    {day.totalSales.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    ({day.invoiceCount})
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Mode Breakdown */}
                <Card className="card-float border-0 rounded-2xl">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <CardTitle className="text-lg font-heading">
                                    Payment Methods
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Today&apos;s breakdown
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {payments.length === 0 ? (
                            <div className="h-32 flex items-center justify-center text-muted-foreground">
                                <p className="text-sm">No payments today</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {payments.map((p) => {
                                    const pct = totalPaymentAmount
                                        ? (p.amount / totalPaymentAmount) *
                                          100
                                        : 0
                                    return (
                                        <div
                                            key={p.mode}
                                            className="space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">
                                                    {p.mode}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {p.count} txns
                                                </span>
                                            </div>
                                            <Progress
                                                value={pct}
                                                className="h-2"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Rs.{" "}
                                                {p.amount.toLocaleString()} (
                                                {pct.toFixed(0)}%)
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Selling Items */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="border-b border-border/50 pb-4">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <CardTitle className="text-lg font-heading">
                                Top Selling Items
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                This month&apos;s best performers
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {topItems.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-muted-foreground">
                            <p className="text-sm">No sales data this month</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10">
                                                #
                                            </TableHead>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">
                                                Qty Sold
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Revenue
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topItems.map((item, i) => (
                                            <TableRow
                                                key={item.itemCode}
                                                className="hover:bg-muted/30"
                                            >
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            i < 3
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                        className="h-6 w-6 p-0 flex items-center justify-center text-xs rounded-full"
                                                    >
                                                        {i + 1}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {item.itemName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            {item.itemCode}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {item.totalQty}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    Rs.{" "}
                                                    {item.totalAmount.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile List */}
                            <div className="md:hidden divide-y divide-border/50">
                                {topItems.map((item, i) => (
                                    <div
                                        key={item.itemCode}
                                        className="flex items-center gap-3 p-4"
                                    >
                                        <Badge
                                            variant={
                                                i < 3
                                                    ? "default"
                                                    : "secondary"
                                            }
                                            className="h-7 w-7 p-0 flex items-center justify-center text-xs rounded-full shrink-0"
                                        >
                                            {i + 1}
                                        </Badge>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {item.itemName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.totalQty} sold
                                            </p>
                                        </div>
                                        <span className="font-semibold text-sm">
                                            Rs.{" "}
                                            {item.totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
                This report is generated from your ERPNext data. For official
                tax filing purposes, please use ERPNext&apos;s built-in tax reports.
                This is not a substitute for proper accounting records.
            </p>
        </div>
    )
}
