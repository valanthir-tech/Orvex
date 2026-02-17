"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createItem } from "@/app/actions/items"
import { UOM_OPTIONS, CreateItemInput } from "@/types/item"

interface Category {
    id: string
    name: string
}

interface AddItemModalProps {
    categories: Category[]
    onSuccess?: () => void
}

export function AddItemModal({ categories, onSuccess }: AddItemModalProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        const data: CreateItemInput = {
            name: formData.get("name") as string,
            itemCode: formData.get("itemCode") as string,
            description: formData.get("description") as string || undefined,
            itemGroupId: formData.get("itemGroupId") as string || undefined,
            stockUom: formData.get("stockUom") as string || "Nos",
            standardRate: Number(formData.get("standardRate")) || 0,
            valuationRate: Number(formData.get("valuationRate")) || 0,
            currentStock: Number(formData.get("currentStock")) || 0,
            minStockLevel: Number(formData.get("minStockLevel")) || 0,
            barcode: formData.get("barcode") as string || undefined,
            isStockItem: true,
            hasBatchNo: false,
        }

        startTransition(async () => {
            const result = await createItem(data)
            if (result.success) {
                toast.success("Item created successfully!")
                setOpen(false)
                onSuccess?.()
            } else {
                toast.error(result.error || "Failed to create item")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl h-11 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    Add Item
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 rounded-2xl border-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                    <DialogTitle className="text-xl font-heading">Add New Item</DialogTitle>
                    <DialogDescription>
                        Add a new product to your inventory catalog
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <form id="add-item-form" onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="itemCode" className="text-muted-foreground">
                                    Item Code (SKU) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="itemCode"
                                    name="itemCode"
                                    placeholder="e.g. ITEM-001, SKU123"
                                    required
                                    autoFocus
                                    className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-muted-foreground">
                                    Item Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Wireless Mouse, Rice 25kg"
                                    required
                                    className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="barcode" className="text-muted-foreground">Barcode</Label>
                                <Input
                                    id="barcode"
                                    name="barcode"
                                    placeholder="Scan or enter barcode"
                                    className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20 font-mono"
                                />
                            </div>
                        </div>

                        {/* Category & UOM */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="itemGroupId" className="text-muted-foreground">Category</Label>
                                <Select name="itemGroupId">
                                    <SelectTrigger className="h-11 rounded-xl border-0 bg-muted/50">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="stockUom" className="text-muted-foreground">Unit of Measure</Label>
                                <Select name="stockUom" defaultValue="Nos">
                                    <SelectTrigger className="h-11 rounded-xl border-0 bg-muted/50">
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {UOM_OPTIONS.map((uom) => (
                                            <SelectItem key={uom.value} value={uom.value}>
                                                {uom.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="space-y-3">
                            <Label className="text-muted-foreground text-sm font-medium">Pricing</Label>
                            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30">
                                <div className="space-y-2">
                                    <Label htmlFor="valuationRate" className="text-xs text-muted-foreground">Cost Price (Rs)</Label>
                                    <Input
                                        id="valuationRate"
                                        name="valuationRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        defaultValue="0"
                                        placeholder="0.00"
                                        className="h-11 rounded-xl border-0 bg-background focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="standardRate" className="text-xs text-muted-foreground">
                                        Selling Price (Rs) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="standardRate"
                                        name="standardRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        defaultValue="0"
                                        placeholder="0.00"
                                        required
                                        className="h-11 rounded-xl border-0 bg-background focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stock Section */}
                        <div className="space-y-3">
                            <Label className="text-muted-foreground text-sm font-medium">Stock Settings</Label>
                            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30">
                                <div className="space-y-2">
                                    <Label htmlFor="currentStock" className="text-xs text-muted-foreground">Opening Stock</Label>
                                    <Input
                                        id="currentStock"
                                        name="currentStock"
                                        type="number"
                                        min="0"
                                        defaultValue="0"
                                        className="h-11 rounded-xl border-0 bg-background focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minStockLevel" className="text-xs text-muted-foreground">Reorder Level</Label>
                                    <Input
                                        id="minStockLevel"
                                        name="minStockLevel"
                                        type="number"
                                        min="0"
                                        defaultValue="0"
                                        placeholder="Alert when stock falls below"
                                        className="h-11 rounded-xl border-0 bg-background focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/30">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="add-item-form"
                        disabled={isPending}
                        className="rounded-xl gap-2"
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isPending ? "Creating..." : "Create Item"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
