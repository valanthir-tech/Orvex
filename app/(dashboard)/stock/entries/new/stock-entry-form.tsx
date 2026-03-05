"use client"

import { useTransition, useState } from "react"
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
import { createStockEntry } from "@/app/actions/stock-entry"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function NewStockEntryPage({ items }: { items: any[] }) {
    const [isPending, startTransition] = useTransition()
    const [type, setType] = useState('MATERIAL_RECEIPT')
    const [rows, setRows] = useState<{ itemId: string; qty: number }[]>([
        { itemId: "", qty: 1 }
    ])

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
            }
        })
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold font-heading tracking-tight">New Stock Entry</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Record material receipt, issue, or manual adjustment
                </p>
            </div>

            <form action={handleSubmit}>
                <Card className="card-float border-0 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                        <div>
                            <CardTitle className="text-lg font-heading">Entry Details</CardTitle>
                            <CardDescription>
                                Add items and quantities for this stock entry
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="md:w-1/3">
                            <Label>Entry Type</Label>
                            <Select name="type" value={type} onValueChange={setType}>
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MATERIAL_RECEIPT">Material Receipt (In)</SelectItem>
                                    <SelectItem value="MATERIAL_ISSUE">Material Issue (Out)</SelectItem>
                                    <SelectItem value="STOCK_ADJUSTMENT">Stock Adjustment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Card className="border border-border/50 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/30 border-b">
                                    <tr>
                                        <th className="p-3 font-medium text-muted-foreground">Item</th>
                                        <th className="p-3 font-medium text-muted-foreground w-32">Quantity</th>
                                        <th className="p-3 w-10"></th>
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
                                            <td className="p-3">
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
                                <Button type="button" variant="ghost" size="sm" onClick={addRow} className="gap-2 rounded-lg">
                                    <Plus className="h-4 w-4" /> Add Row
                                </Button>
                            </div>
                        </Card>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => window.history.back()} className="rounded-xl h-11">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending} className="rounded-xl h-11 gap-2">
                                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Submit Entry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
