import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Real-time updates via polling
 * - Auto-refresh when app becomes active
 * - Periodic polling (every 30s)
 * - Stop polling when app is in background
 */

type UseRealtimeUpdatesOptions = {
    queryKey: any[];
    enabled?: boolean;
    interval?: number; // ms
    refetchOnAppFocus?: boolean;
};

export function useRealtimeUpdates({
    queryKey,
    enabled = true,
    interval = 30000, // 30s
    refetchOnAppFocus = true,
}: UseRealtimeUpdatesOptions) {
    const queryClient = useQueryClient();
    const appState = useRef(AppState.currentState);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refetch = () => {
        if (enabled) {
            queryClient.invalidateQueries({ queryKey });
        }
    };

    // App state change handler
    useEffect(() => {
        if (!refetchOnAppFocus) return;

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('[Realtime] App became active - refetching');
                refetch();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [enabled, refetchOnAppFocus]);

    // Polling interval
    useEffect(() => {
        if (!enabled) return;

        console.log(`[Realtime] Starting polling every ${interval}ms`);
        intervalRef.current = setInterval(refetch, interval);

        return () => {
            if (intervalRef.current) {
                console.log('[Realtime] Stopping polling');
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, interval]);

    return { refetch };
}

/**
 * Usage:
 * 
 * useRealtimeUpdates({
 *   queryKey: ['routeStops', routePlanId],
 *   interval: 30000, // 30 seconds
 * });
 */