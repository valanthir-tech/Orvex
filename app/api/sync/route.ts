import { NextResponse } from 'next/server';
import { createPOSInvoice } from '@/app/actions/pos';

/**
 * POST /api/sync
 *
 * Receives offline POS orders from the SyncWorker and forwards them to
 * ERPNext via the createPOSInvoice server action. Each order's UUID is
 * passed as the idempotency key to prevent duplicate invoice creation.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.orders || !Array.isArray(body.orders) || body.orders.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid payload: orders array required' },
                { status: 400 }
            );
        }

        const syncedIds: string[] = [];
        const errors: { id: string; error: string }[] = [];

        for (const order of body.orders) {
            if (!order.uuid) {
                errors.push({ id: 'unknown', error: 'Order missing uuid' });
                continue;
            }

            try {
                const formData = new FormData();
                formData.append('paymentMode', order.paymentMode || 'CASH');
                formData.append('paidAmount', String(order.paidAmount ?? order.grandTotal));
                formData.append('posUuid', order.uuid);

                const items = (order.items || []).map((item: any) => ({
                    itemId: item.sku || item.itemId,
                    qty: item.quantity,
                    rate: item.price,
                    discount: item.discount || 0,
                }));

                formData.append('items', JSON.stringify(items));

                const result = await createPOSInvoice(formData);

                if (result.success) {
                    syncedIds.push(order.uuid);
                } else {
                    errors.push({ id: order.uuid, error: result.error || 'Unknown server error' });
                }
            } catch (err: any) {
                console.error(`[Sync] Failed order ${order.uuid}:`, err);
                errors.push({ id: order.uuid, error: err.message || 'Network error' });
            }
        }

        return NextResponse.json({
            success: true,
            syncedCount: syncedIds.length,
            syncedIds,
            errors,
        });
    } catch (error) {
        console.error('[Sync] API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
