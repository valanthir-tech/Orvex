/**
 * GET /api/v1/orders/[id]  — Get order detail with items (JWT required)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export const GET = withApiAuth(async (req: NextRequest, ctx) => {
    // Extract order ID from URL path
    const segments = new URL(req.url).pathname.split('/')
    const orderId = segments[segments.length - 1]

    if (!orderId) {
        return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Fetch order (must belong to this customer + tenant)
    const { data: order, error } = await supabase
        .from('storefront_orders')
        .select(`
            id, order_number, status, subtotal, tax_amount, discount_amount,
            shipping_amount, grand_total, payment_method, payment_status,
            delivery_address, delivery_city, delivery_notes, customer_phone,
            customer_name, created_at, updated_at
        `)
        .eq('id', orderId)
        .eq('tenant_id', ctx.tenantId)
        .eq('customer_id', ctx.customer!.sub)
        .single()

    if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fetch order items
    const { data: items } = await supabase
        .from('storefront_order_items')
        .select('id, item_code, item_name, qty, rate, discount_amount, amount, image_url, variant_info')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true })

    return NextResponse.json({
        order: {
            id: order.id,
            orderNumber: order.order_number,
            status: order.status,
            subtotal: Number(order.subtotal),
            taxAmount: Number(order.tax_amount),
            discountAmount: Number(order.discount_amount),
            shippingAmount: Number(order.shipping_amount),
            grandTotal: Number(order.grand_total),
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            deliveryAddress: order.delivery_address,
            deliveryCity: order.delivery_city,
            deliveryNotes: order.delivery_notes,
            customerPhone: order.customer_phone,
            customerName: order.customer_name,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            items: (items || []).map(i => ({
                id: i.id,
                itemCode: i.item_code,
                itemName: i.item_name,
                qty: i.qty,
                rate: Number(i.rate),
                discountAmount: Number(i.discount_amount),
                amount: Number(i.amount),
                imageUrl: i.image_url,
                variantInfo: i.variant_info,
            })),
        },
    })
}, { requireCustomer: true })

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
