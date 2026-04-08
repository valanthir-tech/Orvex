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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active registered profiles</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balances</CardTitle>
            <Wallet className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">₹{totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Khata/Credit owed</p>
          </CardContent>
        </Card>
        <Card className="bg-card hidden lg:block">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total LTV (Sales)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">₹{totalLTV.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime generated revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Area */}
      <Card>
        <CardHeader className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b bg-muted/20">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or phone..."
              className="w-full pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => openForm()} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </CardHeader>

        <div className="overflow-x-auto rounded-b-lg">
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
