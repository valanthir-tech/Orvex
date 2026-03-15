"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Users, Search, Plus,
    CreditCard, Loader2, FileText,
    ArrowDownCircle, ArrowUpCircle, Wallet, Pencil,
    Trash2, Eye, RefreshCw, X,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { badgeStyles, cardStyles } from "@/lib/theme"
import {
    getCustomers, createCustomer, updateCustomer, deleteCustomer,
    recordPayment, getCustomerTransactions,
    type Customer, type CustomerTransaction,
} from "@/app/actions/customers"

// ─── Format helpers ──────────────────────────────────────────────────────────

function formatPrice(amount: number) {
    return `Rs. ${amount.toLocaleString("en-NP", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CustomersPageClient({ hasKhataAccess = false }: { hasKhataAccess?: boolean }) {
    const router = useRouter()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")

    // Modals
    const [addOpen, setAddOpen] = useState(false)
    const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
    const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
    const [paymentOpen, setPaymentOpen] = useState(false)
    const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null)
    const [transactions, setTransactions] = useState<CustomerTransaction[]>([])
    const [loadingTx, setLoadingTx] = useState(false)

    // Form state
    const [formName, setFormName] = useState("")
    const [formPhone, setFormPhone] = useState("")
    const [formEmail, setFormEmail] = useState("")
    const [formAddress, setFormAddress] = useState("")
    const [formPan, setFormPan] = useState("")
    const [formCreditLimit, setFormCreditLimit] = useState("")
    const [formNotes, setFormNotes] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    // Payment form
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentDescription, setPaymentDescription] = useState("")

    // Load customers
    const loadCustomers = useCallback(async () => {
        try {
            const data = await getCustomers(search || undefined)
            setCustomers(data)
        } catch {
            toast.error("Failed to load customers")
        } finally {
            setIsLoading(false)
        }
    }, [search])

    useEffect(() => {
        loadCustomers()
    }, [loadCustomers])

    // Stats
    const totalCustomers = customers.filter(c => c.name !== "Walk-in Customer").length
    const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_balance, 0)
    const activeCustomers = customers.filter(c => c.is_active && c.name !== "Walk-in Customer").length

    // Reset form
    function resetForm() {
        setFormName(""); setFormPhone(""); setFormEmail("")
        setFormAddress(""); setFormPan(""); setFormCreditLimit("")
        setFormNotes("")
    }

    // Open edit
    function openEdit(customer: Customer) {
        setFormName(customer.name)
        setFormPhone(customer.phone || "")
        setFormEmail(customer.email || "")
        setFormAddress(customer.address || "")
        setFormPan(customer.pan_number || "")
        setFormCreditLimit(String(customer.credit_limit || ""))
        setFormNotes(customer.notes || "")
        setEditCustomer(customer)
    }

    // Open khata view
    async function openKhata(customer: Customer) {
        if (!hasKhataAccess) {
            toast('Feature Locked', {
                description: 'Please upgrade to the Growth plan to unlock Khata (Credit Tracking).',
                action: {
                    label: 'Upgrade',
                    onClick: () => router.push('/settings/subscription')
                },
            });
            return;
        }

        setViewCustomer(customer)
        setLoadingTx(true)
        try {
            const tx = await getCustomerTransactions(customer.id)
            setTransactions(tx)
        } catch {
            toast.error("Failed to load transactions")
        }
        setLoadingTx(false)
    }

    // Save customer (create or update)
    async function handleSave() {
        if (!formName.trim()) { toast.error("Name is required"); return }
        setIsSaving(true)
        try {
            if (editCustomer) {
                const result = await updateCustomer(editCustomer.id, {
                    name: formName,
                    phone: formPhone || undefined,
                    email: formEmail || undefined,
                    address: formAddress || undefined,
                    pan_number: formPan || undefined,
                    credit_limit: parseFloat(formCreditLimit) || 0,
                    notes: formNotes || undefined,
                })
                if (result.error) { toast.error(result.error); return }
                toast.success("Customer updated")
                setEditCustomer(null)
            } else {
                const result = await createCustomer({
                    name: formName,
                    phone: formPhone || undefined,
                    email: formEmail || undefined,
                    address: formAddress || undefined,
                    pan_number: formPan || undefined,
                    credit_limit: parseFloat(formCreditLimit) || 0,
                    notes: formNotes || undefined,
                })
                if (result.error) { toast.error(result.error); return }
                toast.success("Customer added")
                setAddOpen(false)
            }
            resetForm()
            loadCustomers()
        } catch {
            toast.error("Failed to save customer")
        } finally {
            setIsSaving(false)
        }
    }

    // Delete customer
    async function handleDelete(customer: Customer) {
        if (!confirm(`Delete ${customer.name}?`)) return
        const result = await deleteCustomer(customer.id)
        if (result.error) { toast.error(result.error); return }
        toast.success("Customer deleted")
        loadCustomers()
    }

    // Record payment
    async function handlePayment() {
        if (!paymentCustomer) return
        const amount = parseFloat(paymentAmount)
        if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return }
        setIsSaving(true)
        try {
            const result = await recordPayment({
                customer_id: paymentCustomer.id,
                amount,
                description: paymentDescription || undefined,
            })
            if (result.error) { toast.error(result.error); return }
            toast.success(`Payment of ${formatPrice(amount)} recorded`)
            setPaymentOpen(false)
            setPaymentAmount("")
            setPaymentDescription("")
            setPaymentCustomer(null)
            loadCustomers()
        } catch {
            toast.error("Failed to record payment")
        } finally {
            setIsSaving(false)
        }
    }

    // Customer form fields (shared between add and edit)
    const CustomerForm = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Full name" className="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="9841234567" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" className="h-11 rounded-xl" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Kathmandu, Nepal" className="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>PAN Number</Label>
                    <Input value={formPan} onChange={(e) => setFormPan(e.target.value)} placeholder="PAN" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label>Credit Limit (Rs.)</Label>
                    <Input type="number" value={formCreditLimit} onChange={(e) => setFormCreditLimit(e.target.value)} placeholder="0" className="h-11 rounded-xl" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Any notes about this customer..." rows={2} />
            </div>
        </div>
    )

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading tracking-tight">Customers</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage customers and track credit (Khata)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-11 w-11"
                        onClick={() => { setIsLoading(true); loadCustomers() }}
                        disabled={isLoading}
                        title="Refresh"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                        className="btn-pill gap-2 h-11 shadow-lg shadow-primary/20"
                        onClick={() => { resetForm(); setAddOpen(true) }}
                    >
                        <Plus className="h-4 w-4" /> Add Customer
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                <Card className={cardStyles.teal.card}>
                    <div className={cardStyles.teal.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Customers
                        </CardTitle>
                        <div className={cardStyles.teal.icon}>
                            <Users className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{totalCustomers}</div>
                        <div className="text-xs mt-2 text-muted-foreground">excluding walk-in</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.amber.card}>
                    <div className={cardStyles.amber.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Outstanding
                        </CardTitle>
                        <div className={cardStyles.amber.icon}>
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{formatPrice(totalOutstanding)}</div>
                        <div className="text-xs mt-2 text-muted-foreground">pending balance</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.emerald.card}>
                    <div className={cardStyles.emerald.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Customers
                        </CardTitle>
                        <div className={cardStyles.emerald.icon}>
                            <CreditCard className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{activeCustomers}</div>
                        <div className="text-xs mt-2 text-muted-foreground">currently active</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or phone..."
                        className="pl-10 h-11 rounded-xl"
                    />
                    {search && (
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center"
                            onClick={() => setSearch("")}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Customer Table */}
            <Card className="card-float border-0 rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="pl-6">Customer</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Outstanding</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5)
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
                        ) : customers.filter(c => c.name !== "Walk-in Customer").length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-20 text-muted-foreground"
                                >
                                    <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                                    <p className="font-medium">No customers found</p>
                                    <p className="text-sm">
                                        {search ? "Try a different search term." : "Add your first customer to get started."}
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.filter(c => c.name !== "Walk-in Customer").map((customer) => (
                                <TableRow key={customer.id} className="group hover:bg-muted/20">
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                                                <span className="text-sm font-bold text-primary">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{customer.name}</p>
                                                {customer.email && (
                                                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {customer.phone || "—"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {customer.address || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                customer.is_active
                                                    ? badgeStyles.success
                                                    : "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"
                                            }
                                        >
                                            {customer.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {customer.outstanding_balance > 0 ? (
                                            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                {formatPrice(customer.outstanding_balance)}
                                            </span>
                                        ) : (
                                            <Badge className={`${badgeStyles.success} text-xs`}>Clear</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-xl hover:bg-muted"
                                                onClick={() => openKhata(customer)}
                                                title="View Khata"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                                                onClick={() => {
                                                    if (!hasKhataAccess) {
                                                        toast('Feature Locked', {
                                                            description: 'Please upgrade to the Growth plan to unlock Khata payments.',
                                                            action: { label: 'Upgrade', onClick: () => router.push('/settings/subscription') },
                                                        });
                                                        return;
                                                    }
                                                    setPaymentCustomer(customer); setPaymentOpen(true) 
                                                }}
                                                title="Record Payment"
                                            >
                                                <ArrowDownCircle className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-xl hover:bg-muted"
                                                onClick={() => openEdit(customer)}
                                                title="Edit"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => handleDelete(customer)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Add Customer Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Customer</DialogTitle>
                        <DialogDescription>Add a new customer to your store</DialogDescription>
                    </DialogHeader>
                    <CustomerForm />
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="rounded-xl gap-2">
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Add Customer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Customer Dialog */}
            <Dialog open={!!editCustomer} onOpenChange={(open) => !open && setEditCustomer(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Customer</DialogTitle>
                        <DialogDescription>Update customer information</DialogDescription>
                    </DialogHeader>
                    <CustomerForm />
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setEditCustomer(null)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="rounded-xl gap-2">
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Record Payment Dialog */}
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogContent className="sm:max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            {paymentCustomer && `Payment from ${paymentCustomer.name}`}
                            {paymentCustomer && paymentCustomer.outstanding_balance > 0 && (
                                <span className="block mt-1 text-amber-600">
                                    Outstanding: {formatPrice(paymentCustomer.outstanding_balance)}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Amount (Rs.) *</Label>
                            <Input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="0"
                                className="h-11 rounded-xl text-lg"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={paymentDescription}
                                onChange={(e) => setPaymentDescription(e.target.value)}
                                placeholder="Payment received"
                                className="h-11 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                        <Button onClick={handlePayment} disabled={isSaving} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Record Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Khata / Transaction History Dialog */}
            <Dialog open={!!viewCustomer} onOpenChange={(open) => !open && setViewCustomer(null)}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Khata - {viewCustomer?.name}
                        </DialogTitle>
                        <DialogDescription>
                            {viewCustomer && (
                                <span className="flex items-center gap-4 mt-2">
                                    <span>Total Purchases: {formatPrice(viewCustomer.total_purchases)}</span>
                                    <span>Paid: {formatPrice(viewCustomer.total_payments)}</span>
                                    <span className={viewCustomer.outstanding_balance > 0 ? "text-amber-600 font-semibold" : "text-emerald-600"}>
                                        Balance: {formatPrice(viewCustomer.outstanding_balance)}
                                    </span>
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[400px]">
                        {loadingTx ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                        ) : (
                            <div className="space-y-2">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                            tx.type === "payment" 
                                                ? "bg-emerald-100 dark:bg-emerald-900/30" 
                                                : "bg-amber-100 dark:bg-amber-900/30"
                                        }`}>
                                            {tx.type === "payment" ? (
                                                <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <ArrowUpCircle className="h-4 w-4 text-amber-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium capitalize">{tx.type}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {tx.description} &middot; {new Date(tx.created_at).toLocaleDateString("en-NP")}
                                            </p>
                                        </div>
                                        <p className={`text-sm font-semibold ${
                                            tx.type === "payment" ? "text-emerald-600" : "text-amber-600"
                                        }`}>
                                            {tx.type === "payment" ? "-" : "+"}{formatPrice(tx.amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setViewCustomer(null)}>Close</Button>
                        {viewCustomer && viewCustomer.outstanding_balance > 0 && (
                            <Button
                                onClick={() => {
                                    setPaymentCustomer(viewCustomer)
                                    setViewCustomer(null)
                                    setPaymentOpen(true)
                                }}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                            >
                                Record Payment
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
