import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTenantErpClient } from '@/lib/tenant'

/**
 * POST /api/cron/sync-storefront-orders
 * 
 * V2.0 Buffered Architecture Sync Worker.
 * Called by a secure cron job or Supabase webhook.
 * Connects to Supabase, finds 'pending' storefront orders, decrypts the tenant's 
 * ERP credentials, and creates a Sales Order in the specific ERPNext instance.
 */

// Initialize a Supabase client capable of bypassing RLS to process background jobs for any tenant
function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function POST(req: Request) {
    // 1. Secure the endpoint using a cron secret
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Return 401 if unauthorized. But since this is local dev we afford testing 
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    const supabase = getServiceClient()

    try {
        // 2. Fetch pending orders from the buffer (limit 50 per batch to avoid timeouts)
        const { data: pendingOrders, error: fetchError } = await supabase
            .from('storefront_orders')
            .select(`
                id, 
                tenant_id, 
                order_number, 
                customer_name, 
                customer_phone, 
                delivery_address, 
                delivery_city, 
                delivery_notes, 
                payment_method,
                grand_total
            `)
            .eq('sync_status', 'pending')
            .limit(50)

        if (fetchError) {
            throw new Error(`Failed to fetch pending orders: ${fetchError.message}`)
        }

        if (!pendingOrders || pendingOrders.length === 0) {
            return NextResponse.json({ success: true, message: 'No pending orders to sync.' })
        }

        const results = []

        // 3. Process each order independently
        for (const order of pendingOrders) {
            try {
                // Fetch the line items for this specific order
                const { data: orderItems, error: itemsError } = await supabase
                    .from('storefront_order_items')
                    .select('item_code, qty, rate')
                    .eq('order_id', order.id)

                if (itemsError || !orderItems || orderItems.length === 0) {
                    throw new Error('Order has no items or payload failed.')
                }

                // Retrieve the tenant's secure, isolated ERPNext client
                // This implicitly fetches their API keys, URL, Company, and Warehouse from the DB
                const erpClient = await getTenantErpClient(order.tenant_id)
                
                // Get the tenant configuration to map the correct Company
                const { data: tenantConfig } = await supabase
                    .from('tenants')
                    .select('erp_company')
                    .eq('id', order.tenant_id)
                    .single()

                if (!tenantConfig) throw new Error('Tenant missing ERP configuration in DB.')

                // Ensure Customer Exists in ERPNext (fallback logic)
                let finalCustomerName = order.customer_name
                try {
                    const customers = await erpClient.getList('Customer', {
                        filters: [['mobile_no', '=', order.customer_phone]],
                        limit: 1
                    })
                    if (!customers || customers.length === 0) {
                        const newCust = await erpClient.createDoc('Customer', {
                            customer_name: order.customer_name,
                            customer_type: 'Individual',
                            customer_group: 'Individual',
                            territory: 'All Territories',
                            mobile_no: order.customer_phone,
                        })
                        finalCustomerName = (newCust as any).name || order.customer_name
                    } else {
                        finalCustomerName = (customers[0] as any).name
                    }
                } catch (e) {
                    console.warn(`Failed to create strict customer, using generic: ${e}`)
                }

                // Format the ERPNext Sales Order Payload
                // Using Sales Order instead of Sales Invoice intentionally (V2.0 Blueprint)
                const salesOrderPayload = {
                    company: tenantConfig.erp_company,
                    customer: finalCustomerName,
                    order_type: "Sales",
                    transaction_date: new Date().toISOString().split('T')[0],
                    po_no: order.order_number, // The order ID the customer sees on the website
                    items: orderItems.map(item => ({
                        item_code: item.item_code,
                        qty: item.qty,
                        rate: item.rate
                    })),
                    // Adding notes for the Merchant to view in their Onedexo POS Dashboard
                    inter_company_order_reference: `Payment Method: ${order.payment_method}\nDelivery: ${order.delivery_city}, ${order.delivery_address}\nNotes: ${order.delivery_notes || 'None'}`
                }

                // Push secure Document to ERPNext
                const erpResponse = await erpClient.createDoc('Sales Order', salesOrderPayload)
                const erpOrderName = (erpResponse as any)?.name

                // 4. Mark order as completely successfully synced
                await supabase
                    .from('storefront_orders')
                    .update({
                        sync_status: 'synced',
                        erpnext_invoice_id: erpOrderName, // Storing the target SO Name
                        synced_at: new Date().toISOString(),
                        sync_error: null
                    })
                    .eq('id', order.id)

                results.push({ order: order.order_number, status: 'success', erp_id: erpOrderName })

            } catch (err: any) {
                // If this specific order fails, log it and mark it failed, but continue parsing others
                console.error(`Failed to sync order ${order.order_number}:`, err.message)
                
                await supabase
                    .from('storefront_orders')
                    .update({
                        sync_status: 'failed',
                        sync_error: err.response?.data || err.message
                    })
                    .eq('id', order.id)

                results.push({ order: order.order_number, status: 'failed', error: err.message })
            }
        }

        return NextResponse.json({ success: true, results })

    } catch (globalError: any) {
        console.error('CRITICAL: Sync Worker crashed:', globalError.message)
        return NextResponse.json({ error: globalError.message }, { status: 500 })
    }
}
