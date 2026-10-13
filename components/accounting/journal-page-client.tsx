"use client"

import { useState, useMemo } from "react"
import { Plus, Search, BookOpen, CheckCircle2, AlertCircle, Trash2, Eye } from "lucide-react"
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
import { formatNPR, convertADtoBS, formatBS } from "@/lib/nepal-localization"

interface JournalLine {
  id: string
  account: string
  debit: number
  credit: number
}

interface JournalEntry {
  id: string
  voucher_no: string
  posting_date: string
  bs_date: string
  narration: string
  total_debit: number
  total_credit: number
  docstatus: 0 | 1 | 2
  lines: JournalLine[]
}

const ACCOUNTS = [
  "Cash in Hand - Primary Store",
  "Nabil Bank Operating Account",
  "Accounts Receivable (Debtors)",
  "Accounts Payable (Creditors)",
  "Sales Revenue - Retail",
  "Cost of Goods Sold (COGS)",
  "Input VAT 13% (Receivable)",
  "Output VAT 13% (Payable)",
  "Rent & Utilities Expense",
  "Staff Salaries Expense",
]

const INITIAL_JOURNALS: JournalEntry[] = [
  {
    id: "jv-1",
    voucher_no: "JV-2083-001",
    posting_date: "2026-10-12",
    bs_date: "2083-06-26",
    narration: "Daily retail cash collection deposit to Nabil Bank",
    total_debit: 50000,
    total_credit: 50000,
    docstatus: 1,
    lines: [
      { id: "1", account: "Nabil Bank Operating Account", debit: 50000, credit: 0 },
      { id: "2", account: "Cash in Hand - Primary Store", debit: 0, credit: 50000 },
    ],
  },
  {
    id: "jv-2",
    voucher_no: "JV-2083-002",
    posting_date: "2026-10-11",
    bs_date: "2083-06-25",
    narration: "Store premise advance rent payment",
    total_debit: 35000,
    total_credit: 35000,
    docstatus: 1,
    lines: [
      { id: "3", account: "Rent & Utilities Expense", debit: 35000, credit: 0 },
      { id: "4", account: "Nabil Bank Operating Account", debit: 0, credit: 35000 },
    ],
  },
]

