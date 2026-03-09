"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { getDefaultWarehouse } from "./stock"
import { getTenantClient } from "@/lib/tenant"

// Map our types to ERPNext Stock Entry types
const STOCK_ENTRY_TYPE_MAP: Record<string, string> = {
    'MATERIAL_RECEIPT': 'Material Receipt',
    'MATERIAL_ISSUE': 'Material Issue',
    'STOCK_ADJUSTMENT': 'Stock Reconciliation',
}

// Schema
const stockEntrySchema = z.object({
    type: z.enum(['MATERIAL_RECEIPT', 'MATERIAL_ISSUE', 'STOCK_ADJUSTMENT']),
    items: z.string()
})

export async function createStockEntry(formData: FormData) {
    const rawData = {
        type: formData.get("type"),
        items: formData.get("items")
    }

    const validation = stockEntrySchema.safeParse(rawData)
    if (!validation.success) return { error: "Invalid Data" }

    const { type, items: itemsJson } = validation.data
    const items = JSON.parse(itemsJson) as { itemId: string; qty: number; rate?: number }[]

    if (items.length === 0) return { error: "No items selected" }

    try {
        const client = await getTenantClient()

        // Get default warehouse
        const defaultWarehouse = await getDefaultWarehouse()
        if (!defaultWarehouse) {
            return { error: "No warehouse found. Please create a warehouse in ERPNext first." }
        }

        const stockEntryPurpose = STOCK_ENTRY_TYPE_MAP[type]

        const stockEntryItems = items.map(item => ({
            item_code: item.itemId,
            qty: item.qty,
            basic_rate: item.rate || 0,
            s_warehouse: type === 'MATERIAL_ISSUE' ? defaultWarehouse : undefined,
            t_warehouse: type === 'MATERIAL_RECEIPT' ? defaultWarehouse : undefined,
        }))

        const result = await client.createDoc<{ name: string }>('Stock Entry', {
            stock_entry_type: stockEntryPurpose,
            items: stockEntryItems,
        } as any)

        if (!result) {
            return { error: "Failed to create stock entry in ERPNext" }
        }

        // Submit the stock entry
        await client.post('/api/method/frappe.client.submit', {
            doc: { doctype: 'Stock Entry', name: result.name },
        })

        revalidatePath("/stock/entries")

    } catch (e: unknown) {
        const error = e as Error
        return { error: error.message || "Failed to create entry" }
    }

    redirect("/stock/entries")
}

// Get stock entries from ERPNext
export async function getStockEntries(filters: {
    type?: string
    fromDate?: string
    toDate?: string
    limit?: number
} = {}) {
    try {
        const client = await getTenantClient()

        const filterArray: [string, string, unknown][] = []
        if (filters.type) {
            filterArray.push(['stock_entry_type', '=', STOCK_ENTRY_TYPE_MAP[filters.type] || filters.type])
        }
        if (filters.fromDate) filterArray.push(['posting_date', '>=', filters.fromDate])
        if (filters.toDate) filterArray.push(['posting_date', '<=', filters.toDate])

        const result = await client.getList<{
            name: string
            stock_entry_type: string
            posting_date: string
            posting_time: string
            docstatus: 0 | 1 | 2
            total_amount: number
        }>('Stock Entry', {
            fields: ['name', 'stock_entry_type', 'posting_date', 'posting_time', 'docstatus', 'total_amount'],
            filters: filterArray,
            limit: filters.limit || 50,
            orderBy: 'posting_date desc, posting_time desc',
        })

        return result.map(entry => ({
            id: entry.name,
            name: entry.name,
            type: entry.stock_entry_type,
            date: new Date(`${entry.posting_date}T${entry.posting_time || '00:00:00'}`),
            status: entry.docstatus === 1 ? 'Submitted' : entry.docstatus === 2 ? 'Cancelled' : 'Draft',
            totalAmount: entry.total_amount,
        }))
    } catch (error) {
        console.error('Get stock entries error:', error)
        return []
    }
}

// Get single stock entry with items
export async function getStockEntry(id: string) {
    try {
        const client = await getTenantClient()

        const entry = await client.getDoc<{
            name: string
            stock_entry_type: string
            posting_date: string
            posting_time: string
            docstatus: 0 | 1 | 2
            total_amount: number
            items: Array<{
                item_code: string
                item_name: string
                qty: number
                basic_rate: number
                amount: number
                s_warehouse: string
                t_warehouse: string
            }>
        }>('Stock Entry', id)

        if (!entry) return null

        return {
            id: entry.name,
            name: entry.name,
            type: entry.stock_entry_type,
            date: new Date(`${entry.posting_date}T${entry.posting_time || '00:00:00'}`),
            status: entry.docstatus === 1 ? 'Submitted' : entry.docstatus === 2 ? 'Cancelled' : 'Draft',
            totalAmount: entry.total_amount,
            items: entry.items.map(item => ({
                itemCode: item.item_code,
                itemName: item.item_name,
                qty: item.qty,
                rate: item.basic_rate,
                amount: item.amount,
                sourceWarehouse: item.s_warehouse,
                targetWarehouse: item.t_warehouse,
            })),
        }
    } catch (error) {
        console.error('Get stock entry error:', error)
        return null
    }
}
