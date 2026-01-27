
import Link from "next/link"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export const dynamic = 'force-dynamic'

import { requireProfile } from "@/lib/auth"

export default async function ItemsPage() {
    const profile = await requireProfile()
    const items = await prisma.item.findMany({
        where: {
            organizationId: profile.organizationId,
            deletedAt: null,
        },
        orderBy: {
            updatedAt: 'desc',
        },
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Items</h2>
                    <p className="text-muted-foreground">
                        Manage your product inventory and stock levels.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link href="/items/new">
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search items..."
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>UOM</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.itemCode}</TableCell>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.stockUom}</TableCell>
                                    <TableCell className="text-right">{item.currentStock}</TableCell>
                                    <TableCell className="text-right">
                                        {Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(Number(item.standardRate))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/items/${item.id}`}>Edit</Link>
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
