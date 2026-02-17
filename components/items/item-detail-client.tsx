"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    ChevronLeft,
    Save,
    Loader2,
    Package,
    TrendingUp,
    TrendingDown,
    History,
    Pencil,
    Trash2,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { updateItem, deleteItem } from "@/app/actions/items"
import {
    UOM_OPTIONS,
    UpdateItemInput,
    getStockStatus,
    getStockStatusColor,
    getStockStatusLabel,
    formatPrice,
} from "@/types/item"

interface StockLedgerEntry {
    id: string
    postingDate: Date
    qtyChange: number
    actualQty: number
    valuationRate: number
    voucherType: string
    voucherNo: string
    warehouse: { name: string }
}

interface Category {
    id: string
    name: string
}

interface Item {
    id: string
    itemCode: string
    name: string
    description: string | null
    stockUom: string
    standardRate: number
    valuationRate: number
    currentStock: number
    minStockLevel: number
    image: string | null
    isStockItem: boolean
    hasBatchNo: boolean
    itemGroup: Category | null
    barcodes: { id: string; barcode: string }[]
    stockLedger: StockLedgerEntry[]
    createdAt: Date
    updatedAt: Date
}

interface ItemDetailClientProps {
    item: Item
    categories: Category[]
}

type TabType = "details" | "stock" | "history"

