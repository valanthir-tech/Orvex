"use client"

import { useState, useMemo } from "react"
import { 
  Plus, Search, Receipt, Percent, Clock, FileText, CheckCircle2, 
  XCircle, Printer, Eye, Trash2, ArrowUpDown, ChevronDown 
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
import { useERPStore } from "@/lib/stores/erp-store"

interface InvoiceItem {
  id: string
  item_code: string
  item_name: string
  qty: number
  rate: number
  amount: number
}

interface InvoiceRecord {
  id: string
  name: string
  customer: string
  customer_pan?: string
  posting_date: string
  bs_date: string
  docstatus: 0 | 1 | 2 // 0: Draft, 1: Submitted, 2: Cancelled
  items: InvoiceItem[]
  net_total: number
  vat_amount: number
  grand_total: number
  amount_in_words?: string
}

const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: "inv-1",
    name: "INV-2083-001",
    customer: "Pashupati Traders",
    customer_pan: "302918274",
    posting_date: "2026-10-12",
    bs_date: "2083-06-26",
    docstatus: 1,
    items: [
      { id: "1", item_code: "ITM-001", item_name: "Premium Himalayan Tea 250g", qty: 10, rate: 450, amount: 4500 },
      { id: "2", item_code: "ITM-002", item_name: "Mustang Organic Beans 1kg", qty: 5, rate: 320, amount: 1600 }
    ],
    net_total: 6100,
    vat_amount: 793,
    grand_total: 6893,
    amount_in_words: "Six Thousand Eight Hundred Ninety-Three Rupees Only"
  },
  {
    id: "inv-2",
    name: "INV-2083-002",
    customer: "Everest Coffee Hub",
    customer_pan: "601928374",
    posting_date: "2026-10-11",
    bs_date: "2083-06-25",
    docstatus: 1,
    items: [
      { id: "3", item_code: "ITM-003", item_name: "Artisan Coffee Blend 500g", qty: 8, rate: 850, amount: 6800 }
    ],
    net_total: 6800,
    vat_amount: 884,
    grand_total: 7684,
    amount_in_words: "Seven Thousand Six Hundred Eighty-Four Rupees Only"
  },
  {
    id: "inv-3",
    name: "INV-2083-003",
    customer: "Lalitpur Handicrafts",
    posting_date: "2026-10-12",
    bs_date: "2083-06-26",
    docstatus: 0,
    items: [
      { id: "4", item_code: "ITM-004", item_name: "Handcrafted Hemp Wallet", qty: 15, rate: 380, amount: 5700 }
    ],
    net_total: 5700,
    vat_amount: 741,
    grand_total: 6441,
    amount_in_words: "Six Thousand Four Hundred Forty-One Rupees Only"
  }
]

