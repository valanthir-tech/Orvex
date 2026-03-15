import { getStockEntries } from "@/app/actions/stock-entry"
import { getProducts } from "@/app/actions/products"
import NewStockEntryDialog from "@/components/stock/new-stock-entry-dialog"
import Link from "next/link"
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
import { Plus, FolderInput, FolderOutput, ArrowRightLeft, RefreshCw, FileText, ArrowRight, Package } from "lucide-react"
import { cardStyles, badgeStyles } from "@/lib/theme"

export const dynamic = 'force-dynamic'

export default async function StockEntriesPage() {
    const entries = await getStockEntries()

    const products = await getProducts({ status: "all" })
    const transformedItems = products.map(p => ({
        id: p.productCode,
        name: p.name,
        productCode: p.productCode,
        currentStock: p.currentStock || 0
    }))

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Material Receipt': return <FolderInput className="h-4 w-4 text-emerald-500" />
            case 'Material Issue': return <FolderOutput className="h-4 w-4 text-rose-500" />
            case 'Material Transfer': return <ArrowRightLeft className="h-4 w-4 text-blue-500" />
            case 'Stock Reconciliation': return <RefreshCw className="h-4 w-4 text-amber-500" />
            default: return <FileText className="h-4 w-4 text-gray-500" />
        }
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'Material Receipt': return badgeStyles.success
            case 'Material Issue': return badgeStyles.danger
            case 'Material Transfer': return badgeStyles.info
            case 'Stock Reconciliation': return badgeStyles.warning
            default: return badgeStyles.info
        }
    }

    // Stats
    const totalEntries = entries.length
    const receipts = entries.filter(e => e.type === 'Material Receipt').length
    const issues = entries.filter(e => e.type === 'Material Issue').length
    const transfers = entries.filter(e => e.type === 'Material Transfer').length

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading tracking-tight">Stock Entries</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Track all material movements, receipts, and issues
                    </p>
                </div>
                <NewStockEntryDialog items={transformedItems} />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className={cardStyles.sky.card}>
                    <div className={cardStyles.sky.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
                        <div className={cardStyles.sky.icon}>
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{totalEntries}</div>
                        <div className="text-xs mt-2 text-muted-foreground">all time</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.emerald.card}>
                    <div className={cardStyles.emerald.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Receipts</CardTitle>
                        <div className={cardStyles.emerald.icon}>
                            <FolderInput className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{receipts}</div>
                        <div className="text-xs mt-2 text-muted-foreground">material in</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.rose.card}>
                    <div className={cardStyles.rose.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Issues</CardTitle>
                        <div className={cardStyles.rose.icon}>
                            <FolderOutput className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{issues}</div>
                        <div className="text-xs mt-2 text-muted-foreground">material out</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.violet.card}>
                    <div className={cardStyles.violet.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Transfers</CardTitle>
                        <div className={cardStyles.violet.icon}>
                            <ArrowRightLeft className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{transfers}</div>
                        <div className="text-xs mt-2 text-muted-foreground">between warehouses</div>
                    </CardContent>
                </Card>
            </div>

            {/* Entries Table */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                    <div>
                        <CardTitle className="text-lg font-heading">All Entries</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">{entries.length} stock entries recorded</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="h-8 w-8 text-muted-foreground/30" />
                                                <p className="text-muted-foreground">No stock entries found</p>
                                                <p className="text-xs text-muted-foreground/70">Create your first entry to get started</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    entries.map((entry) => (
                                        <TableRow key={entry.id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getTypeIcon(entry.type)}
                                                    <Badge className={`${getTypeBadge(entry.type)} text-xs`}>
                                                        {entry.type}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{entry.name}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {entry.date.toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${badgeStyles.info} text-xs`}>{entry.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold font-heading">{entry.totalAmount}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-foreground gap-1" asChild>
                                                    <Link href={`/stock/entries/${entry.id}`}>View <ArrowRight className="h-3.5 w-3.5" /></Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile List */}
                    <div className="md:hidden divide-y divide-border/50">
                        {entries.length === 0 ? (
                            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                                <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                <p className="text-sm">No stock entries found</p>
                            </div>
                        ) : (
                            entries.map((entry) => (
                                <Link key={entry.id} href={`/stock/entries/${entry.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                        {getTypeIcon(entry.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{entry.type}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{entry.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-sm font-heading">{entry.totalAmount}</p>
                                        <p className="text-xs text-muted-foreground">{entry.date.toLocaleDateString()}</p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
