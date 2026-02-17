import { getItems, getCategories } from "@/app/actions/items"
import { ItemsListClient } from "@/components/items/items-list-client"

export const dynamic = 'force-dynamic'

export default async function ItemsPage() {
    // Fetch items with relations from ERPNext
    const items = await getItems()
    const categories = await getCategories()

    const mappedItems = items.map(item => ({
        ...item,
        image: item.image || null,
    }))

    return (
        <ItemsListClient
            items={mappedItems}
            categories={categories}
        />
    )
}
