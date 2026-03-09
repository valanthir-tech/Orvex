"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    Package,
    X,
    Loader2,
    TrendingUp,
    AlertTriangle,
    XCircle,
    RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { badgeStyles, cardStyles } from "@/lib/theme"
import {
    getItems,
    createItem,
    updateItem,
    deleteItem,
    getCategories,
} from "@/app/actions/items"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
    id: string
    name: string
    itemCode: string
    description: string
    itemGroupId: string
    itemGroup: { id: string; name: string }
    stockUom: string
    standardRate: number
    valuationRate: number
    currentStock: number
    minStockLevel: number
    isStockItem: boolean
    hasBatchNo: boolean
    image?: string | null
    barcodes: string[]
    createdAt: Date
    updatedAt: Date
}

interface Category {
    id: string
    name: string
}

// ─── Validation Schema ──────────────────────────────────────────────────────

const productSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    itemCode: z.string().min(2, "Item code is required"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    cost: z.coerce.number().min(0, "Cost cannot be negative"),
    category: z.string().min(1, "Category is required"),
    description: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProductsPageClient() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const loadData = useCallback(async () => {
        try {
            const [items, cats] = await Promise.all([
                getItems(),
                getCategories(),
            ])
            setProducts(items as Product[])
            setCategories(cats)
        } catch {
            toast.error("Failed to load products")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const filteredProducts = useMemo(() => {
        if (!search) return products
        const term = search.toLowerCase()
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(term) ||
                p.itemCode.toLowerCase().includes(term) ||
                p.itemGroupId.toLowerCase().includes(term)
        )
    }, [products, search])

    const stats = useMemo(() => {
        const total = products.length
        const inStock = products.filter((p) => p.currentStock > p.minStockLevel).length
        const lowStock = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStockLevel).length
        const outOfStock = products.filter((p) => p.currentStock <= 0).length
        return { total, inStock, lowStock, outOfStock }
    }, [products])

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as never,
        defaultValues: {
            name: "",
            itemCode: "",
            price: 0,
            cost: 0,
            category: "",
            description: "",
        },
    })

    function openAddModal() {
        setEditingProduct(null)
        form.reset({
            name: "",
            itemCode: "",
            price: 0,
            cost: 0,
            category: "",
            description: "",
        })
        setIsModalOpen(true)
    }

    function openEditModal(product: Product) {
        setEditingProduct(product)
        form.reset({
            name: product.name,
            itemCode: product.itemCode,
            price: product.standardRate,
            cost: product.valuationRate,
            category: product.itemGroupId,
            description: product.description,
        })
        setIsModalOpen(true)
    }

    async function onSubmit(values: ProductFormValues) {
        setIsSubmitting(true)

        if (editingProduct) {
            const result = await updateItem({
                id: editingProduct.id,
                name: values.name,
                itemGroupId: values.category,
                standardRate: values.price,
                valuationRate: values.cost,
                description: values.description,
            })
            if (result.success) {
                toast.success("Product updated successfully")
                setIsModalOpen(false)
                loadData()
            } else {
                toast.error(result.error || "Failed to update product")
            }
        } else {
            const result = await createItem({
                name: values.name,
                itemCode: values.itemCode,
                itemGroupId: values.category,
                standardRate: values.price,
                valuationRate: values.cost,
                description: values.description,
                stockUom: "Nos",
                isStockItem: true,
                currentStock: 0,
                minStockLevel: 0,
                hasBatchNo: false,
            })
            if (result.success) {
                toast.success("Product created successfully")
                setIsModalOpen(false)
                loadData()
            } else {
                toast.error(result.error || "Failed to create product")
            }
        }

        setIsSubmitting(false)
    }

    async function handleDelete(product: Product) {
        const result = await deleteItem(product.id)
        if (result.success) {
            toast.success(`${product.name} deleted`)
            loadData()
        } else {
            toast.error("Failed to delete product")
        }
    }

    function getStockBadge(product: Product) {
        if (product.currentStock <= 0) {
            return (
                <Badge className={`${badgeStyles.danger} text-xs`}>
                    Out of Stock
                </Badge>
            )
        }
        if (product.currentStock <= product.minStockLevel) {
            return (
                <Badge className={`${badgeStyles.warning} text-xs`}>
                    Low Stock
                </Badge>
            )
        }
        return (
            <Badge className={`${badgeStyles.success} text-xs`}>
                In Stock
            </Badge>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading tracking-tight">
                        Products
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage your product catalog
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => { setIsLoading(true); loadData() }}
                        className="rounded-xl h-11 gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={openAddModal}
                        className="btn-pill gap-2 h-11 shadow-lg shadow-primary/20"
                    >
                        <Plus className="h-4 w-4" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className={cardStyles.sky.card}>
                    <div className={cardStyles.sky.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                        <div className={cardStyles.sky.icon}>
                            <Package className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{stats.total}</div>
                        <div className="text-xs mt-2 text-muted-foreground">in catalog</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.emerald.card}>
                    <div className={cardStyles.emerald.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">In Stock</CardTitle>
                        <div className={cardStyles.emerald.icon}>
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{stats.inStock}</div>
                        <div className="text-xs mt-2 text-muted-foreground">items available</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.amber.card}>
                    <div className={cardStyles.amber.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
                        <div className={cardStyles.amber.icon}>
                            <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{stats.lowStock}</div>
                        <div className="text-xs mt-2 text-muted-foreground">need restocking</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.rose.card}>
                    <div className={cardStyles.rose.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
                        <div className={cardStyles.rose.icon}>
                            <XCircle className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{stats.outOfStock}</div>
                        <div className="text-xs mt-2 text-muted-foreground">unavailable</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, SKU, or category..."
                    className="pl-10 h-11 rounded-xl"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
                        onClick={() => setSearch("")}
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Products Table */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                    <div>
                        <CardTitle className="text-lg font-heading">All Products</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {filteredProducts.length === products.length
                                ? `${products.length} products in catalog`
                                : `Showing ${filteredProducts.length} of ${products.length} products`}
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
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Item Code</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="h-8 w-8 text-muted-foreground/30" />
                                                <p>No products found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <TableRow
                                            key={product.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <TableCell>
                                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                    <span className="text-sm font-bold text-muted-foreground/30">
                                                        {product.name.charAt(0)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {product.name}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {product.itemCode}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                Rs. {product.standardRate.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {product.currentStock}
                                            </TableCell>
                                            <TableCell>
                                                {getStockBadge(product)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() =>
                                                            openEditModal(product)
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() =>
                                                            handleDelete(product)
                                                        }
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

                    {/* Mobile Card List */}
                    <div className="md:hidden divide-y divide-border/50">
                        {filteredProducts.length === 0 ? (
                            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                                <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                <p>No products found</p>
                            </div>
                        ) : (
                            filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center gap-3 p-4 hover:bg-muted/30"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg font-bold text-muted-foreground/30">
                                            {product.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {product.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {product.itemCode}
                                            </span>
                                            {getStockBadge(product)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-sm">
                                            Rs. {product.standardRate.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Stock: {product.currentStock}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEditModal(product)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(product)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Product Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                        <DialogTitle className="text-xl font-heading">
                            {editingProduct ? "Edit Product" : "Add New Product"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingProduct
                                ? "Update the product details below"
                                : "Fill in the product details to add it to your catalog"}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="px-6 py-6 space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Premium Hoodie"
                                                className="h-11"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="itemCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Item Code</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. HOD-001"
                                                    className="h-11"
                                                    disabled={!!editingProduct}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-11">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem
                                                            key={cat.id}
                                                            value={cat.id}
                                                        >
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Selling Price (Rs.)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    className="h-11"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cost Price (Rs.)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    className="h-11"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description (optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Product description"
                                                className="h-11"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-xl"
                                >
                                    {isSubmitting && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {editingProduct ? "Save Changes" : "Add Product"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
