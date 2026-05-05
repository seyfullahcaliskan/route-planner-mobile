import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_KEYS = {
    ROUTES: '@routes',
    STOPS: '@stops_',
    PENDING_ACTIONS: '@pending_actions',
    USER: '@user',
    LAST_SYNC: '@last_sync',
};

const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Offline-first storage manager
 * - Cache API responses
 * - Queue offline actions
 * - Sync when online
 */

export const offlineStorage = {
    // ------------------------------------------------------------------ //
    //  CACHE MANAGEMENT
    // ------------------------------------------------------------------ //

    async cacheRoutes(routes: any[]) {
        try {
            await AsyncStorage.setItem(
                CACHE_KEYS.ROUTES,
                JSON.stringify({
                    data: routes,
                    timestamp: Date.now(),
                })
            );
        } catch (error) {
            console.error('[Offline] Cache routes error:', error);
        }
    },

    async getCachedRoutes(): Promise<any[] | null> {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEYS.ROUTES);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);

            // Check expiry
            if (Date.now() - timestamp > CACHE_EXPIRY) {
                await AsyncStorage.removeItem(CACHE_KEYS.ROUTES);
                return null;
            }

            return data;
        } catch (error) {
            console.error('[Offline] Get cached routes error:', error);
            return null;
        }
    },

    async cacheStops(routePlanId: string, stops: any[]) {
        try {
            await AsyncStorage.setItem(
                `${CACHE_KEYS.STOPS}${routePlanId}`,
                JSON.stringify({
                    data: stops,
                    timestamp: Date.now(),
                })
            );
        } catch (error) {
            console.error('[Offline] Cache stops error:', error);
        }
    },

    async getCachedStops(routePlanId: string): Promise<any[] | null> {
        try {
            const cached = await AsyncStorage.getItem(`${CACHE_KEYS.STOPS}${routePlanId}`);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);

            if (Date.now() - timestamp > CACHE_EXPIRY) {
                await AsyncStorage.removeItem(`${CACHE_KEYS.STOPS}${routePlanId}`);
                return null;
            }

            return data;
        } catch (error) {
            console.error('[Offline] Get cached stops error:', error);
            return null;
        }
    },

    // ------------------------------------------------------------------ //
    //  OFFLINE ACTIONS QUEUE
    // ------------------------------------------------------------------ //

    async queueAction(action: {
        type: 'DELIVER' | 'SKIP' | 'FAIL' | 'REOPTIMIZE';
        stopId?: string;
        routePlanId?: string;
        payload?: any;
        timestamp: number;
    }) {
        try {
            const queue = await this.getPendingActions();
            queue.push(action);
            await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(queue));
            console.log('[Offline] Action queued:', action.type);
        } catch (error) {
            console.error('[Offline] Queue action error:', error);
        }
    },

    async getPendingActions(): Promise<any[]> {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
            return cached ? JSON.parse(cached) : [];
        } catch (error) {
            console.error('[Offline] Get pending actions error:', error);
            return [];
        }
    },

    async clearPendingActions() {
        try {
            await AsyncStorage.removeItem(CACHE_KEYS.PENDING_ACTIONS);
        } catch (error) {
            console.error('[Offline] Clear pending actions error:', error);
        }
    },

    // ------------------------------------------------------------------ //
    //  SYNC MANAGER
    // ------------------------------------------------------------------ //

    async syncPendingActions(apiClient: any) {
        const isOnline = await this.isOnline();
        if (!isOnline) {
            console.log('[Offline] Cannot sync - offline');
            return;
        }

        const queue = await this.getPendingActions();
        if (queue.length === 0) {
            console.log('[Offline] No pending actions to sync');
            return;
        }

        console.log(`[Offline] Syncing ${queue.length} pending actions...`);

        const failed: any[] = [];

        for (const action of queue) {
            try {
                switch (action.type) {
                    case 'DELIVER':
                        await apiClient.post(`/route-stops/${action.stopId}/deliver`, action.payload);
                        break;
                    case 'SKIP':
                        await apiClient.post(`/route-stops/${action.stopId}/skip`, action.payload);
                        break;
                    case 'FAIL':
                        await apiClient.post(`/route-stops/${action.stopId}/fail`, action.payload);
                        break;
                    case 'REOPTIMIZE':
                        await apiClient.post(`/route-plans/${action.routePlanId}/reoptimize`, action.payload);
                        break;
                }
                console.log('[Offline] Synced:', action.type);
            } catch (error) {
                console.error('[Offline] Sync failed:', action.type, error);
                failed.push(action);
            }
        }

        if (failed.length > 0) {
            await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(failed));
        } else {
            await this.clearPendingActions();
        }

        await this.setLastSync();
    },

    // ------------------------------------------------------------------ //
    //  NETWORK STATUS
    // ------------------------------------------------------------------ //

    async isOnline(): Promise<boolean> {
        const netInfo = await NetInfo.fetch();
        return netInfo.isConnected ?? false;
    },

    subscribeToNetworkChanges(callback: (isOnline: boolean) => void) {
        return NetInfo.addEventListener((state) => {
            callback(state.isConnected ?? false);
        });
    },

    // ------------------------------------------------------------------ //
    //  SYNC METADATA
    // ------------------------------------------------------------------ //

    async setLastSync() {
        try {
            await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
        } catch (error) {
            console.error('[Offline] Set last sync error:', error);
        }
    },

    async getLastSync(): Promise<number | null> {
        try {
            const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
            return lastSync ? parseInt(lastSync, 10) : null;
        } catch (error) {
            console.error('[Offline] Get last sync error:', error);
            return null;
        }
    },

    // ------------------------------------------------------------------ //
    //  CLEAR ALL CACHE
    // ------------------------------------------------------------------ //

    async clearAll() {
        try {
            await AsyncStorage.clear();
            console.log('[Offline] All cache cleared');
        } catch (error) {
            console.error('[Offline] Clear all error:', error);
        }
    },
};

/**
 * Usage Example:
 * 
 * // Cache routes after fetch
 * const routes = await api.get('/routes');
 * await offlineStorage.cacheRoutes(routes.data);
 * 
 * // Get cached routes when offline
 * const cached = await offlineStorage.getCachedRoutes();
 * 
 * // Queue action when offline
 * if (!isOnline) {
 *   await offlineStorage.queueAction({
 *     type: 'DELIVER',
 *     stopId: 'uuid',
 *     payload: { note: 'Delivered' },
 *     timestamp: Date.now(),
 *   });
 * }
 * 
 * // Sync when back online
 * await offlineStorage.syncPendingActions(api);
 */