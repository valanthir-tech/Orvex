"use client"

import Link from "next/link"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, Loader2, Save } from "lucide-react"
import { createItem } from "@/app/actions/item"

export default function NewItemPage() {
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await createItem(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Item created successfully")
            }
        })
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/items">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-semibold tracking-tight">Create Item</h1>
                    <p className="text-sm text-muted-foreground">
                        Add a new product to your inventory
                    </p>
                </div>
            </div>

            <form action={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Item Details</CardTitle>
                        <CardDescription>
                            Basic information about the product
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="itemCode">Item Code (SKU)</Label>
                            <Input
                                id="itemCode"
                                name="itemCode"
                                placeholder="e.g. ITEM-001"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. Wireless Mouse"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="stockUom">Unit of Measure</Label>
                                <Select name="stockUom" defaultValue="Nos">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Nos">Nos</SelectItem>
                                        <SelectItem value="Kg">Kg</SelectItem>
                                        <SelectItem value="Ltr">Ltr</SelectItem>
                                        <SelectItem value="Box">Box</SelectItem>
                                        <SelectItem value="Set">Set</SelectItem>
                                        <SelectItem value="Meter">Meter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="currentStock">Opening Stock</Label>
                                <Input
                                    id="currentStock"
                                    name="currentStock"
                                    type="number"
                                    defaultValue="0"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="standardRate">Selling Price (Rs)</Label>
                            <Input
                                id="standardRate"
                                name="standardRate"
                                type="number"
                                step="0.01"
                                defaultValue="0.00"
                                min="0"
                            />
                        </div>
                    </CardContent>
                    <div className="flex items-center justify-end gap-2 p-6 border-t bg-muted/40">
                        <Button variant="ghost" asChild>
                            <Link href="/items">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Save Item
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    )
}
