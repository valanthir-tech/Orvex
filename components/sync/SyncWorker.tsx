
"use client";

import { useEffect, useCallback } from 'react';
import { useNetwork } from '@/hooks/use-network';
import { useSyncStore } from '@/stores/sync-store';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export default function SyncWorker() {
    const isOnline = useNetwork();
    const { status, setStatus, setPendingCount, setError, setLastSyncedAt } = useSyncStore();

    // Check for pending orders count frequently
    useEffect(() => {
        const checkPending = async () => {
            if (!db) return;
            // 'status' is a reserved word in some Dexie contexts, but here it's our field
            // We assume orders with status != 'SYNCED' are pending.
            // Note: Dexie filtering on '!=', need to use filter().
            const count = await db.orders
                .filter(order => order.status !== 'synced')
                .count();
            setPendingCount(count);
        };

        checkPending();
        const interval = setInterval(checkPending, 5000); // Check every 5s
        return () => clearInterval(interval);
    }, [setPendingCount]);

    // The Sync Logic
    const performSync = useCallback(async () => {
        if (!isOnline) return;

        try {
            // 1. Get Pending Orders
            const pendingOrders = await db.orders
                .filter(order => order.status !== 'synced')
                .limit(50) // Batch size
                .toArray();

            if (pendingOrders.length === 0) {
                setStatus('IDLE');
                return;
            }

            setStatus('SYNCING');

            // 2. Send to API
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connectionId: crypto.randomUUID(),
                    orders: pendingOrders.map(o => ({
                        ...o,
                        status: o.status.toUpperCase() // Map 'completed' -> 'COMPLETED' for API
                    }))
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Sync failed');
            }

            // 3. Update Dexie on Success
            // We iterate through the successfully synced IDs and update their status
            if (result.syncedIds && Array.isArray(result.syncedIds)) {
                await db.orders
                    .where('uuid')
                    .anyOf(result.syncedIds)
                    .modify({ status: 'synced', syncedAt: new Date() });

                setLastSyncedAt(new Date());
                toast.success(`Synced ${result.syncedCount} orders to cloud`);
            }

            setStatus('SUCCESS');

            // Re-trigger sync if there might be more
            const remaining = await db.orders.filter(o => o.status !== 'synced').count();
            if (remaining > 0) {
                setTimeout(performSync, 1000); // Backoff slightly
            } else {
                setTimeout(() => setStatus('IDLE'), 2000);
            }

        } catch (err: any) {
            console.error("Sync Error:", err);
            setStatus('ERROR');
            setError(err.message);
            // toast.error("Sync failed: " + err.message); // Optional: Don't spam user
        }
    }, [isOnline, setStatus, setLastSyncedAt, setError]);

    // Trigger sync when coming online
    useEffect(() => {
        if (isOnline) {
            performSync();
        }
    }, [isOnline, performSync]);

    // Trigger sync periodically if online
    useEffect(() => {
        if (!isOnline) return;
        const interval = setInterval(() => {
            if (status !== 'SYNCING') {
                performSync();
            }
        }, 60000); // Try every minute
        return () => clearInterval(interval);
    }, [isOnline, status, performSync]);

    return null; // Headless component
}
