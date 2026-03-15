import { Suspense } from "react"
import {
    Package,
    TriangleAlert,
    ShoppingCart,
    TrendingUp,
    ArrowRight,
    Plus,
    Zap,
    BarChart3,
    CalendarDays,
} from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cardStyles, badgeStyles, getBadgeByIndex, getProgressBarColor } from "@/lib/theme"

import { getSalesSummary, getTopSellingItems } from "@/app/actions/reports"
import { getTodayInvoices } from "@/app/actions/pos"
import { getLowStockItems } from "@/app/actions/dashboard"
import { ErrorBoundary } from "@/components/error-boundary"

// ----------------------------------------------------------------------
// FORMATTER HELPERS
// ----------------------------------------------------------------------
function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency: "NPR",
        minimumFractionDigits: 0,
    }).format(amount || 0)
}

function formatTime(dateObj: Date) {
    // Show hours relative if today, else date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) return `${diffMins} min ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr ago`
    return dateObj.toLocaleDateString()
}

// ----------------------------------------------------------------------
// DATA FETCHING SUB-COMPONENTS
// ----------------------------------------------------------------------

async function StatCards() {
    const summary = await getSalesSummary()

    return (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Today's Revenue */}
            <Card className={cardStyles.teal.card}>
                <div className={cardStyles.teal.overlay} />
                <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Revenue</CardTitle>
                    <div className={cardStyles.teal.icon}>
                        <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                </CardHeader>
                <CardContent className="relative">
                    <div className="text-3xl font-bold font-heading">{formatCurrency(summary.todaySales)}</div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">{summary.todayInvoices} invoices today</span>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Sales */}
            <Card className={cardStyles.violet.card}>
                <div className={cardStyles.violet.overlay} />
                <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Sales</CardTitle>
                    <div className={cardStyles.violet.icon}>
                        <CalendarDays className="h-5 w-5 text-white" />
                    </div>
                </CardHeader>
                <CardContent className="relative">
                    <div className="text-3xl font-bold font-heading">{formatCurrency(summary.monthSales)}</div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">{summary.monthInvoices} invoices this month</span>
                    </div>
                </CardContent>
            </Card>

            {/* Total Orders (Week) */}
            <Card className={cardStyles.sky.card}>
                <div className={cardStyles.sky.overlay} />
                <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Orders (This Week)</CardTitle>
                    <div className={cardStyles.sky.icon}>
                        <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                </CardHeader>
                <CardContent className="relative">
                    <div className="text-3xl font-bold font-heading">{summary.weekInvoices}</div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">{formatCurrency(summary.weekSales)} revenue</span>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions (Replacing Low Stock in this specific block to balance, but we can put Low Stock back) */}
            {/* Actually user asked to wire Low Stock here, so let's call it from LowStockAlerts directly inside this component to keep it part of StatCards, or we build a separate one. Let's build a dedicated separate async block for low stock, or just call it here. Since it's a small number, let's call it. */}
            <LowStockStatCard />
        </div>
    )
}

// Breaking out Low Stock Stat to isolate its fetch
async function LowStockStatCard() {
    const lowStockItems = await getLowStockItems(5)
    const count = lowStockItems.length

    return (
        <Card className={cardStyles.rose.card}>
            <div className={cardStyles.rose.overlay} />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
                <div className={cardStyles.rose.icon}>
                    <TriangleAlert className="h-5 w-5 text-white" />
                </div>
            </CardHeader>
            <CardContent className="relative">
                <div className="text-3xl font-bold font-heading">{count}</div>
                <div className="text-xs mt-2 text-muted-foreground">{count > 0 ? "items need restock" : "All stock levels healthy"}</div>
            </CardContent>
        </Card>
    )
}