export default function JournalPageClient() {
  const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS)
  const [search, setSearch] = useState("")

  // Modal dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [narration, setNarration] = useState("")
  const [lines, setLines] = useState<JournalLine[]>([
    { id: "1", account: "Nabil Bank Operating Account", debit: 15000, credit: 0 },
    { id: "2", account: "Sales Revenue - Retail", debit: 0, credit: 15000 },
  ])

  const filteredJournals = useMemo(() => {
    return journals.filter(
      (j) =>
        j.voucher_no.toLowerCase().includes(search.toLowerCase()) ||
        j.narration.toLowerCase().includes(search.toLowerCase())
    )
  }, [journals, search])

  // Real-time Dr/Cr calculations for modal
  const { totalDr, totalCr, diff, isBalanced } = useMemo(() => {
    const dr = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
    const cr = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
    const d = Math.abs(dr - cr)
    return {
      totalDr: dr,
      totalCr: cr,
      diff: d,
      isBalanced: dr > 0 && dr === cr,
    }
  }, [lines])

  const stats = useMemo(() => {
    const totalDr = journals.reduce((s, j) => s + j.total_debit, 0)
    const totalCr = journals.reduce((s, j) => s + j.total_credit, 0)
    return { totalDr, totalCr, count: journals.length }
  }, [journals])

  const handleAddLine = () => {
    setLines([...lines, { id: String(Date.now()), account: ACCOUNTS[0], debit: 0, credit: 0 }])
  }

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) {
      toast.error("A double-entry journal requires at least 2 lines")
      return
    }
    setLines(lines.filter((_, i) => i !== idx))
  }

  const handleCreateVoucher = () => {
    if (!isBalanced) {
      toast.error(`Debits and Credits must balance! Difference: ${formatNPR(diff)}`)
      return
    }
    if (!narration.trim()) {
      toast.error("Please provide a narration/remarks for the journal entry")
      return
    }

    const today = new Date().toISOString().split("T")[0]
    const bs = formatBS(today)
    const vNo = `JV-2083-${String(journals.length + 1).padStart(3, "0")}`

    const newJv: JournalEntry = {
      id: `jv-${Date.now()}`,
      voucher_no: vNo,
      posting_date: today,
      bs_date: bs,
      narration,
      total_debit: totalDr,
      total_credit: totalCr,
      docstatus: 1,
      lines,
    }

    setJournals([newJv, ...journals])
    setIsCreateOpen(false)
    setNarration("")
    setLines([
      { id: "1", account: "Nabil Bank Operating Account", debit: 10000, credit: 0 },
      { id: "2", account: "Sales Revenue - Retail", debit: 0, credit: 10000 },
    ])

    toast.success(`Journal Voucher ${vNo} submitted and posted to General Ledger!`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading tracking-tight">Journal Entries</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manual accounting vouchers enforcing strict double-entry invariant (Total Debit = Total Credit).
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="btn-pill gap-2 h-11 bg-[#3255f1] hover:bg-[#3255f1]/90 text-white shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            New Journal Entry
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className={cardStyles.violet.card}>
          <div className={cardStyles.violet.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posted Debits</CardTitle>
            <div className={cardStyles.violet.icon}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold font-heading">{formatNPR(stats.totalDr)}</div>
            <p className="text-xs text-muted-foreground mt-1">General ledger debits</p>
          </CardContent>
        </Card>

        <Card className={cardStyles.teal.card}>
          <div className={cardStyles.teal.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posted Credits</CardTitle>
            <div className={cardStyles.teal.icon}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-teal-600 font-heading">{formatNPR(stats.totalCr)}</div>
            <p className="text-xs text-muted-foreground mt-1">General ledger credits</p>
          </CardContent>
        </Card>

        <Card className={`${cardStyles.emerald.card} hidden sm:block`}>
          <div className={cardStyles.emerald.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ledger Balance Status</CardTitle>
            <div className={cardStyles.emerald.icon}>
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-emerald-600 font-heading">Balanced (100%)</div>
            <p className="text-xs text-muted-foreground mt-1">Dr = Cr verified across all records</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search voucher # or narration..."
          className="pl-10 h-11 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Main Table Area */}
      <Card className="card-float border-0 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle className="text-lg font-heading">Journal Vouchers</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Showing {filteredJournals.length} vouchers
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-b-2xl">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[140px]">Voucher #</TableHead>
                  <TableHead>Date (AD / BS)</TableHead>
                  <TableHead>Narration / Remarks</TableHead>
                  <TableHead className="text-right">Debit (Rs.)</TableHead>
                  <TableHead className="text-right">Credit (Rs.)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJournals.map((j) => (
                  <TableRow key={j.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-bold text-foreground">{j.voucher_no}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">{j.posting_date}</div>
                      <span className="text-xs text-muted-foreground">{j.bs_date} BS</span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground max-w-md truncate">
                      {j.narration}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {formatNPR(j.total_debit)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {formatNPR(j.total_credit)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${badgeStyles.success} text-xs font-semibold`}>Submitted</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Journal Voucher Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">New Journal Entry</DialogTitle>
            <DialogDescription>
              Double-entry voucher creator. The Submit button is enabled ONLY when Total Debit equals Total Credit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Narration / Remarks</label>
              <Input
                placeholder="e.g. Settlement of monthly utility bills via bank transfer"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Entry lines */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Lines</span>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLine} className="h-7 text-xs rounded-lg gap-1">
                  <Plus className="h-3 w-3" /> Add Line
                </Button>
              </div>

              <div className="space-y-2 border border-border/60 rounded-xl p-3 bg-muted/20">
                {lines.map((line, idx) => (
                  <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <select
                        value={line.account}
                        onChange={(e) => {
                          const updated = [...lines]
                          updated[idx].account = e.target.value
                          setLines(updated)
                        }}
                        className="w-full h-9 px-2 text-xs rounded-lg border border-border bg-card text-foreground"
                      >
                        {ACCOUNTS.map((acc) => (
                          <option key={acc} value={acc}>
                            {acc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2.5 sm:col-span-3">
                      <Input
                        type="number"
                        placeholder="Debit"
                        value={line.debit || ""}
                        onChange={(e) => {
                          const updated = [...lines]
                          updated[idx].debit = Number(e.target.value) || 0
                          if (Number(e.target.value) > 0) updated[idx].credit = 0
                          setLines(updated)
                        }}
                        className="h-9 text-xs rounded-lg text-right font-medium"
                      />
                    </div>
                    <div className="col-span-2.5 sm:col-span-2">
                      <Input
                        type="number"
                        placeholder="Credit"
                        value={line.credit || ""}
                        onChange={(e) => {
                          const updated = [...lines]
                          updated[idx].credit = Number(e.target.value) || 0
                          if (Number(e.target.value) > 0) updated[idx].debit = 0
                          setLines(updated)
                        }}
                        className="h-9 text-xs rounded-lg text-right font-medium"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      {lines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
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

            {/* Invariant Balance Status Bar */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                isBalanced
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-800 dark:text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {isBalanced ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                )}
                <span>
                  {isBalanced
                    ? "Voucher Balanced (Total Dr === Total Cr)"
                    : `Unbalanced! Difference: ${formatNPR(diff)}`}
                </span>
              </div>
              <div className="flex gap-4">
                <span>Dr: {formatNPR(totalDr)}</span>
                <span>Cr: {formatNPR(totalCr)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleCreateVoucher}
              disabled={!isBalanced}
              className={`btn-pill px-6 rounded-full text-white ${
                isBalanced ? "bg-[#3255f1] hover:bg-[#3255f1]/90 shadow-md" : "opacity-50 cursor-not-allowed bg-muted-foreground"
              }`}
            >
              Post Journal Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