export function ItemDetailClient({ item, categories }: ItemDetailClientProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabType>("details")
    const [isEditing, setIsEditing] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Form state
    const [formData, setFormData] = useState({
        name: item.name,
        itemCode: item.itemCode,
        description: item.description || "",
        itemGroupId: item.itemGroup?.id || "",
        stockUom: item.stockUom,
        standardRate: item.standardRate,
        valuationRate: item.valuationRate,
        minStockLevel: item.minStockLevel,
    })

    const status = getStockStatus(item.currentStock, item.minStockLevel)
    const profit = item.standardRate - item.valuationRate
    const profitMargin = item.valuationRate > 0 ? ((profit / item.valuationRate) * 100).toFixed(1) : 0

    async function handleSave() {
        const data: UpdateItemInput = {
            id: item.id,
            ...formData,
        }

        startTransition(async () => {
            const result = await updateItem(data)
            if (result.success) {
                toast.success("Item updated successfully!")
                setIsEditing(false)
            } else {
                toast.error(result.error || "Failed to update item")
            }
        })
    }

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
            return
        }

        startTransition(async () => {
            const result = await deleteItem(item.id)
            if (result.success) {
                toast.success("Item deleted successfully")
                router.push("/items")
            } else {
                toast.error(result.error || "Failed to delete item")
            }
        })
    }

    const tabs = [
        { id: "details" as const, label: "Details", icon: Package },
        { id: "stock" as const, label: "Stock Info", icon: BarChart3 },
        { id: "history" as const, label: "History", icon: History },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="rounded-xl" asChild>
                        <Link href="/items">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold font-heading">{item.name}</h1>
                            <Badge variant="secondary" className={`${getStockStatusColor(status)} font-medium`}>
                                {getStockStatusLabel(status)}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            <span className="font-mono">{item.itemCode}</span> • {item.itemGroup?.name || "Uncategorized"}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isPending} className="rounded-xl">
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isPending} className="rounded-xl gap-2">
                                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4" />
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl gap-2">
                                <Pencil className="h-4 w-4" />
                                Edit
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isPending} className="rounded-xl gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Cards - Dashboard Style */}
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                {/* Current Stock - Sky */}
                <Card className="group relative overflow-hidden border-0 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/20 hover:-translate-y-1 card-float">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Current Stock</CardTitle>
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/30 transition-transform duration-300 group-hover:scale-110">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">
                            {item.currentStock}
                            <span className="text-lg font-normal text-muted-foreground ml-1">{item.stockUom}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Reorder at {item.minStockLevel} {item.stockUom}
                        </p>
                    </CardContent>
                </Card>

                {/* Selling Price - Teal */}
                <Card className="group relative overflow-hidden border-0 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/20 hover:-translate-y-1 card-float">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Selling Price</CardTitle>
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30 transition-transform duration-300 group-hover:scale-110">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{formatPrice(item.standardRate)}</div>
                        <p className="text-xs text-muted-foreground mt-1">per {item.stockUom}</p>
                    </CardContent>
                </Card>

                {/* Cost Price - Amber */}
                <Card className="group relative overflow-hidden border-0 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-1 card-float">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Cost Price</CardTitle>
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform duration-300 group-hover:scale-110">
                            <TrendingDown className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{formatPrice(item.valuationRate)}</div>
                        <p className="text-xs text-muted-foreground mt-1">per {item.stockUom}</p>
                    </CardContent>
                </Card>

                {/* Profit Margin - Emerald/Rose depending on value */}
                <Card className={`group relative overflow-hidden border-0 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 card-float ${Number(profitMargin) >= 0 ? 'hover:shadow-emerald-500/20' : 'hover:shadow-rose-500/20'
                    }`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${Number(profitMargin) >= 0
                            ? 'from-emerald-500/5 via-emerald-500/5'
                            : 'from-rose-500/5 via-rose-500/5'
                        } to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
                        <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${Number(profitMargin) >= 0
                                ? 'from-emerald-500 to-emerald-600 shadow-emerald-500/30'
                                : 'from-rose-500 to-rose-600 shadow-rose-500/30'
                            } flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                            <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className={`text-3xl font-bold font-heading ${Number(profitMargin) >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}>
                            {profitMargin}%
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            {Number(profitMargin) >= 0 ? (
                                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            ) : (
                                <ArrowDownRight className="h-3 w-3 text-rose-500" />
                            )}
                            <p className="text-xs text-muted-foreground">
                                {formatPrice(profit)} profit per unit
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="border-b border-border/50">
                <nav className="flex gap-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-all font-medium ${activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
                <Card className="card-float border-0 rounded-2xl">
                    <CardHeader className="border-b border-border/50">
                        <CardTitle className="text-lg font-heading">Item Details</CardTitle>
                        <CardDescription>
                            {isEditing ? "Edit the item information below" : "View and manage item information"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="itemCode" className="text-muted-foreground">Item Code (SKU)</Label>
                                <Input
                                    id="itemCode"
                                    value={formData.itemCode}
                                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                                    disabled={!isEditing}
                                    className="h-11 rounded-xl border-0 bg-muted/50 disabled:opacity-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-muted-foreground">Item Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!isEditing}
                                    className="h-11 rounded-xl border-0 bg-muted/50 disabled:opacity-100"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="itemGroupId" className="text-muted-foreground">Category</Label>
                                <Select
                                    disabled={!isEditing}
                                    value={formData.itemGroupId}
                                    onValueChange={(v) => setFormData({ ...formData, itemGroupId: v })}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-0 bg-muted/50">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stockUom" className="text-muted-foreground">Unit of Measure</Label>
                                <Select
                                    disabled={!isEditing}
                                    value={formData.stockUom}
                                    onValueChange={(v) => setFormData({ ...formData, stockUom: v })}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-0 bg-muted/50">
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {UOM_OPTIONS.map((uom) => (
                                            <SelectItem key={uom.value} value={uom.value}>
                                                {uom.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="valuationRate" className="text-muted-foreground">Cost Price (Rs)</Label>
                                <Input
                                    id="valuationRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.valuationRate}
                                    onChange={(e) => setFormData({ ...formData, valuationRate: Number(e.target.value) })}
                                    disabled={!isEditing}
                                    className="h-11 rounded-xl border-0 bg-muted/50 disabled:opacity-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="standardRate" className="text-muted-foreground">Selling Price (Rs)</Label>
                                <Input
                                    id="standardRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.standardRate}
                                    onChange={(e) => setFormData({ ...formData, standardRate: Number(e.target.value) })}
                                    disabled={!isEditing}
                                    className="h-11 rounded-xl border-0 bg-muted/50 disabled:opacity-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minStockLevel" className="text-muted-foreground">Reorder Level</Label>
                                <Input
                                    id="minStockLevel"
                                    type="number"
                                    min="0"
                                    value={formData.minStockLevel}
                                    onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                                    disabled={!isEditing}
                                    className="h-11 rounded-xl border-0 bg-muted/50 disabled:opacity-100"
                                />
                            </div>
                        </div>

                        {item.barcodes.length > 0 && (
                            <>
                                <Separator className="bg-border/50" />
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Barcodes</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {item.barcodes.map((b) => (
                                            <Badge key={b.id} variant="secondary" className="font-mono bg-muted/50 rounded-lg px-3 py-1">
                                                {b.barcode}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === "stock" && (
                <Card className="card-float border-0 rounded-2xl">
                    <CardHeader className="border-b border-border/50">
                        <CardTitle className="text-lg font-heading">Stock Information</CardTitle>
                        <CardDescription>Current stock levels and inventory settings</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-1">
                                {[
                                    { label: "Current Stock", value: `${item.currentStock} ${item.stockUom}`, bold: true },
                                    { label: "Reorder Level", value: `${item.minStockLevel} ${item.stockUom}` },
                                    { label: "Stock Status", value: getStockStatusLabel(status), badge: true, badgeClass: getStockStatusColor(status) },
                                    { label: "Stock Value", value: formatPrice(item.currentStock * item.valuationRate), bold: true },
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center py-4 border-b border-border/30 last:border-0">
                                        <span className="text-muted-foreground">{row.label}</span>
                                        {row.badge ? (
                                            <Badge variant="secondary" className={row.badgeClass}>
                                                {row.value}
                                            </Badge>
                                        ) : (
                                            <span className={row.bold ? "font-bold font-heading text-lg" : "font-medium"}>
                                                {row.value}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1">
                                {[
                                    { label: "Track Stock", value: item.isStockItem ? "Yes" : "No" },
                                    { label: "Batch Tracking", value: item.hasBatchNo ? "Enabled" : "Disabled" },
                                    { label: "Created", value: new Date(item.createdAt).toLocaleDateString('en-NP') },
                                    { label: "Last Updated", value: new Date(item.updatedAt).toLocaleDateString('en-NP') },
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center py-4 border-b border-border/30 last:border-0">
                                        <span className="text-muted-foreground">{row.label}</span>
                                        <span className="font-medium">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === "history" && (
                <Card className="card-float border-0 rounded-2xl">
                    <CardHeader className="border-b border-border/50">
                        <CardTitle className="text-lg font-heading">Transaction History</CardTitle>
                        <CardDescription>Recent stock movements for this item</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {item.stockLedger.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                    <History className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <p className="text-muted-foreground font-medium">No transactions yet</p>
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                    Stock movements will appear here
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="font-medium">Date</TableHead>
                                        <TableHead className="font-medium">Transaction</TableHead>
                                        <TableHead className="font-medium">Warehouse</TableHead>
                                        <TableHead className="text-right font-medium">Qty Change</TableHead>
                                        <TableHead className="text-right font-medium">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {item.stockLedger.map((entry) => (
                                        <TableRow key={entry.id} className="hover:bg-muted/30">
                                            <TableCell className="text-muted-foreground">
                                                {new Date(entry.postingDate).toLocaleDateString('en-NP')}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{entry.voucherType}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{entry.voucherNo}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{entry.warehouse.name}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={`inline-flex items-center gap-1 font-bold ${entry.qtyChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                                    {entry.qtyChange >= 0 ? (
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowDownRight className="h-4 w-4" />
                                                    )}
                                                    {entry.qtyChange >= 0 ? "+" : ""}{entry.qtyChange}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold font-heading">
                                                {entry.actualQty}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
