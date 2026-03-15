"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getTenantClient, getTenantContext, createSupabaseServerClient } from "@/lib/tenant"
import { ERPNextSalesInvoice } from "@/lib/erpnext"

// 
// MULTI-TENANT REFACTOR
// All actions now use getTenantClient() to resolve headers dynamically
// 

export type CartItem = {
    itemId: string
    qty: number
    rate: number
    discount?: number
}

const invoiceSchema = z.object({
    items: z.string(), // JSON string of CartItem[]
    paymentMode: z.enum(['CASH', 'CARD', 'QR_ESEWA', 'QR_KHALTI', 'QR_FONEPAY', 'BANK_TRANSFER']),
    paidAmount: z.coerce.number().min(0)
})

// Map our payment modes to ERPNext Mode of Payment
const PAYMENT_MODE_MAP: Record<string, string> = {
    'CASH': 'Cash',
    'CARD': 'Credit Card',
    'QR_ESEWA': 'Cash', // Will need to create custom modes in ERPNext
    'QR_KHALTI': 'Cash',
    'QR_FONEPAY': 'Cash',
    'BANK_TRANSFER': 'Bank Draft',
}

export async function createPOSInvoice(formData: FormData) {
    const rawData = {
        items: formData.get("items"),
        paymentMode: formData.get("paymentMode"),
        paidAmount: formData.get("paidAmount"),
        posUuid: formData.get("posUuid"), // Critical for idempotency
    }

    const validation = invoiceSchema.safeParse(rawData)
    if (!validation.success) return { error: "Invalid Data" }

    const { items: itemsJson, paymentMode, paidAmount } = validation.data
    const cartItems = JSON.parse(itemsJson) as CartItem[]
    const posUuid = rawData.posUuid as string || crypto.randomUUID(); // Fallback if not provided, but SyncWorker MUST provide it.

    if (cartItems.length === 0) return { error: "Cart is empty" }

    try {
        const { client, companyName, warehouseName, priceList, tenantId } = await getTenantContext();

        // Calculate totals
        let netTotal = 0
        let totalDiscount = 0
        const invoiceItems: any[] = []

        for (const cartItem of cartItems) {
            const amount = cartItem.qty * cartItem.rate
            netTotal += amount
            totalDiscount += (cartItem.discount || 0)

            invoiceItems.push({
                item_code: cartItem.itemId,
                qty: cartItem.qty,
                rate: cartItem.rate,
                discount_amount: cartItem.discount || 0,
                warehouse: warehouseName,
            })
        }

        const grandTotal = netTotal - totalDiscount

        // Create Sales Invoice in ERPNext
        // For POS, we use Sales Invoice with is_pos = 1 and update_stock = 1
        const invoiceData: Partial<ERPNextSalesInvoice> & Record<string, any> = {
            company: companyName,
            set_warehouse: warehouseName,
            selling_price_list: priceList,
            customer: 'Walk-in Customer', // ERPNext needs a customer - create this in ERPNext
            posting_date: new Date().toISOString().split('T')[0],
            is_pos: 1,
            update_stock: 1,
            // @ts-ignore - Some ERPNext types are dynamic
            items: invoiceItems,
            payments: [{
                mode_of_payment: PAYMENT_MODE_MAP[paymentMode] || 'Cash',
                amount: paidAmount,
            }],
            paid_amount: paidAmount,
            // @ts-ignore
            change_amount: Math.max(0, paidAmount - grandTotal),
        }

        const result = await client.createSalesInvoice(invoiceData, posUuid);

        // Submit the invoice so stock drops!
        if (result && result.name && (result as any).status !== 'already_synced') {
            await client.post('/method/frappe.client.submit', { doc: { doctype: 'Sales Invoice', name: result.name } });
        }

        if (!result || !result.name) {
            return { error: "Failed to create invoice in ERPNext" }
        }

        if ((result as any).status === 'already_synced') {
            return { success: true, invoiceId: result.name, alreadySynced: true }
        }

        revalidatePath("/pos")
        return { success: true, invoiceId: result.name }

    } catch (e: unknown) {
        console.error("Sale processing error:", e instanceof Error ? e.message : String(e))
        const error = e as Error
        return { error: error.message || "Failed to process sale" }
    }
}

