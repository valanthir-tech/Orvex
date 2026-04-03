"use client"

import { useState, useEffect, useCallback } from "react"
import { Warehouse, RefreshCw, Package, AlertTriangle, TrendingUp } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cardStyles } from "@/lib/theme"
import { getWarehouses } from "@/app/actions/stock"
import { getInventory, type InventoryItem } from "@/app/actions/inventory"

interface WarehouseRow {
    id: string
    name: string
    parentId?: string
    isGroup: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WarehousesTab() {
    const [warehouses, setWarehouses] = useState<WarehouseRow[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadData = useCallback(async () => {
        setIsLoading(true)
        try {
            const [whs, inv] = await Promise.all([getWarehouses(), getInventory()])
            setWarehouses(whs)
            setInventory(inv)
        } catch {
            toast.error("Failed to load warehouse data")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Aggregate stock by warehouse
    const warehouseStats = warehouses.map((wh) => {
        const items = inventory.filter((i) => i.warehouse === wh.id || i.warehouse === wh.name)
        const totalUnits = items.reduce((sum, i) => sum + i.stock, 0)
        const totalValue = items.reduce((sum, i) => sum + i.stock * i.cost, 0)
        const lowStock = items.filter((i) => i.stock > 0 && i.stock <= i.minStock).length
        return { ...wh, itemCount: items.length, totalUnits, totalValue, lowStock }
    })

    const totalWarehouses = warehouses.length
    const totalItems = inventory.length
    const totalValue = inventory.reduce((sum, i) => sum + i.stock * i.cost, 0)
    const totalLowStock = inventory.filter((i) => i.stock > 0 && i.stock <= i.minStock).length

    return (
        <div className="space-y-8 mt-6">

            {/* Stat Cards */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className={cardStyles.teal.card}>
                    <div className={cardStyles.teal.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Warehouses
                        </CardTitle>
                        <div className={cardStyles.teal.icon}>
                            <Warehouse className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{totalWarehouses}</div>
                        <div className="text-xs mt-2 text-muted-foreground">active locations</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.sky.card}>
                    <div className={cardStyles.sky.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Items
                        </CardTitle>
                        <div className={cardStyles.sky.icon}>
                            <Package className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{totalItems}</div>
                        <div className="text-xs mt-2 text-muted-foreground">distinct SKUs</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.emerald.card}>
                    <div className={cardStyles.emerald.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Stock Value
                        </CardTitle>
                        <div className={cardStyles.emerald.icon}>
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold font-heading">
                            Rs.{" "}
                            {totalValue.toLocaleString("en-NP", {
                                maximumFractionDigits: 0,
                            })}
                        </div>
                        <div className="text-xs mt-2 text-muted-foreground">at cost price</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.rose.card}>
                    <div className={cardStyles.rose.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Low Stock
                        </CardTitle>
                        <div className={cardStyles.rose.icon}>
                            <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{totalLowStock}</div>
                        <div className="text-xs mt-2 text-muted-foreground">items need restock</div>
                    </CardContent>
                </Card>
            </div>

            {/* Warehouse Table */}
            <Card className="card-float border-0 rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border/50">
                    <CardTitle className="font-heading">Warehouse Stock Summary</CardTitle>
                </CardHeader>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="pl-6">Warehouse</TableHead>
                            <TableHead>System ID</TableHead>
                            <TableHead className="text-center">Items</TableHead>
                            <TableHead className="text-right">Total Units</TableHead>
                            <TableHead className="text-right">Stock Value</TableHead>
                            <TableHead className="text-center">Low Stock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(3)
                                .fill(0)
                                .map((_, i) => (
                                    <TableRow key={i}>
                                        {Array(6)
                                            .fill(0)
                                            .map((_, j) => (
                                                <TableCell key={j}>
                                                    <div className="h-5 bg-muted rounded animate-pulse" />
                                                </TableCell>
                                            ))}
                                    </TableRow>
                                ))
                        ) : warehouseStats.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-20 text-muted-foreground"
                                >
                                    <Warehouse className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                                    <p className="font-medium">No warehouses found</p>
                                    <p className="text-sm">
                                        Add warehouses in your inventory system to see them here.
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            warehouseStats.map((wh) => (
                                <TableRow key={wh.id} className="hover:bg-muted/20">
                                    <TableCell className="pl-6 font-medium">{wh.name}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm font-mono">
                                        {wh.id}
                                    </TableCell>
                                    <TableCell className="text-center">{wh.itemCount}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {wh.totalUnits.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        Rs.{" "}
                                        {wh.totalValue.toLocaleString("en-NP", {
                                            maximumFractionDigits: 0,
                                        })}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {wh.lowStock > 0 ? (
                                            <Badge className="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                                                {wh.lowStock} items
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                            >
                                                OK
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Inventory breakdown per warehouse */}
            {!isLoading && inventory.length > 0 && warehouseStats.length > 0 && (
                <div className="space-y-6">
                    {warehouseStats.map((wh) => {
                        const items = inventory.filter(
                            (i) => i.warehouse === wh.id || i.warehouse === wh.name
                        )
                        if (items.length === 0) return null

                        return (
                            <Card key={wh.id} className="card-float border-0 rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-border/50 flex flex-row items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Warehouse className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="font-heading text-base">{wh.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {items.length} items · {wh.totalUnits} units
                                        </p>
                                    </div>
                                </CardHeader>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                                            <TableHead className="pl-6">Item</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead className="text-right">Stock</TableHead>
                                            <TableHead className="text-right">Min Stock</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.slice(0, 10).map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/20">
                                                <TableCell className="pl-6 font-medium">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm font-mono">
                                                    {item.itemCode}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {item.stock}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {item.minStock}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.stock <= 0 ? (
                                                        <Badge className="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                                                            Out of Stock
                                                        </Badge>
                                                    ) : item.stock <= item.minStock ? (
                                                        <Badge className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                                            Low Stock
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                                        >
                                                            In Stock
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {items.length > 10 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center py-3 text-sm text-muted-foreground"
                                                >
                                                    + {items.length - 10} more items — go to{" "}
                                                    <a
                                                        href="/stock/inventory"
                                                        className="text-primary underline underline-offset-4"
                                                    >
                                                        Inventory
                                                    </a>{" "}
                                                    for full view
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
