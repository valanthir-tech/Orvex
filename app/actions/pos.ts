"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

// ERPNext API Configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || 'http://localhost:8080'
const API_KEY = process.env.ERPNEXT_API_KEY
const API_SECRET = process.env.ERPNEXT_API_SECRET

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

export async function createPOSInvoice(formData: FormData) {
    const rawData = {
        items: formData.get("items"),
        paymentMode: formData.get("paymentMode"),
        paidAmount: formData.get("paidAmount")
    }

    const validation = invoiceSchema.safeParse(rawData)
    if (!validation.success) return { error: "Invalid Data" }

    const { items: itemsJson, paymentMode, paidAmount } = validation.data
    const cartItems = JSON.parse(itemsJson) as CartItem[]

    if (cartItems.length === 0) return { error: "Cart is empty" }

    try {
        // Calculate totals
        let netTotal = 0
        let totalDiscount = 0
        const invoiceItems: Array<{
            item_code: string
            qty: number
            rate: number
            discount_amount?: number
        }> = []

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
        const invoiceData = {
            doctype: 'Sales Invoice',
            customer: 'Walk-in Customer', // ERPNext needs a customer - create this in ERPNext
            posting_date: new Date().toISOString().split('T')[0],
            is_pos: 1,
            update_stock: 1,
            items: invoiceItems.map(item => ({
                doctype: 'Sales Invoice Item',
                item_code: item.item_code,
                qty: item.qty,
                rate: item.rate,
                discount_amount: item.discount_amount,
            })),
            payments: [{
                doctype: 'Sales Invoice Payment',
                mode_of_payment: PAYMENT_MODE_MAP[paymentMode] || 'Cash',
                amount: paidAmount,
            }],
            paid_amount: paidAmount,
            change_amount: Math.max(0, paidAmount - grandTotal),
        }

        const result = await erpnextFetch<{ name: string }>(
            '/api/resource/Sales Invoice',
            {
                method: 'POST',
                body: JSON.stringify(invoiceData),
            }
        )

        if (!result) {
            return { error: "Failed to create invoice in ERPNext" }
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
        const params = new URLSearchParams({
            filters: JSON.stringify([
                ['posting_date', '=', today],
                ['is_pos', '=', 1],
            ]),
            fields: JSON.stringify([
                'name', 'customer', 'grand_total', 'paid_amount',
                'posting_date', 'posting_time', 'status'
            ]),
            order_by: 'creation desc',
            limit_page_length: '50',
        })

        const result = await erpnextFetch<Array<{
            name: string
            customer: string
            grand_total: number
            paid_amount: number
            posting_date: string
            posting_time: string
            status: string
        }>>(`/api/resource/Sales Invoice?${params.toString()}`)

        if (!result) return []

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
        const result = await erpnextFetch<{
            name: string
            customer: string
            grand_total: number
            paid_amount: number
            change_amount: number
            posting_date: string
            posting_time: string
            status: string
            items: Array<{
                item_code: string
                item_name: string
                qty: number
                rate: number
                amount: number
            }>
            payments: Array<{
                mode_of_payment: string
                amount: number
            }>
        }>(`/api/resource/Sales Invoice/${encodeURIComponent(id)}`)

        if (!result) return null

        const inv = result
        return {
            id: inv.name,
            name: inv.name,
            customer: inv.customer,
            grandTotal: inv.grand_total,
            paidAmount: inv.paid_amount,
            changeAmount: inv.change_amount,
            createdAt: new Date(`${inv.posting_date}T${inv.posting_time}`),
            status: inv.status,
            items: inv.items.map(item => ({
                itemCode: item.item_code,
                itemName: item.item_name,
                qty: item.qty,
                rate: item.rate,
                amount: item.amount,
            })),
            payments: inv.payments.map(p => ({
                mode: p.mode_of_payment,
                amount: p.amount,
            })),
        }
    } catch (error) {
        console.error('Get invoice error:', error)
        return null
    }
}
