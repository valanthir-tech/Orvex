import { getItems } from "@/app/actions/items"
import POSInterface from "./pos-interface"

export const dynamic = 'force-dynamic'

export default async function POSPage() {
    // Get stock items from ERPNext
    const products = await getItems({
        status: "all"
    })

    const transformedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        itemCode: p.itemCode,
        standardRate: p.standardRate,
        currentStock: p.currentStock,
        image: p.image || null
    }))

    return <POSInterface products={transformedProducts} />
}
