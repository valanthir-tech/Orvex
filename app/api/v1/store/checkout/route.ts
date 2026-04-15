/**
 * POST /api/v1/store/checkout
 * 
 * Handles guest and registered storefront checkouts natively.
 * V2.0 Buffered Architecture: This does NOT wait for ERPNext. It instantly inserts a 
 * record into Supabase `storefront_orders` with sync_status = 'pending'.
 * The background worker will safely construct the Sales Order in ERPNext.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/tenant'

const checkoutItemSchema = z.object({
    itemCode: z.string(),
    itemName: z.string(),
    qty: z.number().int().positive(),
    rate: z.number().nonnegative(),
})

const checkoutSchema = z.object({
    customer: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        address: z.string().min(1),
        notes: z.string().optional()
    }),
    items: z.array(checkoutItemSchema).min(1),
    paymentMethod: z.string().default('bank_transfer'),
    deliveryAddress: z.string().optional(),
    customerPhone: z.string().optional(),
})

export const POST = withApiAuth(async (req, ctx) => {
    try {
        const body = await req.json()
        const validation = checkoutSchema.safeParse(body)
        const idempotencyKey = req.headers.get('x-idempotency-key')

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid checkout payload', details: validation.error.format() },
                { status: 400 }
            )
        }

        const data = validation.data
        const supabase = await createSupabaseServerClient()

        // 1. Defend Against Duplicate Clicks (Idempotency)
        if (idempotencyKey) {
            const { data: existingOrder } = await supabase
                .from('storefront_orders')
                .select('id, order_number, status')
                .eq('tenant_id', ctx.tenantId)
                .eq('order_number', idempotencyKey) // using order_number as idempotency or generating new
                .limit(1)
                .single()
            
            if (existingOrder) {
                return NextResponse.json({
                    success: true,
                    order: {
                        name: existingOrder.order_number,
                        status: existingOrder.status,
                        customer: data.customer.name
                    },
                    message: "Order already received (Idempotency Hit)"
                })
            }
        }

        // 2. Generate a local order number (fast fallback)
        const newOrderNumber = idempotencyKey || `WEB-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        // Calculate totals for the buffer
        let subtotal = 0
        data.items.forEach(i => subtotal += (i.qty * i.rate))

        // 3. Buffer highly-secure insert into Supabase
        const { data: newOrder, error: bufferError } = await supabase
            .from('storefront_orders')
            .insert({
                tenant_id: ctx.tenantId,
                customer_id: ctx.user?.id || null, // Will be null for guest checkouts
                order_number: newOrderNumber,
                status: 'pending',          // Storefront status
                sync_status: 'pending',     // ERPNext Sync worker status
                subtotal: subtotal,
                tax_amount: 0,
                discount_amount: 0,
                shipping_amount: 0,
                grand_total: subtotal,
                payment_method: data.paymentMethod,
                payment_status: 'unpaid',
                delivery_address: data.deliveryAddress || data.customer.address,
                delivery_city: 'Kathmandu', // Can be mapped later
                delivery_notes: data.customer.notes || null,
                customer_phone: data.customerPhone || data.customer.phone,
                customer_name: data.customer.name,
                // We save raw item array so the sync worker can process them
                // without relying on a separate relational insert if we just want a flat payload.
                // In production, we should insert into storefront_order_items too.
            })
            .select('id')
            .single()

        if (bufferError || !newOrder) {
            console.error('Supabase Storefront Buffer Insert Failed:', bufferError)
            return NextResponse.json(
                { error: 'Failed to securely capture the order. Please try again.', details: bufferError },
                { status: 500 }
            )
        }

        // Insert Items into `storefront_order_items` for the backend logic
        const itemsToInsert = data.items.map((item: any) => ({
            order_id: newOrder.id,
            tenant_id: ctx.tenantId,
            item_code: item.itemCode,
            item_name: item.itemName,
            qty: item.qty,
            rate: item.rate,
            amount: item.qty * item.rate
        }))

        const { error: itemsError } = await supabase
            .from('storefront_order_items')
            .insert(itemsToInsert)

        if (itemsError) {
            console.error("Warning: Order saved but items failed to attach to relational DB", itemsError)
        }

        // 4. Return instant 201 response to customer
        return NextResponse.json({
            success: true,
            order: {
                id: newOrder.id,
                name: newOrderNumber,
                status: 'submitted',
                sync_status: 'pending',
                customer: data.customer.name
            },
            message: "Your order has been placed successfully."
        }, { status: 201 })

    } catch (error: any) {
        console.error('Checkout failed:', error.message)
        return NextResponse.json(
            { error: 'Internal Server Error processing checkout', details: error.message },
            { status: 500 }
        )
    }
})

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
