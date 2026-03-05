"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getTenantClient } from "@/lib/tenant"
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
        const client = await getTenantClient();

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
            })
        }

        const grandTotal = netTotal - totalDiscount

        // Create Sales Invoice in ERPNext
        // For POS, we use Sales Invoice with is_pos = 1 and update_stock = 1
        const invoiceData: Partial<ERPNextSalesInvoice> = {
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

        if (!result || !result.name) {
            return { error: "Failed to create invoice in ERPNext" }
        }

        if ((result as any).status === 'already_synced') {
            return { success: true, invoiceId: result.name, alreadySynced: true }
        }

        revalidatePath("/pos")
        return { success: true, invoiceId: result.name }

    } catch (e: unknown) {
        console.error(e)
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
        console.error('Get invoices error:', error)
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
        console.error('Get invoice error:', error)
        return null
    }
}
