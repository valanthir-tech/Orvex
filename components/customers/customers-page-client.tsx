"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Users, Search, Plus, Phone, Mail, MapPin,
    CreditCard, Loader2, MoreVertical, FileText,
    ArrowDownCircle, ArrowUpCircle, Wallet, Pencil,
    Trash2, Eye,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { badgeStyles } from "@/lib/theme"
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

export default function CustomersPageClient() {
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
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Full name" className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="9841234567" className="h-11" />
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" className="h-11" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Kathmandu, Nepal" className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>PAN Number</Label>
                    <Input value={formPan} onChange={(e) => setFormPan(e.target.value)} placeholder="PAN" className="h-11" />
                </div>
                <div className="space-y-2">
                    <Label>Credit Limit (Rs.)</Label>
                    <Input type="number" value={formCreditLimit} onChange={(e) => setFormCreditLimit(e.target.value)} placeholder="0" className="h-11" />
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
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading tracking-tight">Customers</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage customers and track credit (Khata)
                    </p>
                </div>
                <Button onClick={() => { resetForm(); setAddOpen(true) }} className="btn-pill shadow-lg shadow-primary/20 gap-2">
                    <Plus className="h-4 w-4" /> Add Customer
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="card-float border-0 rounded-2xl">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalCustomers}</p>
                                <p className="text-xs text-muted-foreground">Total Customers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-float border-0 rounded-2xl">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatPrice(totalOutstanding)}</p>
                                <p className="text-xs text-muted-foreground">Total Outstanding</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-float border-0 rounded-2xl">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activeCustomers}</p>
                                <p className="text-xs text-muted-foreground">Active Customers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="pl-10 h-11 rounded-xl"
                />
            </div>

            {/* Customer List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : customers.length === 0 ? (
                <Card className="card-float border-0 rounded-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No customers yet</p>
                        <Button variant="outline" onClick={() => { resetForm(); setAddOpen(true) }}>
                            <Plus className="h-4 w-4 mr-2" /> Add First Customer
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {customers.filter(c => c.name !== "Walk-in Customer").map((customer) => (
                        <Card key={customer.id} className="card-float border-0 rounded-2xl hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                                        <span className="text-lg font-bold text-primary">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold truncate">{customer.name}</p>
                                            {!customer.is_active && (
                                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                            {customer.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {customer.phone}
                                                </span>
                                            )}
                                            {customer.address && (
                                                <span className="flex items-center gap-1 hidden sm:flex">
                                                    <MapPin className="h-3 w-3" /> {customer.address}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Balance */}
                                    <div className="text-right shrink-0">
                                        {customer.outstanding_balance > 0 ? (
                                            <div>
                                                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                    {formatPrice(customer.outstanding_balance)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">outstanding</p>
                                            </div>
                                        ) : (
                                            <Badge className={`${badgeStyles.success} text-xs`}>Clear</Badge>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openKhata(customer)}>
                                                <Eye className="h-4 w-4 mr-2" /> View Khata
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setPaymentCustomer(customer); setPaymentOpen(true) }}>
                                                <ArrowDownCircle className="h-4 w-4 mr-2" /> Record Payment
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openEdit(customer)}>
                                                <Pencil className="h-4 w-4 mr-2" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(customer)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Customer Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Customer</DialogTitle>
                        <DialogDescription>Add a new customer to your store</DialogDescription>
                    </DialogHeader>
                    <CustomerForm />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Add Customer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Customer Dialog */}
            <Dialog open={!!editCustomer} onOpenChange={(open) => !open && setEditCustomer(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Customer</DialogTitle>
                        <DialogDescription>Update customer information</DialogDescription>
                    </DialogHeader>
                    <CustomerForm />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditCustomer(null)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Record Payment Dialog */}
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogContent className="sm:max-w-sm">
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
                                className="h-11 text-lg"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={paymentDescription}
                                onChange={(e) => setPaymentDescription(e.target.value)}
                                placeholder="Payment received"
                                className="h-11"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                        <Button onClick={handlePayment} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Record Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Khata / Transaction History Dialog */}
            <Dialog open={!!viewCustomer} onOpenChange={(open) => !open && setViewCustomer(null)}>
                <DialogContent className="sm:max-w-lg">
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
                        <Button variant="outline" onClick={() => setViewCustomer(null)}>Close</Button>
                        {viewCustomer && viewCustomer.outstanding_balance > 0 && (
                            <Button
                                onClick={() => {
                                    setPaymentCustomer(viewCustomer)
                                    setViewCustomer(null)
                                    setPaymentOpen(true)
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700"
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
