import { InteractionManager } from 'react-native';

/**
 * Performance monitoring utilities
 * - Measure render times
 * - Track slow operations
 * - Detect performance bottlenecks
 */

export const performance = {
    /**
     * Measure async operation time
     */
    async measure<T>(
        name: string,
        operation: () => Promise<T>,
        warnThreshold = 1000 // ms
    ): Promise<T> {
        const start = Date.now();

        try {
            const result = await operation();
            const duration = Date.now() - start;

            if (duration > warnThreshold) {
                console.warn(`[Performance] Slow operation: ${name} took ${duration}ms`);
            } else {
                console.log(`[Performance] ${name} took ${duration}ms`);
            }

            return result;
        } catch (error) {
            const duration = Date.now() - start;
            console.error(`[Performance] ${name} failed after ${duration}ms`, error);
            throw error;
        }
    },

    /**
     * Run after interactions (animations) complete
     */
    runAfterInteractions(callback: () => void) {
        InteractionManager.runAfterInteractions(() => {
            callback();
        });
    },

    /**
     * Debounce function calls
     */
    debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: ReturnType<typeof setTimeout> | null = null;

        return (...args: Parameters<T>) => {
            if (timeout) clearTimeout(timeout);

            timeout = setTimeout(() => {
                func(...args);
            }, wait);
        };
    },

    /**
     * Throttle function calls
     */
    throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle = false;

        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => {
                    inThrottle = false;
                }, limit);
            }
        };
    },

    /**
     * Lazy load component
     */
    lazy<T>(
        importFunc: () => Promise<{ default: T }>,
        fallback?: React.ComponentType
    ) {
        // Use React.lazy in production
        // For now, simple wrapper
        return importFunc;
    },
};

/**
 * Usage:
 * 
 * // Measure API call
 * const routes = await performance.measure(
 *   'Fetch routes',
 *   () => api.get('/routes')
 * );
 * 
 * // Debounce search
 * const debouncedSearch = performance.debounce((query) => {
 *   searchStops(query);
 * }, 300);
 * 
 * // Throttle scroll handler
 * const throttledScroll = performance.throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 * 
 * // Run after animations
 * performance.runAfterInteractions(() => {
 *   loadHeavyData();
 * });
 */