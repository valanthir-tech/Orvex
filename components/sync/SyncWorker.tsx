
"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNetwork } from '@/hooks/use-network';
import { useSyncStore } from '@/stores/sync-store';
import { syncPendingOrders, getPendingSyncCount } from '@/lib/sync-engine';
import { toast } from 'sonner';

const POLL_INTERVAL_MS = 30_000;   // Check every 30s when idle
const RETRY_MIN_INTERVAL_MS = 5_000; // Min gap between sync cycles

export default function SyncWorker() {
    const router = useRouter();
    const isOnline = useNetwork();
    const { setStatus, setPendingCount, setError, setLastSyncedAt } = useSyncStore();
    const isSyncingRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Update pending count periodically
    useEffect(() => {
        const checkPending = async () => {
            try {
                const count = await getPendingSyncCount();
                setPendingCount(count);
            } catch {
                // Dexie not ready yet
            }
        };

        checkPending();
        const interval = setInterval(checkPending, 5_000);
        return () => clearInterval(interval);
    }, [setPendingCount]);

    // Core sync logic — delegates to sync-engine which handles retries/logging
    const performSync = useCallback(async () => {
        if (!isOnline || isSyncingRef.current) return;

        isSyncingRef.current = true;
        setStatus('SYNCING');

        try {
            const result = await syncPendingOrders();

            if (result.synced > 0) {
                setLastSyncedAt(new Date());
                toast.success(`Synced ${result.synced} order(s)`);
                // Refresh server components (dashboard/RSC cache) without a full page reload
                router.refresh();
            }

            if (result.failed > 0) {
                setError(result.errors[0] || 'Some orders failed to sync');
            }

            const remaining = await getPendingSyncCount();
            setPendingCount(remaining);

            if (remaining > 0) {
                setStatus('IDLE');
                // Schedule next attempt
                timerRef.current = setTimeout(() => {
                    isSyncingRef.current = false;
                    performSync();
                }, RETRY_MIN_INTERVAL_MS);
                return;
            }

            setStatus(result.failed > 0 ? 'ERROR' : 'SUCCESS');
            setTimeout(() => setStatus('IDLE'), 3000);
        } catch (err: any) {
            console.error('[SyncWorker] Error:', err instanceof Error ? err.message : String(err));
            setStatus('ERROR');
            setError(err?.message || 'Unknown sync error');
        } finally {
            isSyncingRef.current = false;
        }
    }, [isOnline, setStatus, setLastSyncedAt, setError, setPendingCount, router]);

    // Trigger sync when coming online
    useEffect(() => {
        if (isOnline && !isSyncingRef.current) {
            performSync();
        }
    }, [isOnline, performSync]);

    // Periodic sync poll when online
    useEffect(() => {
        if (!isOnline) return;

        const interval = setInterval(() => {
            if (!isSyncingRef.current) {
                performSync();
            }
        }, POLL_INTERVAL_MS);

        return () => {
            clearInterval(interval);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isOnline, performSync]);

    return null; // Headless component
}
