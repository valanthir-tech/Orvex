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
        <div className="max-w-4xl mx-auto py-6">
            <form action={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>New Stock Entry</CardTitle>
                        <CardDescription>
                            Record material receipt, issue, or manual adjustment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="md:w-1/3">
                            <Label>Entry Type</Label>
                            <Select name="type" value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MATERIAL_RECEIPT">Material Receipt (In)</SelectItem>
                                    <SelectItem value="MATERIAL_ISSUE">Material Issue (Out)</SelectItem>
                                    <SelectItem value="STOCK_ADJUSTMENT">Stock Adjustment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="border rounded-md">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="p-3 font-medium">Item</th>
                                        <th className="p-3 font-medium w-32">Quantity</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr key={index} className="border-b last:border-0 group">
                                            <td className="p-3">
                                                <Select
                                                    value={row.itemId}
                                                    onValueChange={(val) => updateRow(index, 'itemId', val)}
                                                >
                                                    <SelectTrigger>
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
                                                />
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-red-500"
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
                                <Button type="button" variant="ghost" size="sm" onClick={addRow}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Row
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Entry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
