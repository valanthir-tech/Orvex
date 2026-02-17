"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { getDefaultWarehouse } from "./stock"

// ERPNext API Configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || 'http://localhost:8080'
const API_KEY = process.env.ERPNEXT_API_KEY
const API_SECRET = process.env.ERPNEXT_API_SECRET

// Map our types to ERPNext Stock Entry types
const STOCK_ENTRY_TYPE_MAP: Record<string, string> = {
    'MATERIAL_RECEIPT': 'Material Receipt',
    'MATERIAL_ISSUE': 'Material Issue',
    'STOCK_ADJUSTMENT': 'Stock Reconciliation',
}

// Schema
const stockEntrySchema = z.object({
    type: z.enum(['MATERIAL_RECEIPT', 'MATERIAL_ISSUE', 'STOCK_ADJUSTMENT']),
    items: z.string() // JSON string of items [{ itemId, qty }]
})

// Helper function to make ERPNext API calls
async function erpnextFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T | null> {
    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        // Add API key authentication if available
        if (API_KEY && API_SECRET) {
            headers['Authorization'] = `token ${API_KEY}:${API_SECRET}`
        }

        const response = await fetch(`${ERPNEXT_URL}${endpoint}`, {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('ERPNext API error:', response.statusText, errorText)
            return null
        }

        const data = await response.json()
        return data.data || data.message || data
    } catch (error) {
        console.error('ERPNext fetch error:', error)
        return null
    }
}

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
        // Get default warehouse
        const defaultWarehouse = await getDefaultWarehouse()
        if (!defaultWarehouse) {
            return { error: "No warehouse found. Please create a warehouse in ERPNext first." }
        }

        // Build Stock Entry document for ERPNext
        const stockEntryPurpose = STOCK_ENTRY_TYPE_MAP[type]

        const stockEntryItems = items.map(item => ({
            doctype: 'Stock Entry Detail',
            item_code: item.itemId,
            qty: item.qty,
            basic_rate: item.rate || 0,
            // For Material Receipt, set target warehouse
            // For Material Issue, set source warehouse
            s_warehouse: type === 'MATERIAL_ISSUE' ? defaultWarehouse : undefined,
            t_warehouse: type === 'MATERIAL_RECEIPT' ? defaultWarehouse : undefined,
        }))

        const stockEntryData = {
            doctype: 'Stock Entry',
            stock_entry_type: stockEntryPurpose,
            items: stockEntryItems,
        }

        const result = await erpnextFetch<{ name: string }>(
            '/api/resource/Stock Entry',
            {
                method: 'POST',
                body: JSON.stringify(stockEntryData),
            }
        )

        if (!result) {
            return { error: "Failed to create stock entry in ERPNext" }
        }

        // Submit the stock entry (save as draft, then submit)
        await erpnextFetch(
            `/api/method/frappe.client.submit`,
            {
                method: 'POST',
                body: JSON.stringify({
                    doc: {
                        doctype: 'Stock Entry',
                        name: result.name,
                    }
                }),
            }
        )

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
        const filterArray: [string, string, unknown][] = []

        if (filters.type) {
            filterArray.push(['stock_entry_type', '=', STOCK_ENTRY_TYPE_MAP[filters.type] || filters.type])
        }
        if (filters.fromDate) {
            filterArray.push(['posting_date', '>=', filters.fromDate])
        }
        if (filters.toDate) {
            filterArray.push(['posting_date', '<=', filters.toDate])
        }

        const params = new URLSearchParams({
            fields: JSON.stringify([
                'name', 'stock_entry_type', 'posting_date', 'posting_time',
                'docstatus', 'total_amount'
            ]),
            filters: JSON.stringify(filterArray),
            order_by: 'posting_date desc, posting_time desc',
            limit_page_length: (filters.limit || 50).toString(),
        })

        const result = await erpnextFetch<Array<{
            name: string
            stock_entry_type: string
            posting_date: string
            posting_time: string
            docstatus: 0 | 1 | 2
            total_amount: number
        }>>(`/api/resource/Stock Entry?${params.toString()}`)

        if (!result) return []

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
        const result = await erpnextFetch<{
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
        }>(`/api/resource/Stock Entry/${encodeURIComponent(id)}`)

        if (!result) return null

        const entry = result
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
