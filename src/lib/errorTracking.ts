import * as Sentry from '@sentry/react-native';

/**
 * Production error tracking with Sentry
 * - Automatic crash reporting
 * - Performance monitoring
 * - Breadcrumbs for debugging
 */

export const initErrorTracking = () => {
    if (__DEV__) {
        console.log('[Sentry] Skipping init in development');
        return;
    }

    Sentry.init({
        dsn: 'YOUR_SENTRY_DSN_HERE',

        // Performance Monitoring
        tracesSampleRate: 0.1, // 10% of transactions

        // Environment
        environment: __DEV__ ? 'development' : 'production',

        // Release tracking
        release: 'route-planner-mobile@1.0.0',
        dist: '1',

        // Enable performance monitoring
        enableAutoPerformanceTracing: true,
        enableAutoSessionTracking: true,

        // Filtering
        beforeSend(event, hint) {
            // Filter out known errors
            if (event.exception?.values?.[0]?.value?.includes('Network request failed')) {
                return null; // Don't send network errors
            }
            return event;
        },
    });

    console.log('[Sentry] Initialized');
};

/**
 * Error tracking utilities
 */

export const errorTracking = {
    /**
     * Set user context for error reports
     */
    setUser(userId: string, email?: string, username?: string) {
        Sentry.setUser({
            id: userId,
            email,
            username,
        });
    },

    /**
     * Clear user context (logout)
     */
    clearUser() {
        Sentry.setUser(null);
    },

    /**
     * Add breadcrumb (navigation, user action)
     */
    addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
        Sentry.addBreadcrumb({
            message,
            category,
            data,
            level: 'info',
            timestamp: Date.now(),
        });
    },

    /**
     * Capture handled exception
     */
    captureException(error: Error, context?: Record<string, any>) {
        Sentry.captureException(error, {
            contexts: {
                app: context,
            },
        });
    },

    /**
     * Capture message (warning/info)
     */
    captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
        Sentry.captureMessage(message, level);
    },

    /**
     * Set tag for filtering
     */
    setTag(key: string, value: string) {
        Sentry.setTag(key, value);
    },

    /**
     * Set context data
     */
    setContext(key: string, context: Record<string, any>) {
        Sentry.setContext(key, context);
    },

    /**
     * Performance monitoring with spans
     */
    startSpan<T>(name: string, op: string, callback: () => T): T {
        return Sentry.startSpan(
            {
                name,
                op,
            },
            callback
        );
    },

    /**
     * Async performance monitoring
     */
    async startSpanAsync<T>(name: string, op: string, callback: () => Promise<T>): Promise<T> {
        return Sentry.startSpan(
            {
                name,
                op,
            },
            callback
        );
    },
};

/**
 * Usage:
 * 
 * // App startup (app/_layout.tsx)
 * initErrorTracking();
 * errorTracking.setUser(userId, email);
 * 
 * // Navigation breadcrumb
 * errorTracking.addBreadcrumb('Navigate to route detail', 'navigation', {
 *   routePlanId: 'uuid',
 * });
 * 
 * // Capture exception
 * try {
 *   await deliverStop(id);
 * } catch (error) {
 *   errorTracking.captureException(error as Error, { stopId: id });
 * }
 * 
 * // Performance tracking - Sync
 * const result = errorTracking.startSpan('Route Optimization', 'task', () => {
 *   return optimizeRoute();
 * });
 * 
 * // Performance tracking - Async
 * const result = await errorTracking.startSpanAsync('API Call', 'http.client', async () => {
 *   return await api.get('/routes');
 * });
 */