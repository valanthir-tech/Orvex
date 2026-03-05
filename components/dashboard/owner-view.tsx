import {
    Package,
    TriangleAlert,
    ShoppingCart,
    TrendingUp,
    ArrowRight,
    Plus,
    Zap,
    Shirt,
    BarChart3,
    CalendarDays,
} from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cardStyles, badgeStyles, getBadgeByIndex, getProgressBarColor } from "@/lib/theme"

// Mock data - Clothing Store
const recentSales = [
    { id: 1, invoice: "#INV-1234", customer: "Priya Maharjan", amount: "Rs. 8,500", items: 2, time: "2 min ago" },
    { id: 2, invoice: "#INV-1233", customer: "Walk-in Customer", amount: "Rs. 3,200", items: 1, time: "15 min ago" },
    { id: 3, invoice: "#INV-1232", customer: "Rajesh Shrestha", amount: "Rs. 12,450", items: 4, time: "1 hr ago" },
    { id: 4, invoice: "#INV-1231", customer: "Anita Gurung", amount: "Rs. 5,800", items: 3, time: "2 hrs ago" },
]

const lowStockItems = [
    { name: "Black Denim Jeans (M)", current: 3, reorder: 15, status: "critical" },
    { name: "White Cotton T-Shirt (L)", current: 5, reorder: 20, status: "critical" },
    { name: "Floral Summer Dress (S)", current: 8, reorder: 25, status: "warning" },
    { name: "Leather Belt (Brown)", current: 12, reorder: 30, status: "warning" },
]

const topItems = [
    { name: "Premium Hoodie", sold: 89, revenue: "Rs. 267,000", percentage: 100 },
    { name: "Slim Fit Chinos", sold: 76, revenue: "Rs. 190,000", percentage: 82 },
    { name: "Casual Polo Shirt", sold: 64, revenue: "Rs. 128,000", percentage: 68 },
    { name: "Winter Jacket", sold: 42, revenue: "Rs. 210,000", percentage: 55 },
]

export function OwnerDashboard() {
    return (
        <div className="space-y-8">
            {/* Stats Row - Bento Style with Colored Glow Hover */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Today's Revenue - Teal accent with teal glow */}
                <Card className={cardStyles.teal.card}>
                    <div className={cardStyles.teal.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Revenue</CardTitle>
                        <div className={cardStyles.teal.icon}>
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">Rs. 48,250</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles.teal}`}>
                                +18.2%
                            </span>
                            <span className="text-xs text-muted-foreground">vs yesterday</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Sales - Violet accent */}
                <Card className={cardStyles.violet.card}>
                    <div className={cardStyles.violet.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Sales</CardTitle>
                        <div className={cardStyles.violet.icon}>
                            <CalendarDays className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">Rs. 8,92,400</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles.success}`}>
                                +12.5%
                            </span>
                            <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Orders - Sky blue accent with sky glow */}
                <Card className={cardStyles.sky.card}>
                    <div className={cardStyles.sky.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                        <div className={cardStyles.sky.icon}>
                            <ShoppingCart className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">42</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles.success}`}>
                                +8
                            </span>
                            <span className="text-xs text-muted-foreground">from yesterday</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Alert */}
                <Card className={cardStyles.rose.card}>
                    <div className={cardStyles.rose.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
                        <div className={cardStyles.rose.icon}>
                            <TriangleAlert className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">5</div>
                        <div className="text-xs mt-2 text-muted-foreground">items need restock</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions - Pill Buttons */}
            <div className="flex gap-3 flex-wrap">
                <Button className="btn-pill gap-2 h-11 shadow-lg shadow-primary/20" asChild>
                    <Link href="/pos">
                        <Zap className="h-4 w-4" />
                        New Sale
                    </Link>
                </Button>
                <Button variant="secondary" className="btn-pill gap-2 h-11" asChild>
                    <Link href="/items/new">
                        <Plus className="h-4 w-4" />
                        Add Item
                    </Link>
                </Button>
                <Button variant="secondary" className="btn-pill gap-2 h-11" asChild>
                    <Link href="/stock/entries/new">
                        <Package className="h-4 w-4" />
                        Stock Entry
                    </Link>
                </Button>
                <Button variant="secondary" className="btn-pill gap-2 h-11" asChild>
                    <Link href="/reports">
                        <BarChart3 className="h-4 w-4" />
                        Reports
                    </Link>
                </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Sales */}
                <Card className="lg:col-span-2 card-float border-0 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                        <div>
                            <CardTitle className="text-lg font-heading">Recent Sales</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">Latest transactions today</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1" asChild>
                            <Link href="/sales">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {recentSales.map((sale) => (
                                <div key={sale.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                                            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{sale.invoice}</p>
                                            <p className="text-sm text-muted-foreground">{sale.customer}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold font-heading">{sale.amount}</p>
                                        <p className="text-xs text-muted-foreground">{sale.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Items */}
                <Card className="card-float border-0 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                        <div>
                            <CardTitle className="text-lg font-heading">Low Stock</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">Items below reorder level</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1" asChild>
                            <Link href="/stock/alerts">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {lowStockItems.map((item) => (
                            <div key={item.name} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${item.status === 'critical' ? 'bg-rose-500' : 'bg-amber-400'
                                            }`} />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {item.current}/{item.reorder}
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${item.status === 'critical' ? 'bg-rose-500' : 'bg-amber-400'
                                            }`}
                                        style={{ width: `${(item.current / item.reorder) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Top Selling Items - Bento Card */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                    <div>
                        <CardTitle className="text-lg font-heading">Top Selling Items</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">Best performers this week</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1" asChild>
                        <Link href="/reports/sales">View report <ArrowRight className="h-3.5 w-3.5" /></Link>
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {topItems.map((item, index) => (
                            <div key={item.name} className="space-y-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${getBadgeByIndex(index)}`}>
                                        #{index + 1}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{item.sold} sold</span>
                                </div>
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-lg font-bold font-heading mt-1">{item.revenue}</p>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(index)}`}
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
