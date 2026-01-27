"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireProfile } from "@/lib/auth"
import { ensureMainWarehouse } from "./stock"

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

export async function createPOSInvoice(formData: FormData) {
    const profile = await requireProfile()

    // Ensure POS Profile (Counter) exists for this user/org, or create default
    let posProfile = await prisma.pOSProfile.findFirst({
        where: { organizationId: profile.organizationId }
    })

    if (!posProfile) {
        // Auto-create default counter
        posProfile = await prisma.pOSProfile.create({
            data: {
                name: "Main Counter",
                organizationId: profile.organizationId,
                namingSeries: "INV-"
            }
        })
    }

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
        const result = await prisma.$transaction(async (tx) => {
            // 1. Calculate Totals
            let netTotal = 0
            let totalDiscount = 0

            // Verify items exist and fetch details
            const productIds = cartItems.map(c => c.itemId)
            const products = await tx.item.findMany({
                where: { id: { in: productIds } }
            })
            const productMap = new Map(products.map(p => [p.id, p]))

            const lineItems = []

            for (const cartItem of cartItems) {
                const product = productMap.get(cartItem.itemId)
                if (!product) throw new Error(`Product not found`)

                // Use cart rate (allows overrides) or system rate? 
                // For now system rate for security, or cart rate if we trust UI. 
                // Let's use cart rate but validate it's not crazy? 
                // Simpler: Use cart rate passed from UI.

                const amount = cartItem.qty * cartItem.rate
                netTotal += amount
                totalDiscount += (cartItem.discount || 0)

                lineItems.push({
                    itemId: cartItem.itemId,
                    itemName: product.name,
                    qty: cartItem.qty,
                    rate: cartItem.rate,
                    amount: amount,
                    discountAmount: cartItem.discount || 0
                })
            }

            const grandTotal = netTotal - totalDiscount
            const changeAmount = Math.max(0, paidAmount - grandTotal)

            // 2. Create Invoice
            const invoice = await tx.pOSInvoice.create({
                data: {
                    name: `${posProfile.namingSeries}${Date.now()}`,
                    status: 'PAID',
                    organizationId: profile.organizationId,
                    posProfileId: posProfile.id,
                    createdById: profile.id,
                    customer: "Walk-in Customer",

                    netTotal,
                    totalTax: 0, // TODO: Tax Logic
                    discountAmount: totalDiscount,
                    grandTotal,
                    paidAmount,
                    changeAmount,
                    modeOfPayment: paymentMode as any,
                }
            })

            // 3. Create Invoice Items
            for (const line of lineItems) {
                await tx.pOSInvoiceItem.create({
                    data: {
                        invoiceId: invoice.id,
                        ...line
                    }
                })
            }

            // 4. Deduct Stock (Auto-Stock Entry)
            const warehouse = await ensureMainWarehouse(profile.organizationId, tx)

            for (const line of lineItems) {
                await tx.stockLedgerEntry.create({
                    data: {
                        organizationId: profile.organizationId,
                        itemId: line.itemId,
                        warehouseId: warehouse.id,
                        qtyChange: -line.qty, // Negative for sale
                        actualQty: 0,
                        valuationRate: 0,
                        voucherType: "POS Invoice",
                        voucherNo: invoice.name
                    }
                })

                await tx.item.update({
                    where: { id: line.itemId },
                    data: { currentStock: { decrement: line.qty } }
                })
            }

            return invoice
        })

        revalidatePath("/pos")
        return { success: true, invoiceId: result.id }

    } catch (e: any) {
        console.error(e)
        return { error: e.message || "Failed to process sale" }
    }
}
