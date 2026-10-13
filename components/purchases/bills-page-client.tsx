"use client"

import { useState, useMemo } from "react"
import { 
  Plus, Search, ShoppingBag, Percent, Clock, Eye, Trash2, Printer 
} from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cardStyles, badgeStyles } from "@/lib/theme"
import { formatNPR, convertADtoBS, formatBS, formatAmountWords } from "@/lib/nepal-localization"

interface BillItem {
  id: string
  item_code: string
  item_name: string
  qty: number
  rate: number
  amount: number
}

interface PurchaseBill {
  id: string
  name: string
  supplier: string
  supplier_pan?: string
  bill_number?: string
  posting_date: string
  bs_date: string
  docstatus: 0 | 1 | 2
  items: BillItem[]
  net_total: number
  vat_amount: number
  grand_total: number
}

const INITIAL_BILLS: PurchaseBill[] = [
  {
    id: "bill-1",
    name: "PINV-2083-001",
    supplier: "Himalayan Agro Wholesalers",
    supplier_pan: "102938475",
    bill_number: "HAW-8821",
    posting_date: "2026-10-10",
    bs_date: "2083-06-24",
    docstatus: 1,
    items: [
      { id: "1", item_code: "ITM-001", item_name: "Raw Himalayan Tea Leaves 50kg", qty: 50, rate: 280, amount: 14000 }
    ],
    net_total: 14000,
    vat_amount: 1820,
    grand_total: 15820
  },
  {
    id: "bill-2",
    name: "PINV-2083-002",
    supplier: "Pokhara Packaging Supplies",
    supplier_pan: "501928374",
    bill_number: "PPS-4412",
    posting_date: "2026-10-12",
    bs_date: "2083-06-26",
    docstatus: 0,
    items: [
      { id: "2", item_code: "PKG-001", item_name: "Biodegradable Tin Cans (Pack of 100)", qty: 200, rate: 35, amount: 7000 }
    ],
    net_total: 7000,
    vat_amount: 910,
    grand_total: 7910
  }
]

