"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireProfile } from "@/lib/auth"
import { ensureMainWarehouse } from "./stock"
import { revalidatePath } from "next/cache"

// Schema
const stockEntrySchema = z.object({
    type: z.enum(['MATERIAL_RECEIPT', 'MATERIAL_ISSUE', 'STOCK_ADJUSTMENT']),
    items: z.string() // JSON string of items [{ itemId, qty }]
})

export async function createStockEntry(formData: FormData) {
    const profile = await requireProfile()

    const rawData = {
        type: formData.get("type"),
        items: formData.get("items")
    }

    const validation = stockEntrySchema.safeParse(rawData)
    if (!validation.success) return { error: "Invalid Data" }

    const { type, items: itemsJson } = validation.data
    const items = JSON.parse(itemsJson) as { itemId: string; qty: number }[]

    if (items.length === 0) return { error: "No items selected" }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Create Header
            const entry = await tx.stockEntry.create({
                data: {
                    type: type as any,
                    organizationId: profile.organizationId,
                    createdById: profile.id,
                    postingDate: new Date(),
                    name: `STE-${Date.now()}` // Simple ID gen
                }
            })

            const warehouse = await ensureMainWarehouse(profile.organizationId, tx)

            // 2. Process Items
            for (const item of items) {
                // Determine Qty Sign based on Type
                // Receipt: +ve, Issue: -ve
                const sign = type === 'MATERIAL_ISSUE' ? -1 : 1
                const finalQty = Number(item.qty) * sign

                // Validation: For Issue, check stock
                if (type === 'MATERIAL_ISSUE') {
                    const current = await tx.item.findUnique({ where: { id: item.itemId } })
                    if (!current || current.currentStock < item.qty) {
                        throw new Error(`Insufficient stock for item ${item.itemId}`)
                    }
                }

                // Add to Entry Children
                await tx.stockEntryItem.create({
                    data: {
                        stockEntryId: entry.id,
                        itemId: item.itemId,
                        qty: item.qty,
                        transferQty: item.qty,
                        basicRate: 0,
                        amount: 0
                    }
                })

                // Create Ledger Entry
                await tx.stockLedgerEntry.create({
                    data: {
                        organizationId: profile.organizationId,
                        itemId: item.itemId,
                        warehouseId: warehouse.id,
                        qtyChange: finalQty,
                        actualQty: 0, // Need to fetch fresh? Naive approach: we rely on item.currentStock + val
                        valuationRate: 0,
                        voucherType: "Stock Entry",
                        voucherNo: entry.name!,
                    }
                })

                // Update Item
                await tx.item.update({
                    where: { id: item.itemId },
                    data: { currentStock: { increment: finalQty } }
                })
            }
        })
    } catch (e: any) {
        return { error: e.message || "Failed to create entry" }
    }

    revalidatePath("/stock/entries")
    redirect("/stock/entries")
}
