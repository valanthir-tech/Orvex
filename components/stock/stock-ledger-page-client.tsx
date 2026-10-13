"use client"

import { useState, useMemo } from "react"
import { Search, Download, History, ArrowDownLeft, ArrowUpRight, Filter } from "lucide-react"
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

interface LedgerEntry {
  id: string
  posting_date: string
  bs_date: string
  voucher_type: "Sales Invoice" | "Purchase Bill" | "Stock Reconciliation" | "POS Order"
  voucher_no: string
  item_code: string
  item_name: string
  actual_qty: number
  qty_after_transaction: number
  warehouse: string
}

const INITIAL_LEDGER: LedgerEntry[] = [
  { id: "1", posting_date: "2026-10-12", bs_date: "2083-06-26", voucher_type: "Sales Invoice", voucher_no: "INV-2083-001", item_code: "ITM-001", item_name: "Premium Himalayan Tea 250g", actual_qty: -10, qty_after_transaction: 120, warehouse: "Kathmandu Central" },
  { id: "2", posting_date: "2026-10-12", bs_date: "2083-06-26", voucher_type: "Sales Invoice", voucher_no: "INV-2083-001", item_code: "ITM-002", item_name: "Mustang Organic Beans 1kg", actual_qty: -5, qty_after_transaction: 45, warehouse: "Kathmandu Central" },
  { id: "3", posting_date: "2026-10-11", bs_date: "2083-06-25", voucher_type: "POS Order", voucher_no: "POS-2083-089", item_code: "ITM-003", item_name: "Artisan Coffee Blend 500g", actual_qty: -2, qty_after_transaction: 60, warehouse: "Kathmandu Central" },
  { id: "4", posting_date: "2026-10-10", bs_date: "2083-06-24", voucher_type: "Purchase Bill", voucher_no: "PINV-2083-001", item_code: "ITM-001", item_name: "Raw Himalayan Tea Leaves 50kg", actual_qty: 50, qty_after_transaction: 130, warehouse: "Kathmandu Central" },
  { id: "5", posting_date: "2026-10-09", bs_date: "2083-06-23", voucher_type: "Stock Reconciliation", voucher_no: "ADJ-2083-003", item_code: "ITM-002", item_name: "Mustang Organic Beans 1kg", actual_qty: 3, qty_after_transaction: 50, warehouse: "Kathmandu Central" },
]

export default function StockLedgerPageClient() {
  const [entries, setEntries] = useState<LedgerEntry[]>(INITIAL_LEDGER)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        e.item_name.toLowerCase().includes(search.toLowerCase()) ||
        e.item_code.toLowerCase().includes(search.toLowerCase()) ||
        e.voucher_no.toLowerCase().includes(search.toLowerCase())

      const matchType = typeFilter === "all" || e.voucher_type === typeFilter

      return matchSearch && matchType
    })
  }, [entries, search, typeFilter])

  const stats = useMemo(() => {
    let inward = 0
    let outward = 0
    entries.forEach((e) => {
      if (e.actual_qty > 0) inward += e.actual_qty
      if (e.actual_qty < 0) outward += Math.abs(e.actual_qty)
    })
    return {
      totalTransactions: entries.length,
      inward,
      outward,
    }
  }, [entries])

  const handleExportCSV = () => {
    const headers = ["Posting Date", "BS Date", "Voucher Type", "Voucher No", "Item Code", "Item Name", "Movement", "Balance Qty", "Warehouse"]
    const rows = filteredEntries.map(e => [
      e.posting_date,
      e.bs_date,
      e.voucher_type,
      e.voucher_no,
      e.item_code,
      `"${e.item_name}"`,
      e.actual_qty,
      e.qty_after_transaction,
      `"${e.warehouse}"`
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Stock_Ledger_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Stock Ledger exported to CSV!")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading tracking-tight">Stock Ledger</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Chronological audit trail of all warehouse inward arrivals, dispatches, and balance valuations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCSV}
            className="btn-pill gap-2 h-11 bg-[#3255f1] hover:bg-[#3255f1]/90 text-white shadow-lg shadow-primary/20"
          >
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className={cardStyles.teal.card}>
          <div className={cardStyles.teal.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ledger Movements</CardTitle>
            <div className={cardStyles.teal.icon}>
              <History className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold font-heading">{stats.totalTransactions} events</div>
            <p className="text-xs text-muted-foreground mt-1">Immutable stock postings</p>
          </CardContent>
        </Card>

        <Card className={cardStyles.emerald.card}>
          <div className={cardStyles.emerald.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inward Stock In (+)</CardTitle>
            <div className={cardStyles.emerald.icon}>
              <ArrowDownLeft className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-emerald-600 font-heading">+{stats.inward} units</div>
            <p className="text-xs text-muted-foreground mt-1">Purchases & reconciliation adds</p>
          </CardContent>
        </Card>

        <Card className={`${cardStyles.rose.card} hidden sm:block`}>
          <div className={cardStyles.rose.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outward Stock Out (-)</CardTitle>
            <div className={cardStyles.rose.icon}>
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-rose-600 font-heading">-{stats.outward} units</div>
            <p className="text-xs text-muted-foreground mt-1">Sales invoices & retail dispatches</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by voucher #, SKU, or item..."
            className="pl-10 h-11 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Voucher:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground focus:outline-hidden"
          >
            <option value="all">All Vouchers</option>
            <option value="Sales Invoice">Sales Invoice</option>
            <option value="Purchase Bill">Purchase Bill</option>
            <option value="POS Order">POS Order</option>
            <option value="Stock Reconciliation">Stock Reconciliation</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="card-float border-0 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle className="text-lg font-heading">Ledger Chronology</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Showing {filteredEntries.length} movements
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-b-2xl">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[140px]">Date (AD / BS)</TableHead>
                  <TableHead>Voucher Ref</TableHead>
                  <TableHead>Item / SKU</TableHead>
                  <TableHead className="text-center">Movement Qty</TableHead>
                  <TableHead className="text-center">Balance Qty</TableHead>
                  <TableHead>Warehouse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">{e.posting_date}</div>
                      <span className="text-xs text-muted-foreground">{e.bs_date} BS</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-foreground">{e.voucher_no}</div>
                      <span className="text-xs text-muted-foreground">{e.voucher_type}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{e.item_name}</div>
                      <span className="text-xs text-muted-foreground">{e.item_code}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {e.actual_qty > 0 ? (
                        <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md text-xs">
                          +{e.actual_qty} In
                        </span>
                      ) : (
                        <span className="font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md text-xs">
                          {e.actual_qty} Out
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-extrabold text-foreground">
                      {e.qty_after_transaction}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {e.warehouse}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