export default function BillsPageClient() {
  const [bills, setBills] = useState<PurchaseBill[]>(INITIAL_BILLS)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "0" | "1" | "2">("all")

  // Modal dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  // Form states
  const [formSupplier, setFormSupplier] = useState("")
  const [formSupplierPan, setFormSupplierPan] = useState("")
  const [formRefNumber, setFormRefNumber] = useState("")
  const [formItems, setFormItems] = useState<{ item_code: string; item_name: string; qty: number; rate: number }[]>([
    { item_code: "ITM-RAW", item_name: "Inventory Restock Item", qty: 20, rate: 300 }
  ])

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchesSearch = 
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.supplier.toLowerCase().includes(search.toLowerCase())
      
      const matchesStatus = 
        statusFilter === "all" || b.docstatus.toString() === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [bills, search, statusFilter])

  // Stats
  const stats = useMemo(() => {
    const totalPurchases = bills.filter(b => b.docstatus === 1).reduce((sum, b) => sum + b.grand_total, 0)
    const vatPaid = bills.filter(b => b.docstatus === 1).reduce((sum, b) => sum + b.vat_amount, 0)
    const pendingCount = bills.filter(b => b.docstatus === 0).length
    return { totalPurchases, vatPaid, pendingCount }
  }, [bills])

  const formCalculations = useMemo(() => {
    const net = formItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.rate || 0)), 0)
    const vat = Math.round(net * 0.13)
    const grand = net + vat
    return { net, vat, grand }
  }, [formItems])

  const handleAddItemRow = () => {
    setFormItems([...formItems, { item_code: `ITM-00${formItems.length + 1}`, item_name: "Inventory Restock Item", qty: 10, rate: 250 }])
  }

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length === 1) return
    setFormItems(formItems.filter((_, i) => i !== index))
  }

  const handleCreateBill = (asSubmitted: boolean = false) => {
    if (!formSupplier.trim()) {
      toast.error("Please enter a supplier name")
      return
    }

    const today = new Date().toISOString().split("T")[0]
    const bs = formatBS(today)
    const billId = `PINV-2083-${String(bills.length + 1).padStart(3, "0")}`

    const newBill: PurchaseBill = {
      id: `bill-${Date.now()}`,
      name: billId,
      supplier: formSupplier,
      supplier_pan: formSupplierPan,
      bill_number: formRefNumber,
      posting_date: today,
      bs_date: bs,
      docstatus: asSubmitted ? 1 : 0,
      items: formItems.map((item, idx) => ({
        id: String(idx + 1),
        item_code: item.item_code,
        item_name: item.item_name,
        qty: Number(item.qty),
        rate: Number(item.rate),
        amount: Number(item.qty) * Number(item.rate)
      })),
      net_total: formCalculations.net,
      vat_amount: formCalculations.vat,
      grand_total: formCalculations.grand
    }

    setBills([newBill, ...bills])
    setIsCreateOpen(false)
    setFormSupplier("")
    setFormSupplierPan("")
    setFormRefNumber("")
    setFormItems([{ item_code: "ITM-RAW", item_name: "Inventory Restock Item", qty: 20, rate: 300 }])

    toast.success(asSubmitted ? `Purchase bill ${billId} submitted! Stock incremented in master.` : `Draft bill ${billId} saved!`)
  }

  const handleSubmitExisting = (id: string) => {
    setBills(bills.map(b => b.id === id ? { ...b, docstatus: 1 } : b))
    toast.success("Purchase bill submitted! Warehouse inventory incremented.")
  }

  const handleCancelExisting = (id: string) => {
    if (!confirm("Are you sure you want to cancel this purchase bill?")) return
    setBills(bills.map(b => b.id === id ? { ...b, docstatus: 2 } : b))
    toast.error("Purchase bill cancelled.")
  }

  const getDocstatusBadge = (status: 0 | 1 | 2) => {
    switch (status) {
      case 1:
        return <Badge className={`${badgeStyles.success} font-medium text-xs`}>Submitted</Badge>
      case 2:
        return <Badge className={`${badgeStyles.danger} font-medium text-xs`}>Cancelled</Badge>
      case 0:
      default:
        return <Badge className={`${badgeStyles.warning} font-medium text-xs`}>Draft</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading tracking-tight">Purchase Bills</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Record supplier bills, track input VAT, and auto-increment warehouse stock.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="btn-pill gap-2 h-11 bg-[#3255f1] hover:bg-[#3255f1]/90 text-white shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            New Purchase Bill
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className={cardStyles.sky.card}>
          <div className={cardStyles.sky.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases (Net)</CardTitle>
            <div className={cardStyles.sky.icon}>
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold font-heading">{formatNPR(stats.totalPurchases)}</div>
            <p className="text-xs text-muted-foreground mt-1">Submitted vendor vouchers</p>
          </CardContent>
        </Card>

        <Card className={cardStyles.teal.card}>
          <div className={cardStyles.teal.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Input VAT Paid</CardTitle>
            <div className={cardStyles.teal.icon}>
              <Percent className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-teal-600 font-heading">{formatNPR(stats.vatPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">Claimable on monthly return</p>
          </CardContent>
        </Card>

        <Card className={`${cardStyles.amber.card} hidden sm:block`}>
          <div className={cardStyles.amber.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bills</CardTitle>
            <div className={cardStyles.amber.icon}>
              <Clock className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-amber-600 font-heading">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by bill # or vendor name..."
            className="pl-10 h-11 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground focus:outline-hidden"
          >
            <option value="all">All Bills</option>
            <option value="0">Draft</option>
            <option value="1">Submitted</option>
            <option value="2">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="card-float border-0 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle className="text-lg font-heading">All Purchase Bills</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredBills.length === bills.length
                ? `${bills.length} bills recorded`
                : `Showing ${filteredBills.length} of ${bills.length} bills`}
            </p>
          </div>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              Clear filter
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-b-2xl">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[140px]">Voucher #</TableHead>
                  <TableHead>Vendor / Supplier</TableHead>
                  <TableHead>Bill Ref</TableHead>
                  <TableHead>Date (AD / BS)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                      No purchase bills found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => (
                    <TableRow key={bill.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-bold text-foreground">
                        {bill.name}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{bill.supplier}</div>
                        {bill.supplier_pan && (
                          <span className="text-xs text-muted-foreground">PAN: {bill.supplier_pan}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{bill.bill_number || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{bill.posting_date}</div>
                        <span className="text-xs text-muted-foreground">{bill.bs_date} BS</span>
                      </TableCell>
                      <TableCell>
                        {getDocstatusBadge(bill.docstatus)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {formatNPR(bill.grand_total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedBill(bill)
                              setIsViewOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {bill.docstatus === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
                              onClick={() => handleSubmitExisting(bill.id)}
                            >
                              Submit
                            </Button>
                          )}

                          {bill.docstatus === 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                              onClick={() => handleCancelExisting(bill.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Purchase Bill Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">New Purchase Bill</DialogTitle>
            <DialogDescription>
              Record inward stock and vendor purchase invoice. Submitting will auto-increment warehouse inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Supplier Name</label>
                <Input
                  placeholder="e.g. Himalayan Agro Wholesalers"
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Supplier PAN</label>
                <Input
                  placeholder="9-digit PAN"
                  value={formSupplierPan}
                  onChange={(e) => setFormSupplierPan(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Supplier Invoice / Bill Ref</label>
              <Input
                placeholder="e.g. HAW-8821"
                value={formRefNumber}
                onChange={(e) => setFormRefNumber(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Items */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inward Items</span>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow} className="h-7 text-xs rounded-lg gap-1">
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-2 border border-border/60 rounded-xl p-3 bg-muted/20">
                {formItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        placeholder="Item name"
                        value={item.item_name}
                        onChange={(e) => {
                          const updated = [...formItems]
                          updated[idx].item_name = e.target.value
                          setFormItems(updated)
                        }}
                        className="h-9 text-xs rounded-lg"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => {
                          const updated = [...formItems]
                          updated[idx].qty = Number(e.target.value)
                          setFormItems(updated)
                        }}
                        className="h-9 text-xs rounded-lg text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Cost"
                        value={item.rate}
                        onChange={(e) => {
                          const updated = [...formItems]
                          updated[idx].rate = Number(e.target.value)
                          setFormItems(updated)
                        }}
                        className="h-9 text-xs rounded-lg text-right"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-muted-foreground hover:text-rose-500 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakdown */}
            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Net Purchase:</span>
                <span>{formatNPR(formCalculations.net)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>13% Input VAT:</span>
                <span>{formatNPR(formCalculations.vat)}</span>
              </div>
              <div className="border-t border-border/60 pt-2 flex justify-between font-bold text-base text-foreground">
                <span>Grand Total:</span>
                <span className="text-[#3255f1]">{formatNPR(formCalculations.grand)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleCreateBill(false)}
              className="rounded-full"
            >
              Save Draft
            </Button>
            <Button
              onClick={() => handleCreateBill(true)}
              className="btn-pill bg-[#3255f1] hover:bg-[#3255f1]/90 text-white rounded-full px-5"
            >
              Submit & Add Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
