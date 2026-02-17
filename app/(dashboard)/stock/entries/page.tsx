import { getStockEntries } from "@/app/actions/stock-entry"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, FolderInput, FolderOutput, ArrowRightLeft, RefreshCw, FileText } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function StockEntriesPage() {
    const entries = await getStockEntries()

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Material Receipt': return <FolderInput className="h-4 w-4 text-emerald-500" />
            case 'Material Issue': return <FolderOutput className="h-4 w-4 text-rose-500" />
            case 'Material Transfer': return <ArrowRightLeft className="h-4 w-4 text-blue-500" />
            case 'Stock Reconciliation': return <RefreshCw className="h-4 w-4 text-amber-500" />
            default: return <FileText className="h-4 w-4 text-gray-500" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Stock Entries</h2>
                    <p className="text-muted-foreground">
                        Track all material movements, receipts, and issues.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/stock/entries/new">
                        <Plus className="mr-2 h-4 w-4" /> New Entry
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No stock entries found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            entries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(entry.type)}
                                            <span className="text-xs font-medium">{entry.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{entry.name}</TableCell>
                                    <TableCell>
                                        {entry.date.toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{entry.status}</TableCell>
                                    <TableCell className="text-right">{entry.totalAmount}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/stock/entries/${entry.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
