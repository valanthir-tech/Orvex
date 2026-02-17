"use server"

// ERPNext API Configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || 'http://localhost:8080'
const API_KEY = process.env.ERPNEXT_API_KEY
const API_SECRET = process.env.ERPNEXT_API_SECRET

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
            console.error('ERPNext API error:', response.statusText)
            return null
        }

        const data = await response.json()
        return data.data || data.message || data
    } catch (error) {
        console.error('ERPNext fetch error:', error)
        return null
    }
}

// Get warehouses from ERPNext
export async function getWarehouses() {
    try {
        const params = new URLSearchParams({
            fields: JSON.stringify(['name', 'warehouse_name', 'parent_warehouse', 'is_group']),
            filters: JSON.stringify([['is_group', '=', 0]]),
            limit_page_length: '0',
        })

        const result = await erpnextFetch<Array<{
            name: string
            warehouse_name: string
            parent_warehouse?: string
            is_group: 0 | 1
        }>>(`/api/resource/Warehouse?${params.toString()}`)

        if (!result) return []

        return result.map(wh => ({
            id: wh.name,
            name: wh.warehouse_name || wh.name,
            parentId: wh.parent_warehouse,
            isGroup: wh.is_group === 1,
        }))
    } catch (error) {
        console.error('Get warehouses error:', error)
        return []
    }
}

// Get default warehouse
export async function getDefaultWarehouse(): Promise<string | null> {
    const warehouses = await getWarehouses()
    // Find a warehouse that contains "Stores" or just return the first one
    const defaultWh = warehouses.find(wh =>
        wh.name.toLowerCase().includes('store') ||
        wh.name.toLowerCase().includes('main')
    )
    return defaultWh?.id || warehouses[0]?.id || null
}

export type StockMovement = {
    itemId: string
    qty: number
    valuationRate: number
    voucherType: string // "Stock Entry", "POS Invoice", etc.
    voucherNo: string
    warehouseId?: string
}

// Create a Stock Entry in ERPNext
export async function createStockEntry(
    purpose: 'Material Receipt' | 'Material Issue' | 'Material Transfer',
    items: Array<{
        item_code: string
        qty: number
        rate?: number
        s_warehouse?: string  // Source warehouse (for Issue/Transfer)
        t_warehouse?: string  // Target warehouse (for Receipt/Transfer)
    }>
) {
    try {
        const stockEntryData = {
            doctype: 'Stock Entry',
            stock_entry_type: purpose,
            items: items.map(item => ({
                doctype: 'Stock Entry Detail',
                item_code: item.item_code,
                qty: item.qty,
                basic_rate: item.rate || 0,
                s_warehouse: item.s_warehouse,
                t_warehouse: item.t_warehouse,
            })),
        }

        const result = await erpnextFetch<{ data: { name: string } }>(
            '/api/resource/Stock Entry',
            {
                method: 'POST',
                body: JSON.stringify(stockEntryData),
            }
        )

        if (!result) {
            return { success: false, error: "Failed to create stock entry" }
        }

        return { success: true, name: result.data.name }
    } catch (error) {
        console.error('Create stock entry error:', error)
        return { success: false, error: "Failed to create stock entry" }
    }
}

// Get stock balance for an item at a warehouse
export async function getStockBalance(
    itemCode: string,
    warehouse?: string
): Promise<number> {
    try {
        // Use ERPNext's built-in method to get stock balance
        const params = new URLSearchParams({
            item_code: itemCode,
        })

        if (warehouse) {
            params.append('warehouse', warehouse)
        }

        const result = await erpnextFetch<number>(
            `/api/method/erpnext.stock.utils.get_stock_balance?${params.toString()}`
        )

        return result || 0
    } catch (error) {
        console.error('Get stock balance error:', error)
        return 0
    }
}

// Get stock ledger entries (stock movement history)
export async function getStockLedgerEntries(
    filters: {
        itemCode?: string
        warehouse?: string
        fromDate?: string
        toDate?: string
        limit?: number
    } = {}
) {
    try {
        const filterArray: [string, string, unknown][] = []

        if (filters.itemCode) {
            filterArray.push(['item_code', '=', filters.itemCode])
        }
        if (filters.warehouse) {
            filterArray.push(['warehouse', '=', filters.warehouse])
        }
        if (filters.fromDate) {
            filterArray.push(['posting_date', '>=', filters.fromDate])
        }
        if (filters.toDate) {
            filterArray.push(['posting_date', '<=', filters.toDate])
        }

        const params = new URLSearchParams({
            fields: JSON.stringify([
                'name', 'item_code', 'warehouse', 'posting_date', 'posting_time',
                'actual_qty', 'qty_after_transaction', 'voucher_type', 'voucher_no'
            ]),
            filters: JSON.stringify(filterArray),
            order_by: 'posting_date desc, posting_time desc',
            limit_page_length: (filters.limit || 50).toString(),
        })

        const result = await erpnextFetch<Array<{
            name: string
            item_code: string
            warehouse: string
            posting_date: string
            posting_time: string
            actual_qty: number
            qty_after_transaction: number
            voucher_type: string
            voucher_no: string
        }>>(`/api/resource/Stock Ledger Entry?${params.toString()}`)

        if (!result) return []

        return result.map(entry => ({
            id: entry.name,
            itemCode: entry.item_code,
            warehouse: entry.warehouse,
            date: new Date(`${entry.posting_date}T${entry.posting_time}`),
            qtyChange: entry.actual_qty,
            balanceQty: entry.qty_after_transaction,
            voucherType: entry.voucher_type,
            voucherNo: entry.voucher_no,
        }))
    } catch (error) {
        console.error('Get stock ledger entries error:', error)
        return []
    }
}
