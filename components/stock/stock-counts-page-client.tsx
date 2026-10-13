"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Boxes, CheckCircle2, AlertTriangle, ArrowUpDown, RefreshCw } from "lucide-react"
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
import { toast } from "sonner"
import { cardStyles, badgeStyles } from "@/lib/theme"

interface StockCountItem {
  id: string
  item_code: string
  item_name: string
  warehouse: string
  system_qty: number
  counted_qty: number
}

const INITIAL_ITEMS: StockCountItem[] = [
  { id: "1", item_code: "ITM-001", item_name: "Premium Himalayan Tea 250g", warehouse: "Kathmandu Central", system_qty: 120, counted_qty: 120 },
  { id: "2", item_code: "ITM-002", item_name: "Mustang Organic Beans 1kg", warehouse: "Kathmandu Central", system_qty: 45, counted_qty: 48 },
  { id: "3", item_code: "ITM-003", item_name: "Artisan Coffee Blend 500g", warehouse: "Kathmandu Central", system_qty: 60, counted_qty: 58 },
  { id: "4", item_code: "ITM-004", item_name: "Handcrafted Hemp Wallet", warehouse: "Kathmandu Central", system_qty: 15, counted_qty: 15 },
  { id: "5", item_code: "ITM-005", item_name: "Yarsagumba Herbal Extract 30ml", warehouse: "Kathmandu Central", system_qty: 30, counted_qty: 29 },
]

export default function StockCountsPageClient() {
  const [items, setItems] = useState<StockCountItem[]>(INITIAL_ITEMS)
  const [search, setSearch] = useState("")

  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.item_name.toLowerCase().includes(search.toLowerCase()) ||
        item.item_code.toLowerCase().includes(search.toLowerCase())
    )
  }, [items, search])

  const stats = useMemo(() => {
    let surpluses = 0
    let shortages = 0
    items.forEach((item) => {
      const diff = item.counted_qty - item.system_qty
      if (diff > 0) surpluses += diff
      if (diff < 0) shortages += Math.abs(diff)
    })
    return {
      auditedCount: items.length,
      surpluses,
      shortages,
    }
  }, [items])

  const updateCountedQty = (id: string, newQty: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, counted_qty: Math.max(0, newQty) } : item))
    )
  }

  const handleReconcile = (id: string) => {
    const target = items.find((i) => i.id === id)
    if (!target) return

    const diff = target.counted_qty - target.system_qty
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, system_qty: item.counted_qty } : item))
    )

    if (diff === 0) {
      toast.success(`${target.item_name} confirmed matching shelf inventory!`)
    } else {
      toast.success(
        `Adjusted ${target.item_name} by ${diff > 0 ? "+" : ""}${diff} units. Stock Ledger updated.`
      )
    }
  }

  const handleReconcileAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, system_qty: item.counted_qty })))
    toast.success("All inventory discrepancies successfully reconciled to physical stock!")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading tracking-tight">Stock Reconciliation</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit physical shelf inventory against system records and post ledger adjustments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleReconcileAll}
            className="btn-pill gap-2 h-11 bg-[#3255f1] hover:bg-[#3255f1]/90 text-white shadow-lg shadow-primary/20"
          >
            <RefreshCw className="h-4 w-4" />
            Reconcile All Discrepancies
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className={cardStyles.teal.card}>
          <div className={cardStyles.teal.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Items Audited</CardTitle>
            <div className={cardStyles.teal.icon}>
              <Boxes className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold font-heading">{stats.auditedCount} SKUs</div>
            <p className="text-xs text-muted-foreground mt-1">Kathmandu Central Warehouse</p>
          </CardContent>
        </Card>

        <Card className={cardStyles.emerald.card}>
          <div className={cardStyles.emerald.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Surpluses</CardTitle>
            <div className={cardStyles.emerald.icon}>
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-emerald-600 font-heading">+{stats.surpluses} units</div>
            <p className="text-xs text-muted-foreground mt-1">Physical shelf exceeds system</p>
          </CardContent>
        </Card>

        <Card className={`${cardStyles.rose.card} hidden sm:block`}>
          <div className={cardStyles.rose.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Shortages / Losses</CardTitle>
            <div className={cardStyles.rose.icon}>
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-rose-600 font-heading">-{stats.shortages} units</div>
            <p className="text-xs text-muted-foreground mt-1">Physical count below system</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by SKU or item name..."
          className="pl-10 h-11 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Main Table Area */}
      <Card className="card-float border-0 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle className="text-lg font-heading">Reconciliation Worksheet</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enter shelf quantities directly into the Counted column
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-b-2xl">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[140px]">SKU Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-center">System Qty</TableHead>
                  <TableHead className="text-center w-[160px]">Physical Count</TableHead>
                  <TableHead className="text-center">Variance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const diff = item.counted_qty - item.system_qty
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-bold text-foreground">{item.item_code}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{item.item_name}</div>
                        <span className="text-xs text-muted-foreground">{item.warehouse}</span>
                      </TableCell>
                      <TableCell className="text-center font-bold text-foreground">
                        {item.system_qty}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          className="h-9 w-24 text-center mx-auto rounded-lg font-bold"
                          value={item.counted_qty}
                          onChange={(e) => updateCountedQty(item.id, Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {diff === 0 ? (
                          <Badge className="bg-muted text-muted-foreground font-semibold">Matched</Badge>
                        ) : diff > 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold">
                            +{diff} Surplus
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-bold">
                            {diff} Shortage
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReconcile(item.id)}
                          className="h-8 text-[#3255f1] hover:text-[#3255f1] hover:bg-[#3255f1]/10 text-xs font-semibold"
                        >
                          Reconcile
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
