"use server"

import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"

// Helper to get or create Main Warehouse
export async function ensureMainWarehouse(organizationId: string, tx?: any) {
    const db = tx || prisma
    let warehouse = await db.warehouse.findFirst({
        where: {
            organizationId,
            name: "Stores - Main"
        }
    })

    if (!warehouse) {
        warehouse = await db.warehouse.create({
            data: {
                name: "Stores - Main",
                organizationId,
                isGroup: false
            }
        })
    }
    return warehouse
}

export type StockMovement = {
    itemId: string
    qty: number
    valuationRate: number
    voucherType: string // "Stock Entry", "POS Invoice", etc.
    voucherNo: string
    organizationId: string
    warehouseId?: string // Optional, defaults to Main
}

export async function createStockLedgerEntry(movement: StockMovement, tx?: any) {
    const db = tx || prisma
    const warehouse = movement.warehouseId
        ? { id: movement.warehouseId }
        : await ensureMainWarehouse(movement.organizationId, db)

    // Calculate new stock level (Naively for now - concurrency issues possible without locking)
    // Ideally use database triggers or SELECT FOR UPDATE
    const item = await db.item.findUnique({ where: { id: movement.itemId } })
    if (!item) throw new Error("Item not found")

    const newStock = Number(item.currentStock) + movement.qty

    // 1. Create Ledger Entry
    await db.stockLedgerEntry.create({
        data: {
            organizationId: movement.organizationId,
            itemId: movement.itemId,
            warehouseId: warehouse.id,
            qtyChange: movement.qty,
            actualQty: newStock,
            valuationRate: movement.valuationRate,
            voucherType: movement.voucherType,
            voucherNo: movement.voucherNo,
            postingDate: new Date(),
        }
    })

    // 2. Diff-update Item Stock (Denormalized)
    await db.item.update({
        where: { id: movement.itemId },
        data: { currentStock: { increment: movement.qty } }
    })
}
