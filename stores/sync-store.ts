
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SyncStatus = 'IDLE' | 'SYNCING' | 'ERROR' | 'SUCCESS';

interface SyncState {
    status: SyncStatus;
    lastSyncedAt: Date | null;
    pendingCount: number;
    error: string | null;

    setStatus: (status: SyncStatus) => void;
    setLastSyncedAt: (date: Date) => void;
    setPendingCount: (count: number) => void;
    setError: (error: string | null) => void;

    // Actions
    reset: () => void;
}

export const useSyncStore = create<SyncState>()(
    persist(
        (set) => ({
            status: 'IDLE',
            lastSyncedAt: null,
            pendingCount: 0,
            error: null,

            setStatus: (status) => set({ status }),
            setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
            setPendingCount: (pendingCount) => set({ pendingCount }),
            setError: (error) => set({ error }),

            reset: () => set({ status: 'IDLE', error: null }),
        }),
        {
            name: 'pos-sync-storage',
            // Only persist specific fields if needed, but persisting all is fine for now
        }
    )
);
