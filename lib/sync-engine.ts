import { db, Order, SyncLog } from './db';

// ----------------------------------------------------------------------
// SYNC ENGINE
// 
// Reads completed orders from Dexie, attempts to POST to backend
// (mock or real CoreEngine), marks as synced or failed with retry logic.
// ----------------------------------------------------------------------

interface SyncResult {
    synced: number;
    failed: number;
    errors: string[];
}

const MAX_RETRIES = 99;
const BASE_DELAY_MS = 1000;

function getBackoffDelay(retries: number): number {
    return Math.min(BASE_DELAY_MS * Math.pow(2, retries), 30_000);
}

async function logSync(orderUuid: string, action: SyncLog['action'], errorMessage?: string, responseData?: string) {
    await db.syncLogs.add({
        orderUuid,
        action,
        errorMessage,
        responseData,
        timestamp: new Date(),
    });
}


/**
 * Sync all pending orders to backend.
 * Call this manually or on a timer.
 */
export async function syncPendingOrders(): Promise<SyncResult> {
    const result: SyncResult = { synced: 0, failed: 0, errors: [] };

    // Get all orders that need syncing
    const pendingOrders = await db.orders
        .where('status')
        .anyOf(['completed', 'sync_failed'])
        .filter((o) => o.syncRetries < MAX_RETRIES)
        .toArray();

    if (pendingOrders.length === 0) return result;

    for (const order of pendingOrders) {
        try {
            await logSync(order.uuid, 'sync_attempt');

            // Call the real API endpoint which uses the Core Engine
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connectionId: crypto.randomUUID(),
                    orders: [{
                        ...order,
                        status: order.status.toUpperCase()
                    }]
                })
            });

            const syncResult = await response.json();

            if (syncResult.success && syncResult.syncedIds?.includes(order.uuid)) {
                await db.orders.where('uuid').equals(order.uuid).modify({
                    status: 'synced',
                    syncedAt: new Date(),
                    syncError: undefined,
                });
                await logSync(order.uuid, 'sync_success', undefined, JSON.stringify(syncResult));
                result.synced++;
            } else {
                const errorMsg = syncResult.errors?.find((e: any) => e.id === order.uuid)?.error || 'Sync failed on server';
                // Silenced in production
                const newRetries = (order.syncRetries || 0) + 1;
                
                if (newRetries >= MAX_RETRIES) {
                    await db.failedOrders.put({ ...order, status: 'sync_failed', syncRetries: newRetries, syncError: errorMsg });
                    await db.orders.where('uuid').equals(order.uuid).delete();
                } else {
                    await db.orders.where('uuid').equals(order.uuid).modify({
                        status: 'completed',
                        syncRetries: newRetries,
                        syncError: errorMsg,
                    });
                }
                
                await logSync(order.uuid, 'sync_failed', errorMsg);
                result.failed++;
                result.errors.push(`Order ${order.uuid.slice(0, 8)}: ${errorMsg}`);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown sync error';
            // Silenced in production
            const newRetries = (order.syncRetries || 0) + 1;
            
            if (newRetries >= MAX_RETRIES) {
                await db.failedOrders.put({ ...order, status: 'sync_failed', syncRetries: newRetries, syncError: errorMsg });
                await db.orders.where('uuid').equals(order.uuid).delete();
            } else {
                await db.orders.where('uuid').equals(order.uuid).modify({
                    status: 'completed',
                    syncRetries: newRetries,
                    syncError: errorMsg,
                });
            }
            
            await logSync(order.uuid, 'sync_failed', errorMsg);
            result.failed++;
            result.errors.push(`Order ${order.uuid.slice(0, 8)}: ${errorMsg}`);
        }
    }

    return result;
}

/**
 * Get count of orders pending sync.
 */
export async function getPendingSyncCount(): Promise<number> {
    return db.orders
        .where('status')
        .anyOf(['completed', 'sync_failed'])
        .filter((o) => o.syncRetries < MAX_RETRIES)
        .count();
}

/**
 * Get sync logs for a specific order.
 */
export async function getSyncLogs(orderUuid: string): Promise<SyncLog[]> {
    return db.syncLogs
        .where('orderUuid')
        .equals(orderUuid)
        .reverse()
        .sortBy('timestamp');
}

/**
 * Force retry a specific failed order.
 */
export async function retryOrder(orderUuid: string): Promise<void> {
    const failedOrder = await db.failedOrders.where('uuid').equals(orderUuid).first();
    if (failedOrder) {
        await db.orders.put({
            ...failedOrder,
            status: 'completed',
            syncRetries: 0,
            syncError: undefined,
        });
        await db.failedOrders.where('uuid').equals(orderUuid).delete();
    } else {
        await db.orders.where('uuid').equals(orderUuid).modify({
            status: 'completed',
            syncRetries: 0,
            syncError: undefined,
        });
    }
}
