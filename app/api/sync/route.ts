import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createPOSInvoice } from '@/app/actions/pos';
import { createSupabaseServerClient } from '@/lib/tenant';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/sync
 *
 * Receives offline POS orders from the SyncWorker and forwards them to
 * CoreEngine via the createPOSInvoice server action. Each order's UUID is
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
        // Enforce max 2MB payload size defensively before accessing JSON
        const contentLength = req.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > 2000000) {
            return NextResponse.json(
                { success: false, error: 'Payload too large. Maximum size is 2MB per request.' },
                { status: 413 }
            );
        }

        const body = await req.json();

        if (!body.orders || !Array.isArray(body.orders) || body.orders.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid payload: orders array required' },
                { status: 400 }
            );
        }

        // Defensive guard vector: prevent DDOS loops mapping millions of items.
        // If a sync drops offline for a month, it should batch send max 50 at a time.
        if (body.orders.length > 50) {
            return NextResponse.json(
                { success: false, error: 'Payload exceeded: Maximum 50 offline orders per sync batch. Implement Client sliding window.' },
                { status: 413 }
            );
        }

        const syncedIds: string[] = [];
        const errors: { id: string; error: string }[] = [];

        // Get tenantId from user
        const { data: tenantKey } = await supabase.from('tenant_api_keys').select('tenant_id').eq('supabase_user_id', user.id).single();
        const tenantId = tenantKey?.tenant_id || user.id;

        for (const order of body.orders) {
            if (!order.uuid) {
                errors.push({ id: 'unknown', error: 'Order missing uuid' });
                continue;
            }

            try {
                // Idempotency key check
                const idempotencyKey = `${tenantId}-${order.uuid}-${order.created_at || Date.now()}`;
                const { data: existing } = await supabase
                    .from('sync_logs')
                    .select('*')
                    .eq('idempotency_key', idempotencyKey)
                    .single();

                if (existing?.status === 'success') {
                    syncedIds.push(order.uuid);
                    continue; // Already processed
                }

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
                    // Save with idempotency key
                    await supabase.from('sync_logs').insert({
                        tenant_id: tenantId,
                        idempotency_key: idempotencyKey,
                        status: 'success',
                        invoice_id: result.invoiceId
                    });
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