async function RecentSalesTable() {
    const recentSales = await getTodayInvoices()
    const top10 = recentSales.slice(0, 10)

    if (top10.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-xl m-6">
                <ShoppingCart className="h-8 w-8 mb-4 text-muted-foreground/50" />
                <p className="font-medium text-foreground">No sales today</p>
                <p className="text-sm">Start an order in the POS terminal.</p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-border/50">
            {top10.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium">{sale.name}</p>
                            <p className="text-sm text-muted-foreground">{sale.customer}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold font-heading">{formatCurrency(sale.grandTotal)}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(sale.createdAt)}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

async function LowStockTable() {
    const lowStockItems = await getLowStockItems(5)

    if (lowStockItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 pt-4 text-center text-muted-foreground">
                <p className="text-sm">No items need restocking.</p>
            </div>
        )
    }

    return (
        <div className="pt-4 space-y-4 px-6 pb-6">
            {lowStockItems.map((item) => (
                <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${item.status === 'critical' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                            <span className="text-sm font-medium truncate max-w-[150px]" title={item.name}>{item.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {item.current}/{item.reorder}
                        </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${item.status === 'critical' ? 'bg-rose-500' : 'bg-amber-400'}`}
                            style={{ width: `${Math.min((item.current / Math.max(item.reorder, 1)) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

async function TopSellingItems() {
    const topItems = await getTopSellingItems(4)

    // Find the max quantity to relative scale the progress bars
    const maxSold = Math.max(...topItems.map(i => i.totalQty), 1)

    if (topItems.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>Not enough data for this month.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 p-6 pt-0">
            {topItems.map((item, index) => {
                const percentage = (item.totalQty / maxSold) * 100

                return (
                    <div key={item.itemCode} className="space-y-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${getBadgeByIndex(index)}`}>
                                #{index + 1}
                            </span>
                            <span className="text-xs text-muted-foreground">{item.totalQty} sold</span>
                        </div>
                        <div>
                            <p className="font-medium truncate" title={item.itemName}>{item.itemName}</p>
                            <p className="text-lg font-bold font-heading mt-1">{formatCurrency(item.totalAmount)}</p>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(index)}`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ----------------------------------------------------------------------
// MAIN DASHBOARD COMPONENT
// ----------------------------------------------------------------------

function DashboardSkeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-muted rounded-xl ${className}`} />
}

export function OwnerDashboard() {
    return (
        <div className="space-y-8">
            {/* Stats Row */}
            <ErrorBoundary>
                <Suspense fallback={
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {Array(4).fill(0).map((_, i) => <DashboardSkeleton key={i} className="h-[120px]" />)}
                    </div>
                }>
                    <StatCards />
                </Suspense>
            </ErrorBoundary>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Sales block */}
                <Card className="lg:col-span-2 card-float border-0 rounded-2xl overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                        <div>
                            <CardTitle className="text-lg font-heading">Recent Sales</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">Latest transactions today</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1" asChild>
                            <Link href="#">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <ErrorBoundary>
                            <Suspense fallback={<DashboardSkeleton className="h-[300px] m-6" />}>
                                <RecentSalesTable />
                            </Suspense>
                        </ErrorBoundary>
                    </CardContent>
                </Card>

                {/* Low Stock block */}
                <Card className="card-float border-0 rounded-2xl overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                        <div>
                            <CardTitle className="text-lg font-heading">Low Stock</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">Items below reorder level</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1" asChild>
                            <Link href="#">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <ErrorBoundary>
                            <Suspense fallback={<DashboardSkeleton className="h-[200px] m-6" />}>
                                <LowStockTable />
                            </Suspense>
                        </ErrorBoundary>
                    </CardContent>
                </Card>
            </div>

            {/* Top Selling Items (Month) */}
            <Card className="card-float border-0 rounded-2xl flex flex-col overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 mb-6">
                    <div>
                        <CardTitle className="text-lg font-heading">Top Selling Items</CardTitle>
                        <CardDescription>Best performers this month</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1" asChild>
                        <Link href="/reports">View report <ArrowRight className="h-3.5 w-3.5" /></Link>
                    </Button>
                </CardHeader>
                <ErrorBoundary>
                    <Suspense fallback={<DashboardSkeleton className="h-[150px] m-6 mx-6 mb-6" />}>
                        <TopSellingItems />
                    </Suspense>
                </ErrorBoundary>
            </Card>
        </div>
    )
}
