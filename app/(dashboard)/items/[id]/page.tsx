import { notFound } from "next/navigation"
import { getItem, getCategories } from "@/app/actions/items"
import { getStockLedgerEntries } from "@/app/actions/stock"
import { ItemDetailClient } from "@/components/items/item-detail-client"

export const dynamic = 'force-dynamic'

interface ItemPageProps {
    params: Promise<{ id: string }>
}

export default async function ItemPage({ params }: ItemPageProps) {
    const { id } = await params

    const [item, categories, stockEntries] = await Promise.all([
        getItem(id),
        getCategories(),
        getStockLedgerEntries({ itemCode: id, limit: 20 })
    ])

    if (!item) {
        notFound()
    }

    const serializedItem = {
        ...item,
        image: item.image || null, // Convert undefined to null
        stockLedger: stockEntries.map(entry => ({
            id: entry.id,
            warehouse: { name: entry.warehouse },
            warehouseId: entry.warehouse,
            qtyChange: entry.qtyChange,
            actualQty: entry.balanceQty,
            valuationRate: 0, // Not exposed in simple ledger view
            postingDate: entry.date,
            voucherType: entry.voucherType,
            voucherNo: entry.voucherNo
        }))
    }

    return (
        <ItemDetailClient
            item={serializedItem}
            categories={categories}
        />
    )
}
