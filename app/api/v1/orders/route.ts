/**
 * POST /api/v1/orders   — Place a new order (JWT required)
 * GET  /api/v1/orders   — List customer's orders (JWT required)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// ─── POST: Create Order ───────────────────────────────────────────────────────

const orderItemSchema = z.object({
    itemCode: z.string().min(1),
    itemName: z.string().min(1),
    qty: z.number().int().positive(),
    rate: z.number().positive(),
    discountAmount: z.number().min(0).default(0),
    imageUrl: z.string().optional(),
    variantInfo: z.record(z.string(), z.string()).optional(),
})

const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
    deliveryAddress: z.string().min(1, 'Delivery address is required'),
    deliveryCity: z.string().optional(),
    deliveryNotes: z.string().optional(),
    customerPhone: z.string().optional(),
    paymentMethod: z.enum(['cod', 'esewa', 'khalti', 'fonepay', 'bank_transfer', 'card']).default('cod'),
})

export const POST = withApiAuth(async (req, ctx) => {
    const body = await req.json()
    const validation = createOrderSchema.safeParse(body)

    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', issues: validation.error.issues },
            { status: 400 }
        )
    }

    const data = validation.data
    const supabase = getServiceClient()

    // Calculate totals
    const items = data.items.map(item => ({
        item_code: item.itemCode,
        item_name: item.itemName,
        qty: item.qty,
        rate: item.rate,
        discount_amount: item.discountAmount,
        amount: (item.qty * item.rate) - item.discountAmount,
        image_url: item.imageUrl || null,
        variant_info: item.variantInfo || null,
        tenant_id: ctx.tenantId,
    }))

    const subtotal = items.reduce((sum, i) => sum + i.amount, 0)
    const taxAmount = Math.round(subtotal * (ctx.tenantSettings.taxRate / 100) * 100) / 100
    const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100

    // Get atomic order number
    const { data: orderNumResult, error: seqError } = await supabase
        .rpc('next_order_number', { p_tenant_id: ctx.tenantId })

    if (seqError || !orderNumResult) {
        console.error('Order number sequence error:', seqError)
        return NextResponse.json(
            { error: 'Failed to generate order number' },
            { status: 500 }
        )
    }

    const orderNumber = orderNumResult as string

    // Create order
    const { data: order, error: orderError } = await supabase
        .from('storefront_orders')
        .insert({
            tenant_id: ctx.tenantId,
            customer_id: ctx.customer!.sub,
            order_number: orderNumber,
            status: 'pending',
            subtotal,
            tax_amount: taxAmount,
            discount_amount: 0,
            shipping_amount: 0,
            grand_total: grandTotal,
            payment_method: data.paymentMethod,
            payment_status: 'unpaid',
            delivery_address: data.deliveryAddress,
            delivery_city: data.deliveryCity || null,
            delivery_notes: data.deliveryNotes || null,
            customer_phone: data.customerPhone || ctx.customer!.email,
            customer_name: ctx.customer!.name,
        })
        .select('id, order_number, status, subtotal, tax_amount, grand_total, payment_method, payment_status, delivery_address, delivery_city, created_at')
        .single()

    if (orderError || !order) {
        console.error('Create order error:', orderError)
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        )
    }

    // Insert order items
    const orderItems = items.map(item => ({
        ...item,
        order_id: order.id,
    }))

    const { error: itemsError } = await supabase
        .from('storefront_order_items')
        .insert(orderItems)

    if (itemsError) {
        console.error('Insert order items error:', itemsError)
        // Order was created but items failed — mark as failed
        await supabase
            .from('storefront_orders')
            .update({ status: 'failed' })
            .eq('id', order.id)

        return NextResponse.json(
            { error: 'Failed to save order items' },
            { status: 500 }
        )
    }

    return NextResponse.json({
        order: {
            id: order.id,
            orderNumber: order.order_number,
            status: order.status,
            subtotal: Number(order.subtotal),
            taxAmount: Number(order.tax_amount),
            grandTotal: Number(order.grand_total),
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            deliveryAddress: order.delivery_address,
            deliveryCity: order.delivery_city,
            itemCount: data.items.length,
            createdAt: order.created_at,
        },
    }, { status: 201 })
}, { requireCustomer: true })

// ─── GET: List Customer's Orders ──────────────────────────────────────────────

export const GET = withApiAuth(async (req: NextRequest, ctx) => {
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')))
    const status = url.searchParams.get('status')
    const offset = (page - 1) * limit

    const supabase = getServiceClient()

    let query = supabase
        .from('storefront_orders')
        .select('id, order_number, status, subtotal, tax_amount, grand_total, payment_method, payment_status, delivery_city, created_at', { count: 'exact' })
        .eq('tenant_id', ctx.tenantId)
        .eq('customer_id', ctx.customer!.sub)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (status) {
        query = query.eq('status', status)
    }

    const { data: orders, count, error } = await query

    if (error) {
        console.error('List orders error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        )
    }

    const total = count || 0

    return NextResponse.json({
        orders: (orders || []).map(o => ({
            id: o.id,
            orderNumber: o.order_number,
            status: o.status,
            grandTotal: Number(o.grand_total),
            paymentMethod: o.payment_method,
            paymentStatus: o.payment_status,
            deliveryCity: o.delivery_city,
            createdAt: o.created_at,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: offset + limit < total,
        },
    })
}, { requireCustomer: true })

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
