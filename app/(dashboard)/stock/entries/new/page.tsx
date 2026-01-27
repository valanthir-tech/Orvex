import prisma from "@/lib/prisma"
import { requireProfile } from "@/lib/auth"
import StockEntryForm from "./stock-entry-form"

export default async function NewEntryPage() {
    const profile = await requireProfile()

    // Fetch items for the dropdown
    const items = await prisma.item.findMany({
        where: {
            organizationId: profile.organizationId,
            deletedAt: null
        },
        select: {
            id: true,
            name: true,
            itemCode: true,
            currentStock: true
        }
    })

    return <StockEntryForm items={items} />
}
