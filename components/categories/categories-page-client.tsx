"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    Tag,
    X,
    Loader2,
    FolderOpen,
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
import { Label } from "@/components/ui/label"
import { cardStyles } from "@/lib/theme"
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "@/app/actions/products"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
    id: string
    name: string
    parentId?: string
    isGroup?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CategoriesPageClient() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [categoryName, setCategoryName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const loadData = useCallback(async () => {
        setIsLoading(true)
        try {
            const cats = await getCategories()
            setCategories(cats)
        } catch {
            toast.error("Failed to load categories")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const filteredCategories = useMemo(() => {
        if (!search) return categories
        const term = search.toLowerCase()
        return categories.filter((c) => c.name.toLowerCase().includes(term))
    }, [categories, search])

    // Stat: exclude system root groups
    const leafCategories = useMemo(
        () => categories.filter((c) => !c.isGroup),
        [categories]
    )

    function openAdd() {
        setEditingCategory(null)
        setCategoryName("")
        setIsModalOpen(true)
    }

    function openEdit(cat: Category) {
        setEditingCategory(cat)
        setCategoryName(cat.name)
        setIsModalOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const name = categoryName.trim()
        if (!name) return

        setIsSubmitting(true)
        try {
            if (editingCategory) {
                const res = await updateCategory(editingCategory.id, name)
                if (!res.success) {
                    toast.error(res.error || "Failed to update category")
                    return
                }
                toast.success("Category updated")
                setCategories((prev) =>
                    prev.map((c) =>
                        c.id === editingCategory.id ? { ...c, name } : c
                    )
                )
            } else {
                const res = await createCategory(name)
                if (!res.success) {
                    toast.error(res.error || "Failed to create category")
                    return
                }
                toast.success("Category created")
                await loadData()
            }
            setIsModalOpen(false)
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            const res = await deleteCategory(deleteTarget.id)
            if (!res.success) {
                toast.error(res.error || "Failed to delete category")
                return
            }
            toast.success("Category deleted")
            setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
            setDeleteTarget(null)
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setIsDeleting(false)
        }
    }

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading tracking-tight">Categories</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage product categories for your inventory
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-11 w-11"
                        onClick={loadData}
                        disabled={isLoading}
                        title="Refresh"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                        className="btn-pill gap-2 h-11 shadow-lg shadow-primary/20"
                        onClick={openAdd}
                    >
                        <Plus className="h-4 w-4" />
                        New Category
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                <Card className={cardStyles.teal.card}>
                    <div className={cardStyles.teal.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Categories
                        </CardTitle>
                        <div className={cardStyles.teal.icon}>
                            <Tag className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{categories.length}</div>
                        <div className="text-xs mt-2 text-muted-foreground">across all categories</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.sky.card}>
                    <div className={cardStyles.sky.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Leaf Categories
                        </CardTitle>
                        <div className={cardStyles.sky.icon}>
                            <FolderOpen className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">{leafCategories.length}</div>
                        <div className="text-xs mt-2 text-muted-foreground">Assignable to items</div>
                    </CardContent>
                </Card>

                <Card className={cardStyles.violet.card}>
                    <div className={cardStyles.violet.overlay} />
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Group Categories
                        </CardTitle>
                        <div className={cardStyles.violet.icon}>
                            <FolderOpen className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold font-heading">
                            {categories.length - leafCategories.length}
                        </div>
                        <div className="text-xs mt-2 text-muted-foreground">Parent groups</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        className="pl-10 h-11 rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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

            {/* Table */}
            <Card className="card-float border-0 rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="pl-6">Name</TableHead>
                            <TableHead>Parent</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5)
                                .fill(0)
                                .map((_, i) => (
                                    <TableRow key={i}>
                                        {Array(4)
                                            .fill(0)
                                            .map((_, j) => (
                                                <TableCell key={j}>
                                                    <div className="h-5 bg-muted rounded animate-pulse" />
                                                </TableCell>
                                            ))}
                                    </TableRow>
                                ))
                        ) : filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center py-20 text-muted-foreground"
                                >
                                    <FolderOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                                    <p className="font-medium">No categories found</p>
                                    <p className="text-sm">
                                        {search ? "Try a different search term." : "Add your first category to get started."}
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((cat) => (
                                <TableRow key={cat.id} className="group hover:bg-muted/20">
                                    <TableCell className="pl-6 font-medium">{cat.name}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {cat.parentId || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                cat.isGroup
                                                    ? "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                                                    : "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300"
                                            }
                                        >
                                            {cat.isGroup ? "Group" : "Category"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-xl hover:bg-muted"
                                                onClick={() => openEdit(cat)}
                                                title="Edit"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => setDeleteTarget(cat)}
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

            {/* Add / Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? "Edit Category" : "New Category"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCategory
                                ? "Update the category name. Changes will be reflected across the system."
                                : "Create a new item category to organise your products."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">Category Name</Label>
                            <Input
                                id="cat-name"
                                placeholder="e.g. Beverages, Electronics..."
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                className="h-11 rounded-xl"
                                required
                                minLength={2}
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !categoryName.trim()}
                                className="rounded-xl gap-2"
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {editingCategory ? "Save Changes" : "Create Category"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">
                                {deleteTarget?.name}
                            </span>
                            ? This will permanently delete the category. Items assigned to this
                            category must be reassigned first.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-xl gap-2"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
