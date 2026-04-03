import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createPOSInvoice } from '@/app/actions/pos';
import { createSupabaseServerClient } from '@/lib/tenant';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/sync
 *
 * Receives offline POS orders from the SyncWorker and forwards them to
 * ERPNext via the createPOSInvoice server action. Each order's UUID is
 * passed as the idempotency key to prevent duplicate invoice creation.
 */
export async function POST(req: NextRequest) {
    // Auth guard — require a valid session
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 60 syncs per minute per user
    const rl = await rateLimit(user.id, { limit: 60, windowSecs: 60, prefix: 'sync' });
    if (!rl.success) {
        return NextResponse.json(
            { success: false, error: 'Too many sync requests. Please wait before retrying.' },
            { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
        );
    }

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
                // Avoid zod validation errors when frontend passes "QR"
                let mappedPayment = order.paymentMode || 'CASH';
                if (mappedPayment === 'QR') mappedPayment = 'QR_ESEWA';
                
                formData.append('paymentMode', mappedPayment);
                formData.append('paidAmount', String(order.paidAmount ?? order.grandTotal));
                formData.append('posUuid', order.uuid);

                const items = (order.products || order.items || []).map((item: any) => ({
                    itemId: item.sku || item.itemId || item.productId,
                    qty: item.quantity || item.qty,
                    rate: item.rate || item.price,
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
                // Silenced in production
                errors.push({ id: order.uuid, error: err.message || 'Network error' });
            }
        }

        // Revalidate Server Components to ensure the dashboard instantly reflects synced orders
        if (syncedIds.length > 0) {
            revalidatePath('/', 'layout');
            // console.log(`[Sync] Revalidated app cache for ${syncedIds.length} synced orders.`);
        }

        return NextResponse.json({
            success: true,
            syncedCount: syncedIds.length,
            syncedIds,
            errors,
        });
    } catch (error) {
        // Silenced in production
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
