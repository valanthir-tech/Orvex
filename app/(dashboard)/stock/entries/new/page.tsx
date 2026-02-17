import { getItems } from "@/app/actions/items"
import StockEntryForm from "./stock-entry-form"

export const dynamic = 'force-dynamic'

export default async function NewEntryPage() {
    // Fetch items for the dropdown from ERPNext
    const items = await getItems({ status: "all" })

    const transformedItems = items.map(p => ({
        id: p.itemCode, // Use Item Code as ID for ERPNext
        name: p.name,
        itemCode: p.itemCode,
        currentStock: p.currentStock || 0
    }))

    return <StockEntryForm items={transformedItems} />
}
