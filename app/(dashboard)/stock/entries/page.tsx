import Link from "next/link"
import prisma from "@/lib/prisma"
import { requireProfile } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, FolderInput, FolderOutput, ArrowRightLeft, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function StockEntriesPage() {
    const profile = await requireProfile()

    const entries = await prisma.stockEntry.findMany({
        where: {
            organizationId: profile.organizationId,
        },
        include: {
            createdBy: {
                select: { fullName: true }
            },
            _count: {
                select: { items: true }
            }
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 50
    })

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'MATERIAL_RECEIPT': return <FolderInput className="h-4 w-4 text-emerald-500" />
            case 'MATERIAL_ISSUE': return <FolderOutput className="h-4 w-4 text-rose-500" />
            case 'MATERIAL_TRANSFER': return <ArrowRightLeft className="h-4 w-4 text-blue-500" />
            default: return <RefreshCw className="h-4 w-4 text-amber-500" />
        }
    }

    const getTypeLabel = (type: string) => {
        return type.replace(/_/g, ' ')
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
                            <TableHead>Created By</TableHead>
                            <TableHead className="text-right">Items</TableHead>
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
                                            <span className="text-xs font-medium">{getTypeLabel(entry.type)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{entry.name || entry.id.slice(0, 8)}</TableCell>
                                    <TableCell>
                                        {new Date(entry.postingDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{entry.createdBy.fullName}</TableCell>
                                    <TableCell className="text-right">{entry._count.items}</TableCell>
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
