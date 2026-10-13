"use server"

import { cookies } from "next/headers"
import { getTenantContext } from "@/lib/tenant"
import { createSupabaseServerClient } from "@/lib/tenant"

export interface LowStockItem {
    name: string
    current: number
    reorder: number
    status: "critical" | "warning"
}

export async function getLowStockItems(limit: number = 5): Promise<LowStockItem[]> {
    try {
        const cookieStore = await cookies();
        if (cookieStore.get('onedexo_demo_session')?.value === 'true') {
            return [
                { name: "Wireless Barcode Scanner Pro", current: 4, reorder: 10, status: "critical" as const },
                { name: "Cold Brew Glass Bottle 330ml", current: 8, reorder: 15, status: "warning" as const },
                { name: "Thermal Receipt Paper (50 rolls)", current: 6, reorder: 12, status: "warning" as const },
            ].slice(0, limit);
        }

        const { client, tenantId, warehouseName } = await getTenantContext()
        const supabase = await createSupabaseServerClient();

        // 1. Fetch allowed items for this tenant
        const { data: tenantItems, error: tbError } = await supabase
            .from('tenant_items')
            .select('item_code')
            .eq('tenant_id', tenantId);

        if (tbError || !tenantItems || tenantItems.length === 0) {
            return [];
        }

        const itemCodes = tenantItems.map((ti: any) => ti.item_code);

        const items = await client.getList<{
            item_code: string
            item_name: string
            safety_stock: number
        }>("Item", {
            fields: ["item_code", "item_name", "safety_stock"],
            filters: [
                ["disabled", "=", 0],
                ["is_stock_item", "=", 1],
                ["safety_stock", ">", 0],
                ["name", "in", itemCodes]
            ],
            limit: 0,
        })

        if (items.length === 0) return []

        const itemCodeMap = new Map(items.map(i => [i.item_code, {
            name: i.item_name || i.item_code,
            safety_stock: i.safety_stock
        }]))

        // Get stock balances matching exactly the warehouse
        const bins = await client.getList<{
            item_code: string
            actual_qty: number
        }>("Bin", {
            fields: ["item_code", "actual_qty"],
            filters: [
                ["item_code", "in", Array.from(itemCodeMap.keys())],
                ["warehouse", "=", warehouseName]
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
        console.error("Failed to get low stock items:", error instanceof Error ? error.message : String(error))
        return []
    }
}
