"use client"

import { useState, useTransition } from "react"
import { Customer, createCustomer, updateCustomer, deleteCustomer } from "@/app/actions/customers"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Edit2, Plus, Search, Trash2, UserPlus, Wallet, TrendingUp } from "lucide-react"
import { badgeStyles, cardStyles } from "@/lib/theme"

export function CustomersPageClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", credit_limit: 0 })

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const totalBalance = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0)
  const totalLTV = customers.reduce((sum, c) => sum + (c.total_sales || 0), 0)

  const openForm = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({ 
        name: customer.name, 
        phone: customer.phone || "", 
        email: customer.email || "", 
        credit_limit: customer.credit_limit || 0 
      })
    } else {
      setEditingCustomer(null)
      setFormData({ name: "", phone: "", email: "", credit_limit: 0 })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        if (editingCustomer) {
          const updated = await updateCustomer(editingCustomer.id, {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            credit_limit: formData.credit_limit
          })
          if (updated && updated.success && updated.data) {
            setCustomers(prev => prev.map(c => c.id === updated.data!.id ? { ...c, ...updated.data } : c))
          }
        } else {
          const created = await createCustomer({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            credit_limit: formData.credit_limit
          })
          if (created && created.success && created.data) {
            setCustomers(prev => [created.data!, ...prev])
          }
        }
        setIsDialogOpen(false)
      } catch (err) {
        console.error("Failed to save customer", err)
        alert("Failed to save customer. Please check the network.")
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return
    startTransition(async () => {
      try {
        await deleteCustomer(id)
        setCustomers(prev => prev.filter(c => c.id !== id))
      } catch (err) {
        console.error("Failed to delete customer", err)
        alert("Failed to delete customer.")
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading tracking-tight">Customers</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your customer profiles, loyalty balances, and credit limits.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => openForm()}
            className="btn-pill gap-2 h-11 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className={cardStyles.teal.card}>
          <div className={cardStyles.teal.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <div className={cardStyles.teal.icon}>
              <UserPlus className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold font-heading">{customers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active registered profiles</p>
          </CardContent>
        </Card>

        <Card className={cardStyles.rose.card}>
          <div className={cardStyles.rose.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balances</CardTitle>
            <div className={cardStyles.rose.icon}>
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-rose-600 font-heading">₹{totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Khata/Credit owed</p>
          </CardContent>
        </Card>

        <Card className={`${cardStyles.emerald.card} hidden sm:block`}>
          <div className={cardStyles.emerald.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total LTV (Sales)</CardTitle>
            <div className={cardStyles.emerald.icon}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-emerald-600 font-heading">₹{totalLTV.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime generated revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name or phone..."
          className="pl-10 h-11 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Main Table Area */}
      <Card className="card-float border-0 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle className="text-lg font-heading">All Customers</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredCustomers.length === customers.length
                ? `${customers.length} registered profiles`
                : `Showing ${filteredCustomers.length} of ${customers.length} profiles`}
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
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right hidden sm:table-cell">LTV Sales</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    {search ? "No customers found matching your search." : "No customers added yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{customer.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                        ID: {customer.id.split("-")[0]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{customer.phone || "-"}</div>
                      {customer.email && <div className="text-xs text-muted-foreground">{customer.email}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.current_balance > 0 ? (
                        <Badge variant="outline" className="text-rose-600 bg-rose-50 border-rose-200">
                          ₹{customer.current_balance.toLocaleString()}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">₹0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <div className="font-medium">₹{(customer.total_sales || 0).toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openForm(customer)}
                          disabled={isPending}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(customer.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      {/* Customer Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
              <DialogDescription>
                {editingCustomer ? "Update customer profile details below." : "Enter the details to register a new customer."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name *</label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  required 
                  placeholder="Ram Kumar"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">Phone Number *</label>
                <Input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  required 
                  placeholder="98XXXXXXX"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">Email (Optional)</label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  placeholder="ram@example.com"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="limit" className="text-sm font-medium">Credit Limit (₹)</label>
                <Input 
                  id="limit" 
                  type="number"
                  min="0"
                  value={formData.credit_limit} 
                  onChange={e => setFormData({ ...formData, credit_limit: Number(e.target.value) })} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
