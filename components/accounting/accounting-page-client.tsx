"use client"

import { useState } from "react"
import { BookOpen, Percent, ChevronRight, ChevronDown, Download, CheckCircle2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { formatNPR } from "@/lib/nepal-localization"

interface AccountNode {
  id: string
  name: string
  code: string
  type: "Root" | "Group" | "Ledger"
  balance: number
  children?: AccountNode[]
}

const COA_TREE: AccountNode[] = [
  {
    id: "1",
    name: "Application of Funds (Assets)",
    code: "1000",
    type: "Root",
    balance: 850000,
    children: [
      {
        id: "1.1",
        name: "Current Assets",
        code: "1100",
        type: "Group",
        balance: 620000,
        children: [
          { id: "1.1.1", name: "Cash in Hand - Counter 1", code: "1110", type: "Ledger", balance: 45000 },
          { id: "1.1.2", name: "Nabil Bank Operating Account", code: "1120", type: "Ledger", balance: 320000 },
          { id: "1.1.3", name: "Accounts Receivable (Customer Khata)", code: "1130", type: "Ledger", balance: 135000 },
          { id: "1.1.4", name: "Stock in Hand (Warehouse Inventory)", code: "1140", type: "Ledger", balance: 120000 },
        ],
      },
      {
        id: "1.2",
        name: "Fixed Assets",
        code: "1200",
        type: "Group",
        balance: 230000,
        children: [
          { id: "1.2.1", name: "POS Terminals & Hardware", code: "1210", type: "Ledger", balance: 150000 },
          { id: "1.2.2", name: "Store Interior & Fixtures", code: "1220", type: "Ledger", balance: 80000 },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Source of Funds (Liabilities)",
    code: "2000",
    type: "Root",
    balance: 850000,
    children: [
      {
        id: "2.1",
        name: "Current Liabilities",
        code: "2100",
        type: "Group",
        balance: 210000,
        children: [
          { id: "2.1.1", name: "Accounts Payable (Vendor Bills)", code: "2110", type: "Ledger", balance: 145000 },
          { id: "2.1.2", name: "Duties and Taxes (VAT 13% Payable)", code: "2120", type: "Ledger", balance: 65000 },
        ],
      },
      {
        id: "2.2",
        name: "Owner Equity & Reserves",
        code: "2200",
        type: "Group",
        balance: 640000,
        children: [
          { id: "2.2.1", name: "Capital Stock", code: "2210", type: "Ledger", balance: 500000 },
          { id: "2.2.2", name: "Retained Earnings", code: "2220", type: "Ledger", balance: 140000 },
        ],
      },
    ],
  },
]

export default function AccountingPageClient() {
  const [activeTab, setActiveTab] = useState<"coa" | "vat">("coa")
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    "1": true,
    "1.1": true,
    "2": true,
    "2.1": true,
  })

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // VAT calculations (Annex 13 IRD format)
  const salesNet = 450000
  const salesVat = Math.round(salesNet * 0.13) // 58,500
  const purchaseNet = 220000
  const purchaseVat = Math.round(purchaseNet * 0.13) // 28,600
  const netVatPayable = salesVat - purchaseVat // 29,900

  const handleExportAnnex13 = () => {
    toast.success("Downloaded IRD Annex 13 Monthly VAT Return XML / CSV!")
  }

  const renderTree = (node: AccountNode, depth: number = 0) => {
    const isExpanded = expandedNodes[node.id]
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.id} className="space-y-1">
        <div
          onClick={() => hasChildren && toggleNode(node.id)}
          className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/40 transition-colors ${
            hasChildren ? "cursor-pointer font-semibold" : "pl-8 text-muted-foreground"
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 24)}px` }}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <span className="text-muted-foreground">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            )}
            <span className="font-mono text-xs text-muted-foreground mr-1">{node.code}</span>
            <span className="text-sm text-foreground">{node.name}</span>
            <Badge variant="outline" className="text-[10px] ml-2">
              {node.type}
            </Badge>
          </div>
          <div className="text-sm font-bold text-foreground">
            {formatNPR(node.balance)}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading tracking-tight">Chart of Accounts & Tax</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hierarchical chart of accounts and Nepal Inland Revenue Department (IRD) Annex 13 VAT summary.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="inline-flex rounded-full bg-muted p-1">
            <button
              onClick={() => setActiveTab("coa")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "coa"
                  ? "bg-[#3255f1] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Chart of Accounts
            </button>
            <button
              onClick={() => setActiveTab("vat")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "vat"
                  ? "bg-[#3255f1] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly VAT (Annex 13)
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className={cardStyles.teal.card}>
          <div className={cardStyles.teal.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sales VAT Collected (13%)</CardTitle>
            <div className={cardStyles.teal.icon}>
              <Percent className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold font-heading">{formatNPR(salesVat)}</div>
            <p className="text-xs text-muted-foreground mt-1">Output VAT on Rs. 4,50,000 sales</p>
          </CardContent>
        </Card>

        <Card className={cardStyles.sky.card}>
          <div className={cardStyles.sky.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Purchase VAT Claimable (13%)</CardTitle>
            <div className={cardStyles.sky.icon}>
              <Percent className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-sky-600 font-heading">{formatNPR(purchaseVat)}</div>
            <p className="text-xs text-muted-foreground mt-1">Input VAT on purchase invoices</p>
          </CardContent>
        </Card>

        <Card className={`${cardStyles.emerald.card} hidden sm:block`}>
          <div className={cardStyles.emerald.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net VAT Payable (IRD)</CardTitle>
            <div className={cardStyles.emerald.icon}>
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-emerald-600 font-heading">{formatNPR(netVatPayable)}</div>
            <p className="text-xs text-muted-foreground mt-1">Due by 25th of next Nepali month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
      {activeTab === "coa" ? (
        <Card className="card-float border-0 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-heading">Chart of Accounts Tree</CardTitle>
            <CardDescription>Click to expand and view ledger account balances</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {COA_TREE.map((root) => renderTree(root))}
          </CardContent>
        </Card>
      ) : (
        <Card className="card-float border-0 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <div>
              <CardTitle className="text-lg font-heading">Nepal IRD Annex 13 VAT Statement</CardTitle>
              <CardDescription>Ashoj 2083 (Sept/Oct 2026) Monthly Tax Return Filing</CardDescription>
            </div>
            <Button
              onClick={handleExportAnnex13}
              className="btn-pill gap-2 bg-[#3255f1] hover:bg-[#3255f1]/90 text-white rounded-full"
            >
              <Download className="h-4 w-4" /> Export Annex 13
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Particulars (विवरण)</TableHead>
                  <TableHead className="text-right">Taxable Amount (कर योग्य रकम)</TableHead>
                  <TableHead className="text-right">VAT Rate</TableHead>
                  <TableHead className="text-right">VAT Amount (कर रकम)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-foreground">
                    1. Total Taxable Sales (बिक्री कर)
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatNPR(salesNet)}</TableCell>
                  <TableCell className="text-right">13%</TableCell>
                  <TableCell className="text-right font-bold text-foreground">{formatNPR(salesVat)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-foreground">
                    2. Less: Taxable Purchases (खरिद कर कट्टी)
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatNPR(purchaseNet)}</TableCell>
                  <TableCell className="text-right">13%</TableCell>
                  <TableCell className="text-right font-bold text-sky-600">({formatNPR(purchaseVat)})</TableCell>
                </TableRow>
                <TableRow className="bg-muted/30 font-bold border-t-2 border-border">
                  <TableCell className="text-base text-foreground">
                    3. Net VAT Payable to Inland Revenue (बुझाउनुपर्ने खुद मूल्य अभिवृद्धि कर)
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatNPR(salesNet - purchaseNet)}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right font-extrabold text-base text-[#3255f1]">
                    {formatNPR(netVatPayable)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
