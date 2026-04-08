"use server"

import { getTenantClient } from '@/lib/tenant'

// Get warehouses from CoreEngine
export async function getWarehouses() {
    try {
        const client = await getTenantClient()

        const result = await client.getList<{
            name: string
            warehouse_name: string
            parent_warehouse?: string
            is_group: 0 | 1
        }>('Warehouse', {
            fields: ['name', 'warehouse_name', 'parent_warehouse', 'is_group'],
            filters: [['is_group', '=', 0]],
            limit: 0,
        })

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
    voucherType: string
    voucherNo: string
    warehouseId?: string
}

// Create a Stock Entry in CoreEngine
export async function createStockEntry(
    purpose: 'Material Receipt' | 'Material Issue' | 'Material Transfer',
    items: Array<{
        item_code: string
        qty: number
        rate?: number
        s_warehouse?: string
        t_warehouse?: string
    }>
) {
    try {
        const client = await getTenantClient()

        const result = await client.createDoc<{ name: string }>('Stock Entry', {
            stock_entry_type: purpose,
            items: items.map(item => ({
                item_code: item.item_code,
                qty: item.qty,
                basic_rate: item.rate || 0,
                s_warehouse: item.s_warehouse,
                t_warehouse: item.t_warehouse,
            })),
        } as any)

        if (!result) {
            return { success: false, error: "Failed to create stock entry" }
        }

        return { success: true, name: result.name }
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
        const client = await getTenantClient()

        const params: Record<string, string> = { item_code: itemCode }
        if (warehouse) params.warehouse = warehouse

        const result = await client.get<number>(
            '/api/method/CoreEngine.stock.utils.get_stock_balance',
            params
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
        const client = await getTenantClient()

        const filterArray: [string, string, unknown][] = []
        if (filters.itemCode) filterArray.push(['item_code', '=', filters.itemCode])
        if (filters.warehouse) filterArray.push(['warehouse', '=', filters.warehouse])
        if (filters.fromDate) filterArray.push(['posting_date', '>=', filters.fromDate])
        if (filters.toDate) filterArray.push(['posting_date', '<=', filters.toDate])

        const result = await client.getList<{
            name: string
            item_code: string
            warehouse: string
            posting_date: string
            posting_time: string
            actual_qty: number
            qty_after_transaction: number
            voucher_type: string
            voucher_no: string
        }>('Stock Ledger Entry', {
            fields: ['name', 'item_code', 'warehouse', 'posting_date', 'posting_time',
                'actual_qty', 'qty_after_transaction', 'voucher_type', 'voucher_no'],
            filters: filterArray,
            limit: filters.limit || 50,
            orderBy: 'posting_date desc, posting_time desc',
        })

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
