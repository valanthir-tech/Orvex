'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Real online/offline detection hook.
 * Uses navigator.onLine + event listeners.
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true);

    const handleOnline = useCallback(() => setIsOnline(true), []);
    const handleOffline = useCallback(() => setIsOnline(false), []);

    useEffect(() => {
        // Set initial state
        setIsOnline(navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [handleOnline, handleOffline]);

    return isOnline;
}
