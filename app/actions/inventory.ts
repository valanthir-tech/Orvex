"use server"

import { getTenantClient, getTenantContext } from "@/lib/tenant"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventoryItem {
    id: string
    name: string
    itemCode: string
    stock: number
    minStock: number
    cost: number
    price: number
    uom: string
    group: string
    warehouse: string
}

export interface StockLedgerEntry {
    id: string
    itemCode: string
    itemName: string
    warehouse: string
    date: string
    qtyChange: number
    balanceQty: number
    voucherType: string
    voucherNo: string
}

// ─── Get Inventory with Stock Balances ──────────────────────────────────────

export async function getInventory(): Promise<InventoryItem[]> {
    try {
        const ctx = await getTenantContext()
        const client = ctx.client

        // Get all items
        const items = await client.getList<{
            name: string
            item_name: string
            item_code: string
            standard_rate: number
            valuation_rate: number
            stock_uom: string
            item_group: string
            safety_stock: number
        }>("Item", {
            fields: ["name", "item_name", "item_code", "standard_rate", "valuation_rate", "stock_uom", "item_group", "safety_stock"],
            filters: [["disabled", "=", 0], ["is_stock_item", "=", 1]],
            limit: 0,
        })

        // Get stock balances (Bin doctype holds current stock per warehouse)
        const bins = await client.getList<{
            item_code: string
            warehouse: string
            actual_qty: number
            valuation_rate: number
        }>("Bin", {
            fields: ["item_code", "warehouse", "actual_qty", "valuation_rate"],
            limit: 0,
        })

        // Create a map of item_code -> total stock & warehouse
        const stockMap = new Map<string, { qty: number; warehouse: string; valRate: number }>()
        for (const bin of bins) {
            const existing = stockMap.get(bin.item_code)
            if (existing) {
                existing.qty += bin.actual_qty
            } else {
                stockMap.set(bin.item_code, {
                    qty: bin.actual_qty,
                    warehouse: bin.warehouse,
                    valRate: bin.valuation_rate,
                })
            }
        }

        return items.map((item) => {
            const stock = stockMap.get(item.item_code)
            return {
                id: item.name,
                name: item.item_name || item.name,
                itemCode: item.item_code,
                stock: stock?.qty || 0,
                minStock: item.safety_stock || 0,
                cost: stock?.valRate || item.valuation_rate || 0,
                price: item.standard_rate || 0,
                uom: item.stock_uom,
                group: item.item_group,
                warehouse: stock?.warehouse || ctx.warehouseName,
            }
        })
    } catch (error) {
        console.error("Failed to get inventory:", error)
        return []
    }
}

// ─── Get Stock Ledger (Movement History) ──────────────────────────────────

export async function getStockLedger(limit = 50): Promise<StockLedgerEntry[]> {
    try {
        const client = await getTenantClient()

        const entries = await client.getList<{
            name: string
            item_code: string
            warehouse: string
            posting_date: string
            posting_time: string
            actual_qty: number
            qty_after_transaction: number
            voucher_type: string
            voucher_no: string
        }>("Stock Ledger Entry", {
            fields: [
                "name", "item_code", "warehouse", "posting_date", "posting_time",
                "actual_qty", "qty_after_transaction", "voucher_type", "voucher_no",
            ],
            orderBy: "posting_date desc, posting_time desc",
            limit,
        })

        return entries.map((e) => ({
            id: e.name,
            itemCode: e.item_code,
            itemName: e.item_code, // CoreEngine SLE doesn't always have item_name
            warehouse: e.warehouse,
            date: `${e.posting_date} ${e.posting_time || ""}`.trim(),
            qtyChange: e.actual_qty,
            balanceQty: e.qty_after_transaction,
            voucherType: e.voucher_type,
            voucherNo: e.voucher_no,
        }))
    } catch (error) {
        console.error("Failed to get stock ledger:", error)
        return []
    }
}

// ─── Create Stock Entry (Adjustment) ────────────────────────────────────────

export async function createInventoryAdjustment(input: {
    itemCode: string
    type: "add" | "remove"
    qty: number
    warehouse: string
    reason?: string
}) {
    try {
        const client = await getTenantClient()

        const purpose = input.type === "add" ? "Material Receipt" : "Material Issue"
        const items = [{
            item_code: input.itemCode,
            qty: input.qty,
            ...(input.type === "add"
                ? { t_warehouse: input.warehouse }
                : { s_warehouse: input.warehouse }
            ),
        }]

        const result = await client.createDoc("Stock Entry", {
            stock_entry_type: purpose,
            items: items.map(i => ({
                ...i,
                doctype: "Stock Entry Detail",
            })),
        })

        if (!result) return { error: "Failed to create stock entry" }

        // Try to submit the stock entry
        await client.updateDoc("Stock Entry", (result as any).name, { docstatus: 1 })

        return { success: true, name: (result as any).name }
    } catch (error) {
        console.error("Failed to create adjustment:", error)
        return { error: "Failed to create stock adjustment" }
    }
}
