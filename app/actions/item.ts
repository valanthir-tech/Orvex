"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { requireProfile } from "@/lib/auth"

const itemSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    itemCode: z.string().min(2, "Item Code is required"), // e.g. SKU
    stockUom: z.string().default("Nos"),
    standardRate: z.coerce.number().min(0, "Price cannot be negative"),
    currentStock: z.coerce.number().int().default(0),
})

export async function createItem(formData: FormData) {
    const profile = await requireProfile()

    const rawData = {
        name: formData.get("name"),
        itemCode: formData.get("itemCode"),
        stockUom: formData.get("stockUom"),
        standardRate: formData.get("standardRate"),
        currentStock: formData.get("currentStock"),
    }

    const validatedFields = itemSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            error: "Validation failed. Please check your inputs.",
            issues: validatedFields.error.issues,
        }
    }

    // ... validation above
    const { name, itemCode, stockUom, standardRate, currentStock } = validatedFields.data

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Create Item (Initially 0 stock to let ledger handle update, 
            // OR set it if we trust our ledger logic to sync. 
            // Best practice: Set to 0, then let ledger increment it.
            const item = await tx.item.create({
                data: {
                    name,
                    itemCode,
                    stockUom,
                    standardRate,
                    currentStock: 0, // Will be updated by ledger
                    organizationId: profile.organizationId,
                    isStockItem: true,
                },
            })

            // 2. If Opening Stock > 0, create Ledger Entry
            if (currentStock > 0) {
                // Ensure Warehouse
                let warehouse = await tx.warehouse.findFirst({
                    where: { organizationId: profile.organizationId, name: "Stores - Main" }
                })
                if (!warehouse) {
                    warehouse = await tx.warehouse.create({
                        data: { name: "Stores - Main", organizationId: profile.organizationId }
                    })
                }

                // Create Ledger Entry
                await tx.stockLedgerEntry.create({
                    data: {
                        organizationId: profile.organizationId,
                        itemId: item.id,
                        warehouseId: warehouse.id,
                        qtyChange: currentStock,
                        actualQty: currentStock,
                        valuationRate: 0, // Opening stock usually has 0 or estimated cost. 
                        voucherType: "Stock Entry - Opening",
                        voucherNo: item.itemCode + "-OPEN", // Simple ref
                    }
                })

                // Update Item Stock
                await tx.item.update({
                    where: { id: item.id },
                    data: { currentStock: currentStock }
                })
            }
        })
    } catch (error) {
        console.error(error)
        // ... err handling
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') return { error: "Item Code already exists." }
        }
        return { error: "Failed to create item." }
    }

    revalidatePath("/items")
    redirect("/items")
}