// Get POS invoices for today
export async function getTodayInvoices() {
    const today = new Date().toISOString().split('T')[0]

    try {
        const client = await getTenantClient();

        const result = await client.getList<{
            name: string
            customer: string
            grand_total: number
            paid_amount: number
            posting_date: string
            posting_time: string
            status: string
        }>('Sales Invoice', {
            filters: [
                ['posting_date', '=', today],
                ['is_pos', '=', 1],
            ],
            // fields: ['name', 'customer', 'grand_total', 'paid_amount', 'posting_date', 'posting_time', 'status'], // getList handles fields diff
            orderBy: 'creation desc',
            limit: 50
        })

        return result.map(inv => ({
            id: inv.name,
            name: inv.name,
            customer: inv.customer,
            grandTotal: inv.grand_total,
            paidAmount: inv.paid_amount,
            createdAt: new Date(`${inv.posting_date}T${inv.posting_time}`),
            status: inv.status,
        }))
    } catch (error) {
        console.error('Get invoices error:', error instanceof Error ? error.message : String(error))
        return []
    }
}

// Get invoice details
export async function getInvoice(id: string) {
    try {
        const client = await getTenantClient();
        const result = await client.getDoc<any>('Sales Invoice', id);

        if (!result) return null

        return {
            id: result.name,
            name: result.name,
            customer: result.customer,
            grandTotal: result.grand_total,
            paidAmount: result.paid_amount,
            changeAmount: result.change_amount,
            createdAt: new Date(`${result.posting_date}T${result.posting_time}`),
            status: result.status,
            items: result.items.map((item: any) => ({
                itemCode: item.item_code,
                itemName: item.item_name,
                qty: item.qty,
                rate: item.rate,
                amount: item.amount,
            })),
            payments: result.payments.map((p: any) => ({
                mode: p.mode_of_payment,
                amount: p.amount,
            })),
        }
    } catch (error) {
        console.error('Get invoice error:', error instanceof Error ? error.message : String(error))
        return null
    }
}

// Get items for the POS terminal (formatted for Dexie local DB)
export async function getPOSItems() {
    try {
        const { client, tenantId, warehouseName } = await getTenantContext();
        const supabase = await createSupabaseServerClient();

        const { data: tenantItems, error: tbError } = await supabase
            .from('tenant_items')
            .select('item_code, display_name, price, image, active')
            .eq('tenant_id', tenantId)
            .eq('active', true);

        if (tbError || !tenantItems || tenantItems.length === 0) return [];
        const itemCodes = tenantItems.map((ti: any) => ti.item_code);
        const customMap = new Map(tenantItems.map((ti: any) => [ti.item_code, ti]));

        const items = await client.getList<{
            name: string;
            item_name: string;
            item_code: string;
            item_group: string;
            standard_rate: number;
            valuation_rate: number;
            image: string | null;
            disabled: 0 | 1;
        }>('Item', {
            fields: ['name', 'item_name', 'item_code', 'item_group', 'standard_rate', 'valuation_rate', 'image', 'disabled'],
            filters: [['disabled', '=', 0], ['is_stock_item', '=', 1], ['name', 'in', itemCodes]],
            limit: 0,
        });

        // Fetch stock for all items
        const bins = await client.getList<{
            item_code: string;
            actual_qty: number;
        }>('Bin', {
            fields: ['item_code', 'actual_qty'],
            filters: [['warehouse', '=', warehouseName]],
            limit: 0,
        });

        const stockMap = new Map<string, number>();
        for (const bin of bins) {
            stockMap.set(bin.item_code, (stockMap.get(bin.item_code) || 0) + bin.actual_qty);
        }

        return items.map(item => {
            const custom = customMap.get(item.item_code) || {};
            return {
            id: item.name,
            name: custom.display_name || item.item_name || item.name,
            sku: item.item_code,
            price: custom.price || item.standard_rate || 0,
            cost: item.valuation_rate || 0,
            stock: stockMap.get(item.item_code) || 0,
            minStock: 0,
            category: item.item_group || 'Uncategorized',
            barcode: null as string | null,
            image: custom.image || item.image || null,
            isActive: true,
            isSynced: true,
            updatedAt: new Date(),
        }});
    } catch (error) {
        console.error('Get POS items error:', error instanceof Error ? error.message : String(error));
        return [];
    }
}
