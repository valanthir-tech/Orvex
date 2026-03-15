"use client"

import { useState, useCallback, useEffect } from "react"
import { Search, User, UserPlus, X, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getCustomers, createCustomer } from "@/app/actions/customers"
import type { Customer } from "@/app/actions/customers"

interface CustomerPickerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Called with (name, pan) when a customer is selected */
    onSelect: (name: string, pan: string) => void
    currentName?: string
}

export function CustomerPickerDialog({
    open,
    onOpenChange,
    onSelect,
    currentName,
}: CustomerPickerDialogProps) {
    const [search, setSearch] = useState("")
    const [results, setResults] = useState<Customer[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [quickName, setQuickName] = useState("")
    const [quickPhone, setQuickPhone] = useState("")
    const [isAdding, setIsAdding] = useState(false)

    const searchCustomers = useCallback(async (term: string) => {
        setIsSearching(true)
        try {
            const data = await getCustomers(term || undefined)
            setResults(data)
        } catch {
            toast.error("Failed to search customers")
        } finally {
            setIsSearching(false)
        }
    }, [])

    // Load all customers when dialog opens
    useEffect(() => {
        if (open) {
            setSearch("")
            setShowQuickAdd(false)
            setQuickName("")
            setQuickPhone("")
            searchCustomers("")
        }
    }, [open, searchCustomers])

    // Debounced search on input change
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (open) searchCustomers(search)
        }, 300)
        return () => clearTimeout(timeout)
    }, [search, open, searchCustomers])

    function handleSelect(customer: Customer) {
        onSelect(customer.name, customer.pan_number || "")
        onOpenChange(false)
    }

    function handleWalkIn() {
        onSelect("Walk-in Customer", "")
        onOpenChange(false)
    }

    async function handleQuickAdd() {
        if (!quickName.trim()) return
        setIsAdding(true)
        try {
            const result = await createCustomer({
                name: quickName.trim(),
                phone: quickPhone.trim() || undefined,
            })
            if (result.error || !result.data) {
                toast.error("Failed to add customer")
                return
            }
            onSelect(result.data.name, result.data.pan_number || "")
            toast.success(`Customer "${result.data.name}" added`)
            onOpenChange(false)
        } catch {
            toast.error("Failed to add customer")
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-3 border-b">
                    <DialogTitle>Select Customer</DialogTitle>
                </DialogHeader>

                {/* Search */}
                <div className="px-4 pt-3 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or phone..."
                            className="pl-9 h-10 rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                        {search && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                onClick={() => setSearch("")}
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Walk-in option */}
                <div className="px-4 pb-2">
                    <button
                        onClick={handleWalkIn}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-colors ${
                            !currentName || currentName === "Walk-in Customer"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                        }`}
                    >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-sm">Walk-in Customer</p>
                            <p className="text-xs text-muted-foreground">No account required</p>
                        </div>
                    </button>
                </div>

                {/* Customer list */}
                <ScrollArea className="max-h-56 px-4">
                    {isSearching ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : results.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">
                            {search ? "No customers found" : "No customers yet — add one below"}
                        </p>
                    ) : (
                        <div className="space-y-1 pb-2">
                            {results.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => handleSelect(c)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left ${
                                        currentName === c.name
                                            ? "bg-primary/5 border border-primary/30"
                                            : ""
                                    }`}
                                >
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-primary font-bold text-sm">
                                            {c.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{c.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {c.phone || "No phone"}{c.pan_number ? ` · PAN: ${c.pan_number}` : ""}
                                        </p>
                                    </div>
                                    {c.outstanding_balance > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 flex-shrink-0"
                                        >
                                            Rs. {c.outstanding_balance.toLocaleString()} due
                                        </Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Quick-add */}
                <div className="px-4 py-3 border-t bg-muted/30">
                    {showQuickAdd ? (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">New customer</p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Name *"
                                    className="h-9 rounded-lg flex-1 text-sm"
                                    value={quickName}
                                    onChange={(e) => setQuickName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                                />
                                <Input
                                    placeholder="Phone"
                                    className="h-9 rounded-lg w-28 text-sm"
                                    value={quickPhone}
                                    onChange={(e) => setQuickPhone(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                                />
                                <Button
                                    size="sm"
                                    className="h-9 rounded-lg px-3"
                                    onClick={handleQuickAdd}
                                    disabled={isAdding || !quickName.trim()}
                                >
                                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 rounded-lg px-2"
                                    onClick={() => setShowQuickAdd(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowQuickAdd(true)}
                        >
                            <UserPlus className="h-4 w-4" />
                            Add new customer
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
