"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { db } from "@/lib/db"
import { createPOSInvoice } from "@/app/actions/pos"

export function useSyncWorker(intervalMs = 30000) {
    const [isOnline, setIsOnline] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
    const syncLock = useRef(false)

    // Monitor Online/Offline Status
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        setIsOnline(navigator.onLine);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Main Synchronization logic
    const attemptSync = useCallback(async () => {
        // Prevent concurrent syncs or syncing while offline
        if (!navigator.onLine || syncLock.current) return;
        
        syncLock.current = true;
        setIsSyncing(true);

        try {
            // Find unsynced orders
            const pendingOrders = await db.orders
                .where("status")
                .anyOf(["completed", "sync_failed"])
                .toArray();

            for (const order of pendingOrders) {
                // Skip if max retries hit (require manual intervention)
                if (order.syncRetries >= 5) continue;

                // Format data for server action
                const formData = new FormData();
                
                // Map CartItems to action expecting shape {itemId, qty, rate, discount}
                const formattedItems = order.products.map(item => ({
                    itemId: item.productId,
                    qty: item.quantity,
                    rate: item.price,
                    discount: item.discount || 0
                }));

                formData.append("items", JSON.stringify(formattedItems));
                formData.append("paymentMode", order.paymentMode);
                formData.append("paidAmount", String(order.paidAmount));
                formData.append("posUuid", order.uuid);
                formData.append("customerName", order.customerName); // Optional, if backend accepts it

                try {
                    const result = await createPOSInvoice(formData);

                    if (result.success) {
                        // Mark as synced
                        await db.orders.update(order.id!, {
                            status: "synced",
                            syncedAt: new Date(),
                            syncError: undefined
                        });
                    } else {
                        // Mark as failed
                        await db.orders.update(order.id!, {
                            status: "sync_failed",
                            syncRetries: (order.syncRetries || 0) + 1,
                            syncError: result.error || "Unknown server error"
                        });
                    }
                } catch (err: unknown) {
                    // Network or unhandled failure
                    const errorMsg = err instanceof Error ? err.message : String(err);
                    await db.orders.update(order.id!, {
                        status: "sync_failed",
                        syncRetries: (order.syncRetries || 0) + 1,
                        syncError: errorMsg
                    });
                }
            }
        } catch (error) {
            console.error("[SyncWorker] Critical sync loop failure:", error);
        } finally {
            setIsSyncing(false);
            syncLock.current = false;
        }
    }, []);

    // Interval to trigger sync automatically
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Try immediately on load or component mount
        attemptSync();

        // And try every interval
        const timer = setInterval(() => {
            attemptSync();
        }, intervalMs);

        // Also attempt sync immediately when we come back online
        const handleOnlineTrigger = () => {
            attemptSync();
        };
        window.addEventListener("online", handleOnlineTrigger);

        return () => {
            clearInterval(timer);
            window.removeEventListener("online", handleOnlineTrigger);
        };
    }, [attemptSync, intervalMs]);

    return {
        isOnline,
        isSyncing,
        manualSync: attemptSync // For allowing users to trigger it explicitly via a "Sync Now" button
    };
}
