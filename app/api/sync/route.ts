import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPOSInvoice } from '@/app/actions/pos';

// Simplified sync route that forwards offline orders to ERPNext via createPOSInvoice
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Basic validation
        if (!body.orders || !Array.isArray(body.orders)) {
            return NextResponse.json(
                { success: false, error: 'Invalid payload format' },
                { status: 400 }
            );
        }

        const syncedIds: string[] = [];
        const errors: any[] = [];

        for (const order of body.orders) {
            try {
                // Transform offline order to POS Invoice format
                const formData = new FormData();
                formData.append('paymentMode', 'CASH'); // Default or map from order.paymentMode
                formData.append('paidAmount', order.grandTotal.toString());

                const items = order.items.map((item: any) => ({
                    itemId: item.itemId, // Should be ERPNext Item Code
                    qty: item.quantity,
                    rate: item.price,
                    discount: 0
                }));

                formData.append('items', JSON.stringify(items));

                // Call the server action directly
                const result = await createPOSInvoice(formData);

                if (result.success) {
                    syncedIds.push(order.uuid);
                } else {
                    errors.push({ id: order.uuid, error: result.error });
                }

            } catch (err: any) {
                console.error(`Failed to sync order ${order.uuid}:`, err);
                errors.push({ id: order.uuid, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            syncedCount: syncedIds.length,
            syncedIds,
            errors
        });

    } catch (error) {
        console.error('Sync API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
