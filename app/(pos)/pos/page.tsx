import prisma from "@/lib/prisma"
import { requireProfile } from "@/lib/auth"
import POSInterface from "./pos-interface"

export const dynamic = 'force-dynamic'

export default async function POSPage() {
    const profile = await requireProfile()

    const products = await prisma.item.findMany({
        where: {
            organizationId: profile.organizationId,
            deletedAt: null,
            isStockItem: true
        },
        select: {
            id: true,
            name: true,
            itemCode: true,
            standardRate: true,
            currentStock: true,
            image: true
        },
        orderBy: {
            name: 'asc'
        }
    })

    const transformedProducts = products.map(p => ({
        ...p,
        standardRate: Number(p.standardRate) // Decimal to Number
    }))

    return <POSInterface products={transformedProducts} />
}
