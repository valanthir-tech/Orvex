"use client"

import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { createStockEntry } from "@/app/actions/stock-entry"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function NewStockEntryDialog({ items }: { items: any[] }) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [type, setType] = useState('MATERIAL_RECEIPT')
    const [rows, setRows] = useState<{ itemId: string; qty: number }[]>([
        { itemId: "", qty: 1 }
    ])

    const resetForm = () => {
        setType('MATERIAL_RECEIPT')
        setRows([{ itemId: "", qty: 1 }])
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            // Reset form when closing
            setTimeout(resetForm, 200)
        }
    }

    const addRow = () => {
        setRows([...rows, { itemId: "", qty: 1 }])
    }

    const removeRow = (index: number) => {
        if (rows.length === 1) return
        setRows(rows.filter((_, i) => i !== index))
    }

    const updateRow = (index: number, field: string, value: any) => {
        const newRows = [...rows]
        newRows[index] = { ...newRows[index], [field]: value }
        setRows(newRows)
    }

    const handleSubmit = async (formData: FormData) => {
        // Validate rows
        const validRows = rows.filter(r => r.itemId && r.qty > 0)
        if (validRows.length === 0) {
            toast.error("Please add at least one valid item")
            return
        }

        formData.append("items", JSON.stringify(validRows))

        startTransition(async () => {
            const res = await createStockEntry(formData)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success("Stock entry created successfully")
                handleOpenChange(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="btn-pill gap-2 h-11 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    New Entry
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0 flex flex-col overflow-hidden border-0 shadow-2xl rounded-2xl">
                <div className="bg-muted/30 p-6 border-b border-border/50 shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold font-heading">New Stock Entry</DialogTitle>
                        <DialogDescription>
                            Record material receipt, issue, or manual adjustment
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form id="stock-entry-form" action={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="md:w-1/2">
                        <Label>Entry Type</Label>
                        <Select name="type" value={type} onValueChange={setType}>
                            <SelectTrigger className="h-11 rounded-xl mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MATERIAL_RECEIPT">Material Receipt (In)</SelectItem>
                                <SelectItem value="MATERIAL_ISSUE">Material Issue (Out)</SelectItem>
                                <SelectItem value="STOCK_ADJUSTMENT">Stock Adjustment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border border-border/50 rounded-xl overflow-hidden bg-background">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 border-b">
                                <tr>
                                    <th className="p-3 font-medium text-muted-foreground w-full">Item</th>
                                    <th className="p-3 font-medium text-muted-foreground w-32">Quantity</th>
                                    <th className="p-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index} className="border-b last:border-0 group hover:bg-muted/30 transition-colors">
                                        <td className="p-3">
                                            <Select
                                                value={row.itemId}
                                                onValueChange={(val) => updateRow(index, 'itemId', val)}
                                            >
                                                <SelectTrigger className="h-11 rounded-xl">
                                                    <SelectValue placeholder="Select Item" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {items.map(item => (
                                                        <SelectItem key={item.id} value={item.id}>
                                                            {item.name} ({item.itemCode})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-3">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={row.qty}
                                                onChange={(e) => updateRow(index, 'qty', parseInt(e.target.value) || 0)}
                                                className="h-11 rounded-xl"
                                            />
                                        </td>
                                        <td className="p-3 text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => removeRow(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-2 border-t bg-muted/10">
                            <Button type="button" variant="ghost" size="sm" onClick={addRow} className="gap-2 rounded-xl">
                                <Plus className="h-4 w-4" /> Add Row
                            </Button>
                        </div>
                    </div>
                </form>

                <div className="flex justify-end gap-3 p-6 border-t border-border/50 shrink-0 bg-background/50 backdrop-blur">
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="rounded-xl h-11 px-6">
                        Cancel
                    </Button>
                    <Button type="button" onClick={() => {
                        const form = document.getElementById('stock-entry-form') as HTMLFormElement;
                        if(form) form.requestSubmit();
                    }} disabled={isPending} className="rounded-xl h-11 px-6 gap-2">
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Submit Entry
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
