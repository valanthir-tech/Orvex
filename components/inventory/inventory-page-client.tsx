"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Search,
    Plus,
    Minus,
    AlertTriangle,
    ArrowUpDown,
    Package,
    X,
    Loader2,
    TrendingDown,
    TrendingUp,
    Warehouse,
    RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { cardStyles, badgeStyles } from "@/lib/theme"
import {
    getInventory, getStockLedger, createInventoryAdjustment,
    type InventoryItem, type StockLedgerEntry,
} from "@/app/actions/inventory"
import WarehousesTab from "@/components/warehouses/warehouses-page-client"

// ─── Validation Schema ──────────────────────────────────────────────────────

const adjustmentSchema = z.object({
    productId: z.string().min(1, "Select a product"),
    type: z.enum(["add", "remove"]),
    quantity: z.coerce.number().int().min(1, "Must be at least 1"),
    reason: z.string().min(3, "Reason is required"),
})

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>

// ─── Component ───────────────────────────────────────────────────────────────

export default function InventoryPageClient() {
    const [products, setProducts] = useState<InventoryItem[]>([])
    const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isAdjustOpen, setIsAdjustOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const loadData = useCallback(async () => {
        try {
            const [inv, ledger] = await Promise.all([
                getInventory(),
                getStockLedger(50),
            ])
            setProducts(inv)
            setLedgerEntries(ledger)
        } catch {
            toast.error("Failed to load inventory data")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const lowStockProducts = useMemo(
        () => products.filter((p) => p.stock <= p.minStock && p.stock > 0),
        [products]
    )
    const outOfStockProducts = useMemo(
        () => products.filter((p) => p.stock <= 0),
        [products]
    )
    const totalStockValue = useMemo(
        () => products.reduce((sum, p) => sum + p.stock * p.cost, 0),
        [products]
    )
    const totalUnits = useMemo(
        () => products.reduce((sum, p) => sum + p.stock, 0),
        [products]
    )

    const filteredProducts = useMemo(() => {
        if (!search) return products
        const term = search.toLowerCase()
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(term) ||
                p.itemCode.toLowerCase().includes(term)
        )
    }, [products, search])

    const form = useForm<AdjustmentFormValues>({
        resolver: zodResolver(adjustmentSchema) as never,
        defaultValues: {
            productId: "",
            type: "add",
            quantity: 1,
            reason: "",
        },
    })

    function openAdjustModal(productId?: string) {
        form.reset({
            productId: productId ?? "",
            type: "add",
            quantity: 1,
            reason: "",
        })
        setIsAdjustOpen(true)
    }

    async function onSubmit(values: AdjustmentFormValues) {
        setIsSubmitting(true)

        const product = products.find((p) => p.id === values.productId)
        if (!product) {
            toast.error("Product not found")
            setIsSubmitting(false)
            return
        }

        if (values.type === "remove" && values.quantity > product.stock) {
            toast.error("Cannot remove more than current stock")
            setIsSubmitting(false)
            return
        }

        const result = await createInventoryAdjustment({
            itemCode: product.itemCode,
            type: values.type,
            qty: values.quantity,
            warehouse: product.warehouse,
            reason: values.reason,
        })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(
                `${values.type === "add" ? "Added" : "Removed"} ${values.quantity} units of ${product.name}`
            )
            setIsAdjustOpen(false)
            loadData() // Refresh data
        }
        setIsSubmitting(false)
    }

    function getStockLevel(product: InventoryItem) {
        const maxLevel = Math.max(product.minStock * 3, product.stock, 1)
        return Math.min(100, Math.max(0, (product.stock / maxLevel) * 100))
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading tracking-tight">
                        Inventory
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Track stock levels and manage adjustments
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => { setIsLoading(true); loadData() }}
                        className="rounded-xl h-11 gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => openAdjustModal()}
                        className="rounded-xl px-6 gap-2 h-11 shadow-lg shadow-primary/20"
                    >
                        <ArrowUpDown className="h-4 w-4" />
                        Stock Adjustment
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className={cardStyles.teal.card}>
                    <div className={cardStyles.teal.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Value</CardTitle>
                        <div className={cardStyles.teal.icon}>
                            <Warehouse className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">Rs. {totalStockValue.toLocaleString()}</div>
                        <div className="text-xs mt-2 text-muted-foreground">cost value of all units</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.sky.card}>
                    <div className={cardStyles.sky.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Units</CardTitle>
                        <div className={cardStyles.sky.icon}>
                            <Package className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{totalUnits.toLocaleString()}</div>
                        <div className="text-xs mt-2 text-muted-foreground">across all products</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.amber.card}>
                    <div className={cardStyles.amber.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
                        <div className={cardStyles.amber.icon}>
                            <TrendingDown className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{lowStockProducts.length}</div>
                        <div className="text-xs mt-2 text-muted-foreground">below minimum level</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.rose.card}>
                    <div className={cardStyles.rose.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
                        <div className={cardStyles.rose.icon}>
                            <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{outOfStockProducts.length}</div>
                        <div className="text-xs mt-2 text-muted-foreground">need immediate restock</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs: All Stock / Low Stock / Locations / History */}
            <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="bg-muted/50 rounded-xl p-1">
                    <TabsTrigger value="all" className="rounded-lg">
                        All Stock
                    </TabsTrigger>
                    <TabsTrigger value="low" className="rounded-lg">
                        Low Stock
                        {lowStockProducts.length > 0 && (
                            <Badge
                                variant="destructive"
                                className="ml-2 h-5 w-5 p-0 text-[10px] flex items-center justify-center rounded-full"
                            >
                                {lowStockProducts.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="locations" className="rounded-lg">
                        Locations
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg">
                        Adjustments
                    </TabsTrigger>
                </TabsList>

                {/* All Stock Tab */}
                <TabsContent value="all" className="space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search products..."
                            className="pl-10 h-11 rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
                                onClick={() => setSearch("")}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <Card className="card-float border-0 rounded-2xl">
                        <CardContent className="p-0">
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead className="text-right">
                                                Current Stock
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Min Stock
                                            </TableHead>
                                            <TableHead className="w-[140px]">
                                                Level
                                            </TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">
                                                Action
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-50" />
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredProducts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                                    No products found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredProducts.map((product) => (
                                            <TableRow
                                                key={product.id}
                                                className={`hover:bg-muted/30 ${
                                                    product.stock <= product.minStock
                                                        ? "bg-rose-50/50 dark:bg-rose-950/10"
                                                        : ""
                                                }`}
                                            >
                                                <TableCell className="font-medium">
                                                    {product.name}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {product.itemCode}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {product.stock}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {product.minStock}
                                                </TableCell>
                                                <TableCell>
                                                    <Progress
                                                        value={getStockLevel(product)}
                                                        className="h-2"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {product.stock <= 0 ? (
                                                        <Badge
                                                            className={`${badgeStyles.danger} text-xs`}
                                                        >
                                                            Out of Stock
                                                        </Badge>
                                                    ) : product.stock <=
                                                      product.minStock ? (
                                                        <Badge
                                                            className={`${badgeStyles.warning} text-xs`}
                                                        >
                                                            Low Stock
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            className={`${badgeStyles.success} text-xs`}
                                                        >
                                                            In Stock
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-xl"
                                                        onClick={() =>
                                                            openAdjustModal(
                                                                product.id
                                                            )
                                                        }
                                                    >
                                                        <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                                                        Adjust
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile List */}
                            <div className="md:hidden divide-y divide-border/50">
                                {isLoading ? (
                                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-50" />
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                                        No products found.
                                    </div>
                                ) : (
                                    filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className={`p-4 space-y-2 ${
                                            product.stock <= product.minStock
                                                ? "bg-rose-50/50 dark:bg-rose-950/10"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {product.itemCode}
                                                </p>
                                            </div>
                                            {product.stock <= 0 ? (
                                                <Badge
                                                    className={`${badgeStyles.danger} text-xs`}
                                                >
                                                    Out of Stock
                                                </Badge>
                                            ) : product.stock <=
                                              product.minStock ? (
                                                <Badge
                                                    className={`${badgeStyles.warning} text-xs`}
                                                >
                                                    Low
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    className={`${badgeStyles.success} text-xs`}
                                                >
                                                    OK
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Progress
                                                value={getStockLevel(product)}
                                                className="h-1.5 flex-1"
                                            />
                                            <span className="text-sm font-semibold w-12 text-right">
                                                {product.stock}
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full rounded-xl h-8 text-xs"
                                            onClick={() =>
                                                openAdjustModal(product.id)
                                            }
                                        >
                                            <ArrowUpDown className="h-3 w-3 mr-1" />
                                            Adjust Stock
                                        </Button>
                                    </div>
                                )))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Low Stock Tab */}
                <TabsContent value="low" className="space-y-4">
                    <Card className="card-float border-0 rounded-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                            <div>
                                <CardTitle className="text-lg font-heading">Items Needing Restock</CardTitle>
                                <p className="text-sm text-muted-foreground mt-0.5">Products below minimum stock level</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/50">
                                {[...lowStockProducts, ...outOfStockProducts]
                                    .length === 0 ? (
                                    <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                                        <TrendingUp className="h-8 w-8 text-emerald-500/30 mb-2" />
                                        <p className="text-sm">
                                            All stock levels are healthy!
                                        </p>
                                    </div>
                                ) : (
                                    [...lowStockProducts, ...outOfStockProducts].map(
                                        (product) => (
                                            <div
                                                key={product.id}
                                                className="flex items-center gap-4 p-4"
                                            >
                                                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                                                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Current: {product.stock} /
                                                        Min: {product.minStock}
                                                    </p>
                                                </div>
                                                <Badge
                                                    className={`${
                                                        product.stock <= 0
                                                            ? badgeStyles.danger
                                                            : badgeStyles.warning
                                                    } text-xs`}
                                                >
                                                    {product.stock <= 0
                                                        ? "Out"
                                                        : `${product.stock} left`}
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-xl"
                                                    onClick={() =>
                                                        openAdjustModal(product.id)
                                                    }
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Restock
                                                </Button>
                                            </div>
                                        )
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="locations" className="space-y-4">
                    <WarehousesTab />
                </TabsContent>

                {/* Adjustment History Tab */}
                <TabsContent value="history" className="space-y-4">
                    <Card className="card-float border-0 rounded-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                            <div>
                                <CardTitle className="text-lg font-heading">Recent Stock Adjustments</CardTitle>
                                <p className="text-sm text-muted-foreground mt-0.5">Latest inventory changes</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/50">
                                {ledgerEntries.length === 0 ? (
                                    <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                                        <ArrowUpDown className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                        <p className="text-sm">
                                            No adjustments yet
                                        </p>
                                    </div>
                                ) : (
                                    ledgerEntries.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="flex items-center gap-4 p-4"
                                        >
                                            <div
                                                className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                    entry.qtyChange > 0
                                                        ? "bg-emerald-100 dark:bg-emerald-950/30"
                                                        : "bg-rose-100 dark:bg-rose-950/30"
                                                }`}
                                            >
                                                {entry.qtyChange > 0 ? (
                                                    <Plus className="h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <Minus className="h-4 w-4 text-rose-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">
                                                    {entry.itemCode}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {entry.voucherType}: {entry.voucherNo} &middot;{" "}
                                                    {entry.date}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p
                                                    className={`font-semibold text-sm ${
                                                        entry.qtyChange > 0
                                                            ? "text-emerald-600"
                                                            : "text-rose-600"
                                                    }`}
                                                >
                                                    {entry.qtyChange > 0
                                                        ? `+${entry.qtyChange}`
                                                        : entry.qtyChange}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Bal: {entry.balanceQty}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Stock Adjustment Modal */}
            <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                <DialogContent className="sm:max-w-[460px] rounded-2xl border-0 p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                        <DialogTitle className="text-xl font-heading">
                            Stock Adjustment
                        </DialogTitle>
                        <DialogDescription>
                            Add or remove stock for a product
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="px-6 py-6 space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="productId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Select a product" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {products.map((p) => (
                                                    <SelectItem
                                                        key={p.id}
                                                        value={p.id}
                                                    >
                                                        {p.name} (Stock:{" "}
                                                        {p.stock})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adjustment Type</FormLabel>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                type="button"
                                                variant={
                                                    field.value === "add"
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className="rounded-xl h-11 gap-2"
                                                onClick={() =>
                                                    field.onChange("add")
                                                }
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Stock
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={
                                                    field.value === "remove"
                                                        ? "destructive"
                                                        : "outline"
                                                }
                                                className="rounded-xl h-11 gap-2"
                                                onClick={() =>
                                                    field.onChange("remove")
                                                }
                                            >
                                                <Minus className="h-4 w-4" />
                                                Remove Stock
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                className="h-11"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="e.g. New shipment received, Damaged goods..."
                                                className="resize-none"
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAdjustOpen(false)}
                                    className="rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-xl"
                                >
                                    {isSubmitting && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Submit Adjustment
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