export default function InvoicesPageClient() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "0" | "1" | "2">("all")

  // Modal dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  // Form states
  const [formCustomer, setFormCustomer] = useState("")
  const [formCustomerPan, setFormCustomerPan] = useState("")
  const [formItems, setFormItems] = useState<{ item_code: string; item_name: string; qty: number; rate: number }[]>([
    { item_code: "ITM-001", item_name: "Premium Himalayan Tea 250g", qty: 1, rate: 450 }
  ])

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch = 
        inv.name.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer.toLowerCase().includes(search.toLowerCase())
      
      const matchesStatus = 
        statusFilter === "all" || inv.docstatus.toString() === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [invoices, search, statusFilter])

  // Aggregate stats
  const stats = useMemo(() => {
    const totalInvoiced = invoices.filter(i => i.docstatus === 1).reduce((sum, i) => sum + i.grand_total, 0)
    const vatCollected = invoices.filter(i => i.docstatus === 1).reduce((sum, i) => sum + i.vat_amount, 0)
    const draftCount = invoices.filter(i => i.docstatus === 0).length
    return { totalInvoiced, vatCollected, draftCount }
  }, [invoices])

  // Calculate totals for create form
  const formCalculations = useMemo(() => {
    const net = formItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.rate || 0)), 0)
    const vat = Math.round(net * 0.13)
    const grand = net + vat
    return { net, vat, grand }
  }, [formItems])

  const handleAddItemRow = () => {
    setFormItems([...formItems, { item_code: `ITM-00${formItems.length + 1}`, item_name: "Product Item", qty: 1, rate: 500 }])
  }

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length === 1) return
    setFormItems(formItems.filter((_, i) => i !== index))
  }

  const handleCreateInvoice = (asSubmitted: boolean = false) => {
    if (!formCustomer.trim()) {
      toast.error("Please enter a customer name")
      return
    }

    const today = new Date().toISOString().split("T")[0]
    const bs = formatBS(today)
    const invoiceNumber = `INV-2083-${String(invoices.length + 1).padStart(3, "0")}`

    const newInvoice: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      name: invoiceNumber,
      customer: formCustomer,
      customer_pan: formCustomerPan,
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
      grand_total: formCalculations.grand,
      amount_in_words: formatAmountWords(formCalculations.grand, 'en')
    }

    setInvoices([newInvoice, ...invoices])
    setIsCreateOpen(false)
    setFormCustomer("")
    setFormCustomerPan("")
    setFormItems([{ item_code: "ITM-001", item_name: "Premium Himalayan Tea 250g", qty: 1, rate: 450 }])

    toast.success(asSubmitted ? `Invoice ${invoiceNumber} submitted & stock posted!` : `Draft invoice ${invoiceNumber} saved!`)
  }

  const handleSubmitExisting = (id: string) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === id) {
        return { ...inv, docstatus: 1 }
      }
      return inv
    }))
    toast.success("Invoice submitted! Stock ledger posted.")
  }

  const handleCancelExisting = (id: string) => {
    if (!confirm("Are you sure you want to cancel this invoice? This will reverse ledger entries.")) return
    setInvoices(invoices.map(inv => {
      if (inv.id === id) {
        return { ...inv, docstatus: 2 }
      }
      return inv
    }))
    toast.error("Invoice cancelled.")
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading tracking-tight">Sales Invoices</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage tax invoices, customer billings, and 13% Nepal VAT tracking.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="btn-pill gap-2 h-11 bg-[#3255f1] hover:bg-[#3255f1]/90 text-white shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className={cardStyles.teal.card}>
          <div className={cardStyles.teal.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced (Net)</CardTitle>
            <div className={cardStyles.teal.icon}>
              <Receipt className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold font-heading">{formatNPR(stats.totalInvoiced)}</div>
            <p className="text-xs text-muted-foreground mt-1">Submitted tax invoices</p>
          </CardContent>
        </Card>

        <Card className={cardStyles.violet.card}>
          <div className={cardStyles.violet.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">13% VAT Collected</CardTitle>
            <div className={cardStyles.violet.icon}>
              <Percent className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-violet-600 font-heading">{formatNPR(stats.vatCollected)}</div>
            <p className="text-xs text-muted-foreground mt-1">IRD compliant tax liability</p>
          </CardContent>
        </Card>

        <Card className={`${cardStyles.amber.card} hidden sm:block`}>
          <div className={cardStyles.amber.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft Invoices</CardTitle>
            <div className={cardStyles.amber.icon}>
              <Clock className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-amber-600 font-heading">{stats.draftCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending submission</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by invoice number or customer..."
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
            <option value="all">All Invoices</option>
            <option value="0">Draft</option>
            <option value="1">Submitted</option>
            <option value="2">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Master Invoices Table Card */}
      <Card className="card-float border-0 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle className="text-lg font-heading">All Invoices</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredInvoices.length === invoices.length
                ? `${invoices.length} invoices registered`
                : `Showing ${filteredInvoices.length} of ${invoices.length} invoices`}
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
                  <TableHead className="w-[140px]">Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date (AD / BS)</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                      No invoices found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-bold text-foreground">
                        {inv.name}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{inv.customer}</div>
                        {inv.customer_pan && (
                          <span className="text-xs text-muted-foreground">PAN: {inv.customer_pan}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{inv.posting_date}</div>
                        <span className="text-xs text-muted-foreground">{inv.bs_date} BS</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{inv.items.length} lines</span>
                      </TableCell>
                      <TableCell>
                        {getDocstatusBadge(inv.docstatus)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {formatNPR(inv.grand_total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedInvoice(inv)
                              setIsViewOpen(true)
                            }}
                            title="View / Print Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {inv.docstatus === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
                              onClick={() => handleSubmitExisting(inv.id)}
                            >
                              Submit
                            </Button>
                          )}

                          {inv.docstatus === 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                              onClick={() => handleCancelExisting(inv.id)}
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

      {/* Create Invoice Dialog Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Create Sales Invoice</DialogTitle>
            <DialogDescription>
              Enter billing details and line items. IRD compliant 13% VAT is calculated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer Name</label>
                <Input
                  placeholder="e.g. Pashupati Traders"
                  value={formCustomer}
                  onChange={(e) => setFormCustomer(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer PAN (Optional)</label>
                <Input
                  placeholder="9-digit PAN"
                  value={formCustomerPan}
                  onChange={(e) => setFormCustomerPan(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Line Items</span>
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
                        placeholder="Rate"
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

            {/* Calculations breakdown */}
            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Taxable Amount (Net):</span>
                <span>{formatNPR(formCalculations.net)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>13% Nepal VAT:</span>
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
              onClick={() => handleCreateInvoice(false)}
              className="rounded-full"
            >
              Save Draft
            </Button>
            <Button
              onClick={() => handleCreateInvoice(true)}
              className="btn-pill bg-[#3255f1] hover:bg-[#3255f1]/90 text-white rounded-full px-5"
            >
              Submit & Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / Print Invoice Dialog Modal */}
      {selectedInvoice && (
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-xl rounded-2xl">
            <DialogHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="font-heading text-xl">{selectedInvoice.name}</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedInvoice.posting_date} ({selectedInvoice.bs_date} BS)
                  </p>
                </div>
                <div>{getDocstatusBadge(selectedInvoice.docstatus)}</div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="flex justify-between bg-muted/20 p-3 rounded-xl">
                <div>
                  <span className="text-xs text-muted-foreground block">Billed To</span>
                  <span className="font-bold text-foreground">{selectedInvoice.customer}</span>
                  {selectedInvoice.customer_pan && (
                    <span className="text-xs text-muted-foreground block">PAN: {selectedInvoice.customer_pan}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Status</span>
                  <span className="font-semibold text-foreground">
                    {selectedInvoice.docstatus === 1 ? "Tax Invoice (Submitted)" : selectedInvoice.docstatus === 2 ? "Cancelled" : "Draft"}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="border border-border/60 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border/50">
                    <tr>
                      <th className="p-2.5 text-left font-semibold">Item</th>
                      <th className="p-2.5 text-center font-semibold">Qty</th>
                      <th className="p-2.5 text-right font-semibold">Rate</th>
                      <th className="p-2.5 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-medium">{item.item_name}</td>
                        <td className="p-2.5 text-center">{item.qty}</td>
                        <td className="p-2.5 text-right">{formatNPR(item.rate)}</td>
                        <td className="p-2.5 text-right font-semibold">{formatNPR(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-right pt-2">
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Net Taxable Total:</span>
                  <span>{formatNPR(selectedInvoice.net_total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>13% VAT:</span>
                  <span>{formatNPR(selectedInvoice.vat_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-foreground pt-1 border-t border-border/50">
                  <span>Grand Total:</span>
                  <span className="text-[#3255f1]">{formatNPR(selectedInvoice.grand_total)}</span>
                </div>
                {selectedInvoice.amount_in_words && (
                  <p className="text-[11px] text-muted-foreground italic text-left pt-1">
                    In Words: {selectedInvoice.amount_in_words}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsViewOpen(false)} className="rounded-full">
                Close
              </Button>
              <Button
                onClick={() => {
                  window.print()
                }}
                className="btn-pill bg-[#3255f1] hover:bg-[#3255f1]/90 text-white rounded-full gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Tax Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
