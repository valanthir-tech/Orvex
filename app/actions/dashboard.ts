"use server"

import { getTenantClient } from "@/lib/tenant"

export interface LowStockItem {
    name: string
    current: number
    reorder: number
    status: "critical" | "warning"
}

export async function getLowStockItems(limit: number = 5): Promise<LowStockItem[]> {
    try {
        const client = await getTenantClient()

        // We fetch items that have safety_stock defined
        const items = await client.getList<{
            item_code: string
            item_name: string
            safety_stock: number
        }>("Item", {
            fields: ["item_code", "item_name", "safety_stock"],
            filters: [
                ["disabled", "=", 0],
                ["is_stock_item", "=", 1],
                ["safety_stock", ">", 0]
            ],
            limit: 0,
        })

        if (items.length === 0) return []

        const itemCodeMap = new Map(items.map(i => [i.item_code, {
            name: i.item_name || i.item_code,
            safety_stock: i.safety_stock
        }]))

        // Get stock balances
        const bins = await client.getList<{
            item_code: string
            actual_qty: number
        }>("Bin", {
            fields: ["item_code", "actual_qty"],
            filters: [
                ["item_code", "in", Array.from(itemCodeMap.keys())]
            ],
            limit: 0,
        })

        const stockMap = new Map<string, number>()
        for (const bin of bins) {
            const current = stockMap.get(bin.item_code) || 0
            stockMap.set(bin.item_code, current + bin.actual_qty)
        }

        const lowStock: LowStockItem[] = []

        for (const item of items) {
            const current = stockMap.get(item.item_code) || 0
            const reorder = item.safety_stock

            if (current <= reorder) {
                lowStock.push({
                    name: item.item_name || item.item_code,
                    current,
                    reorder,
                    status: current <= (reorder / 2) ? "critical" : "warning"
                })
            }
        }

        return lowStock.sort((a, b) => a.current - b.current).slice(0, limit)
    } catch (error) {
        console.error("Failed to get low stock items:", error)
        return []
    }
}
