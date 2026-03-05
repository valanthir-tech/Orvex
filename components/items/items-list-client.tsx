"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
    Search,
    Filter,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    Package,
    TrendingUp,
    AlertTriangle,
    XCircle,
    Plus
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddItemModal } from "./add-item-modal"
import { deleteItem } from "@/app/actions/items"
import {
    getStockStatus,
    getStockStatusColor,
    getStockStatusLabel,
    formatPrice,
    StockStatus,
} from "@/types/item"
import { cardStyles } from "@/lib/theme"

interface ItemGroup {
    id: string
    name: string
}

interface Item {
    id: string
    itemCode: string
    name: string
    description: string | null
    stockUom: string
    standardRate: number | { toNumber(): number }
    valuationRate: number | { toNumber(): number }
    currentStock: number
    minStockLevel: number
    image: string | null
    itemGroup: ItemGroup | null
    barcodes: { barcode: string }[]
}

interface Category {
    id: string
    name: string
}

interface ItemsListClientProps {
    items: Item[]
    categories: Category[]
}

export function ItemsListClient({ items, categories }: ItemsListClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<StockStatus | "all">("all")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")

    // Filter items based on search and filters
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            // Search filter
            const query = searchQuery.toLowerCase()
            const matchesSearch =
                !query ||
                item.name.toLowerCase().includes(query) ||
                item.itemCode.toLowerCase().includes(query) ||
                item.barcodes.some((b) => b.barcode.includes(query))

            // Category filter
            const matchesCategory =
                categoryFilter === "all" ||
                item.itemGroup?.id === categoryFilter

            // Stock status filter
            const status = getStockStatus(item.currentStock, item.minStockLevel)
            const matchesStatus =
                statusFilter === "all" || status === statusFilter

            return matchesSearch && matchesCategory && matchesStatus
        })
    }, [items, searchQuery, statusFilter, categoryFilter])

    // Stats
    const stats = useMemo(() => {
        const total = items.length
        const inStock = items.filter(
            (i) => getStockStatus(i.currentStock, i.minStockLevel) === "in-stock"
        ).length
        const lowStock = items.filter(
            (i) => getStockStatus(i.currentStock, i.minStockLevel) === "low-stock"
        ).length
        const outOfStock = items.filter(
            (i) => getStockStatus(i.currentStock, i.minStockLevel) === "out-of-stock"
        ).length
        return { total, inStock, lowStock, outOfStock }
    }, [items])

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) {
            return
        }

        const result = await deleteItem(id)
        if (result.success) {
            toast.success("Item deleted successfully")
        } else {
            toast.error(result.error || "Failed to delete item")
        }
    }

    function getRate(rate: number | { toNumber(): number }): number {
        return typeof rate === "number" ? rate : rate.toNumber()
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-heading">Items</h1>
                    <p className="text-muted-foreground">
                        Manage your products and inventory
                    </p>
                </div>
                <AddItemModal categories={categories} />
            </div>

            {/* Stats Cards - Dashboard Style with Colored Glow */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Items - Sky */}
                <Card
                    className={`${cardStyles.sky.card} cursor-pointer ${statusFilter === 'all' ? cardStyles.sky.ring : ''}`}
                    onClick={() => setStatusFilter("all")}
                >
                    <div className={cardStyles.sky.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
                        <div className={cardStyles.sky.icon}>
                            <Package className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">products in catalog</p>
                    </CardContent>
                </Card>

                {/* In Stock - Emerald */}
                <Card
                    className={`${cardStyles.emerald.card} cursor-pointer ${statusFilter === 'in-stock' ? cardStyles.emerald.ring : ''}`}
                    onClick={() => setStatusFilter("in-stock")}
                >
                    <div className={cardStyles.emerald.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">In Stock</CardTitle>
                        <div className={cardStyles.emerald.icon}>
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{stats.inStock}</div>
                        <p className="text-xs text-muted-foreground mt-1">items available</p>
                    </CardContent>
                </Card>

                {/* Low Stock - Amber */}
                <Card
                    className={`${cardStyles.amber.card} cursor-pointer ${statusFilter === 'low-stock' ? cardStyles.amber.ring : ''}`}
                    onClick={() => setStatusFilter("low-stock")}
                >
                    <div className={cardStyles.amber.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
                        <div className={cardStyles.amber.icon}>
                            <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{stats.lowStock}</div>
                        <p className="text-xs text-muted-foreground mt-1">need restocking</p>
                    </CardContent>
                </Card>

                {/* Out of Stock - Rose */}
                <Card
                    className={`${cardStyles.rose.card} cursor-pointer ${statusFilter === 'out-of-stock' ? cardStyles.rose.ring : ''}`}
                    onClick={() => setStatusFilter("out-of-stock")}
                >
                    <div className={cardStyles.rose.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
                        <div className={cardStyles.rose.icon}>
                            <XCircle className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{stats.outOfStock}</div>
                        <p className="text-xs text-muted-foreground mt-1">unavailable</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name, code, or barcode..."
                        className="pl-9 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[160px] h-11 rounded-xl border-0 bg-muted/50">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as StockStatus | "all")}
                    >
                        <SelectTrigger className="w-[140px] h-11 rounded-xl border-0 bg-muted/50">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="in-stock">In Stock</SelectItem>
                            <SelectItem value="low-stock">Low Stock</SelectItem>
                            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Items Table - Dashboard Style Card */}
            <Card className="card-float border-0 rounded-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                    <div>
                        <CardTitle className="text-lg font-heading">All Items</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {filteredItems.length === items.length
                                ? `${items.length} items in catalog`
                                : `Showing ${filteredItems.length} of ${items.length} items`
                            }
                        </p>
                    </div>
                    {(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => {
                                setSearchQuery("")
                                setStatusFilter("all")
                                setCategoryFilter("all")
                            }}
                        >
                            Clear filters
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="w-[100px] font-medium">Code</TableHead>
                                <TableHead className="font-medium">Name</TableHead>
                                <TableHead className="hidden md:table-cell font-medium">Category</TableHead>
                                <TableHead className="text-center font-medium">Stock</TableHead>
                                <TableHead className="text-right hidden sm:table-cell font-medium">Price</TableHead>
                                <TableHead className="text-center w-[100px] font-medium">Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40">
                                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                                            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                                                <Package className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-muted-foreground">
                                                    {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                                                        ? "No items match your filters"
                                                        : "No items found"}
                                                </p>
                                                <p className="text-sm text-muted-foreground/70 mt-1">
                                                    {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                                                        ? "Try adjusting your search or filters"
                                                        : "Add your first item to get started"}
                                                </p>
                                            </div>
                                            {!(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
                                                <AddItemModal categories={categories} />
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item) => {
                                    const status = getStockStatus(item.currentStock, item.minStockLevel)
                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="cursor-pointer hover:bg-muted/30 transition-colors"
                                        >
                                            <TableCell className="font-mono text-sm text-muted-foreground">
                                                {item.itemCode}
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/items/${item.id}`}
                                                    className="font-medium hover:text-primary transition-colors"
                                                >
                                                    {item.name}
                                                </Link>
                                                {item.barcodes.length > 0 && (
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        {item.barcodes[0].barcode}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">
                                                {item.itemGroup?.name || "-"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-bold">{item.currentStock}</span>
                                                <span className="text-muted-foreground text-sm ml-1">
                                                    {item.stockUom}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right hidden sm:table-cell font-heading font-semibold">
                                                {formatPrice(getRate(item.standardRate))}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="secondary"
                                                    className={`${getStockStatusColor(status)} font-medium`}
                                                >
                                                    {getStockStatusLabel(status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/items/${item.id}`} className="cursor-pointer">
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/items/${item.id}`} className="cursor-pointer">
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit Item
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive cursor-pointer"
                                                            onClick={() => handleDelete(item.id, item.name)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Item
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
