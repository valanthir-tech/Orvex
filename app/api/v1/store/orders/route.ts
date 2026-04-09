import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'

export const GET = withApiAuth(async (req, ctx) => {
    try {
        if (!ctx.customer || !ctx.customer.email) {
            return NextResponse.json({ error: 'Unauthorized: Full checkout/login required' }, { status: 401 })
        }

        const email = ctx.customer.email

        // 1. Fetch the ERPNext customer by email
        const customerSearch = await ctx.erpnextClient.getList('Customer', {
            filters: [['email_id', '=', email]],
            limit: 1,
            fields: ['name']
        })

        if (!customerSearch || customerSearch.length === 0) {
            // Customer exists in Supabase but hasn't made an order yet
            return NextResponse.json({ orders: [] })
        }

        const erpCustomerName = (customerSearch[0] as any).name

        // 2. Fetch past Sales Invoices for this customer
        const invoices = await ctx.erpnextClient.getList('Sales Invoice', {
            filters: [
                ['customer', '=', erpCustomerName],
                ['docstatus', '=', 1] // Only submitted invoices
            ],
            fields: ['name', 'posting_date', 'grand_total', 'status'],
            limit: 50,
            orderBy: 'posting_date desc'
        }) || []

        // 3. Map ERPNext Invoices to frontend-friendly format
        const formattedOrders = invoices.map((inv: any) => ({
            id: inv.name,
            date: inv.posting_date,
            total: inv.grand_total,
            status: inv.status,
            item_count: 0 // Simplification since pulling child table items requires another query or larger fields
        }))

        return NextResponse.json({ orders: formattedOrders })
    } catch (error) {
        console.error('[API Error] Fetching orders:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}, { requireCustomer: true })

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
