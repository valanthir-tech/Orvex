"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Search, ShieldAlert, CheckCircle, Store, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { getStorefrontCustomers, toggleStorefrontCustomerStatus, type StorefrontCustomer } from "@/app/actions/customers"
import { cardStyles } from "@/lib/theme"

export default function StorefrontCustomersTab() {
    const [customers, setCustomers] = useState<StorefrontCustomer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [toggling, setToggling] = useState<string | null>(null)

    const loadCustomers = async () => {
        setIsLoading(true)
        try {
            const data = await getStorefrontCustomers(search)
            setCustomers(data)
        } catch (err) {
            toast.error("Failed to load storefront customers")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadCustomers()
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        loadCustomers()
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        setToggling(id)
        try {
            const newStatus = !currentStatus
            const res = await toggleStorefrontCustomerStatus(id, newStatus)
            if (res.error) throw new Error(res.error)
            
            toast.success(`Account has been ${newStatus ? 'activated' : 'suspended'}`)
            
            // Optimistic update
            setCustomers(prev => prev.map(c => 
                c.id === id ? { ...c, is_active: newStatus } : c
            ))
        } catch (err: any) {
            toast.error(err.message || "Failed to update account status")
        } finally {
            setToggling(null)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader className="sm:flex-row items-start sm:items-center justify-between pb-6 gap-4">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Store className="h-5 w-5 text-primary" />
                        Online Store Users
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                        Manage user accounts registered via your B2C storefront
                    </CardDescription>
                </div>
                
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, phone..."
                            className="bg-card pl-9 border-muted/60 h-10 w-full rounded-xl transition-all hover:border-muted focus:ring-4 focus:ring-primary/10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                    <Button 
                        variant="outline" 
                        size="icon"
                        className="rounded-xl h-10 w-10 shrink-0" 
                        onClick={() => { setSearch(''); loadCustomers() }}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="rounded-xl border border-muted/50 overflow-hidden m-6 mt-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold px-4 h-12">Customer Details</TableHead>
                                <TableHead className="font-semibold px-4 h-12">Contact</TableHead>
                                <TableHead className="font-semibold px-4 h-12">Registration Date</TableHead>
                                <TableHead className="font-semibold px-4 h-12 text-right">Account Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary/60" />
                                        <p>Loading storefront users...</p>
                                    </TableCell>
                                </TableRow>
                            ) : customers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                        <div className="bg-muted/30 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                                            <Store className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <p>No storefront customers found.</p>
                                        {search && (
                                            <Button variant="link" onClick={() => { setSearch(""); loadCustomers() }}>
                                                Clear Search
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customers.map((customer) => (
                                    <TableRow key={customer.id} className={`transition-colors hover:bg-muted/10 ${!customer.is_active ? 'opacity-70 bg-destructive/5' : ''}`}>
                                        <TableCell className="px-4 py-3 align-top">
                                            <p className="font-medium text-foreground">{customer.full_name}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5" title={customer.id}>ID: {customer.id.substring(0,8)}...</p>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 align-top">
                                            <p className="text-sm font-medium">{customer.email}</p>
                                            {customer.phone && <p className="text-xs text-muted-foreground mt-0.5">{customer.phone}</p>}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 align-top">
                                            <p className="text-sm">{new Date(customer.created_at).toLocaleDateString()}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Active: {customer.last_login ? new Date(customer.last_login).toLocaleDateString() : 'Never'}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 align-top text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge variant={customer.is_active ? 'success' : 'destructive'} className="gap-1 flex w-fit">
                                                    {customer.is_active ? <CheckCircle className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3"/>}
                                                    {customer.is_active ? 'Active' : 'Suspended'}
                                                </Badge>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground">{customer.is_active ? 'Suspend' : 'Activate'}</span>
                                                    <Switch 
                                                        checked={customer.is_active}
                                                        disabled={toggling === customer.id}
                                                        onCheckedChange={() => handleToggleStatus(customer.id, customer.is_active)}
                                                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-destructive"
                                                    />
                                                </div>
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
    )
}
