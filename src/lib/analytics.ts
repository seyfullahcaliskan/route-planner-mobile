import { Mixpanel } from 'mixpanel-react-native';

// Initialize (app/_layout.tsx içinde)
let mixpanel: Mixpanel | null = null;

export const initAnalytics = async (token: string) => {
    try {
        mixpanel = new Mixpanel(token, true);
        await mixpanel.init();
        console.log('[Analytics] Initialized');
    } catch (error) {
        console.error('[Analytics] Init error:', error);
    }
};

/**
 * Analytics event tracker
 * Tracks user behavior for product insights
 */

export const analytics = {
    // ------------------------------------------------------------------ //
    //  USER IDENTIFICATION
    // ------------------------------------------------------------------ //

    identify(userId: string, traits?: {
        email?: string;
        name?: string;
        role?: string;
        companyName?: string;
    }) {
        if (!mixpanel) return;
        mixpanel.identify(userId);
        if (traits) {
            mixpanel.getPeople().set(traits);
        }
        console.log('[Analytics] User identified:', userId);
    },

    // ------------------------------------------------------------------ //
    //  ROUTE EVENTS
    // ------------------------------------------------------------------ //

    routeCreated(routePlanId: string, stopCount: number) {
        if (!mixpanel) return;
        mixpanel.track('Route Created', {
            routePlanId,
            stopCount,
            timestamp: Date.now(),
        });
    },

    routeOptimized(routePlanId: string, stopCount: number, optimizationRound: number) {
        if (!mixpanel) return;
        mixpanel.track('Route Optimized', {
            routePlanId,
            stopCount,
            optimizationRound,
            timestamp: Date.now(),
        });
    },

    routeStarted(routePlanId: string, stopCount: number) {
        if (!mixpanel) return;
        mixpanel.track('Route Started', {
            routePlanId,
            stopCount,
            timestamp: Date.now(),
        });
    },

    routeCompleted(routePlanId: string, stopCount: number, durationMinutes: number) {
        if (!mixpanel) return;
        mixpanel.track('Route Completed', {
            routePlanId,
            stopCount,
            durationMinutes,
            timestamp: Date.now(),
        });
    },

    // ------------------------------------------------------------------ //
    //  STOP EVENTS
    // ------------------------------------------------------------------ //

    stopDelivered(stopId: string, sequenceNo: number) {
        if (!mixpanel) return;
        mixpanel.track('Stop Delivered', {
            stopId,
            sequenceNo,
            timestamp: Date.now(),
        });
    },

    stopSkipped(stopId: string, sequenceNo: number, reason?: string) {
        if (!mixpanel) return;
        mixpanel.track('Stop Skipped', {
            stopId,
            sequenceNo,
            reason,
            timestamp: Date.now(),
        });
    },

    stopFailed(stopId: string, sequenceNo: number, reason?: string) {
        if (!mixpanel) return;
        mixpanel.track('Stop Failed', {
            stopId,
            sequenceNo,
            reason,
            timestamp: Date.now(),
        });
    },

    // ------------------------------------------------------------------ //
    //  NAVIGATION EVENTS
    // ------------------------------------------------------------------ //

    navigationOpened(stopId: string, provider: 'GOOGLE_MAPS' | 'APPLE_MAPS' | 'WAZE') {
        if (!mixpanel) return;
        mixpanel.track('Navigation Opened', {
            stopId,
            provider,
            timestamp: Date.now(),
        });
    },

    // ------------------------------------------------------------------ //
    //  IMPORT EVENTS
    // ------------------------------------------------------------------ //

    stopsImported(routePlanId: string, method: 'CSV' | 'MANUAL' | 'PASTE', count: number) {
        if (!mixpanel) return;
        mixpanel.track('Stops Imported', {
            routePlanId,
            method,
            count,
            timestamp: Date.now(),
        });
    },

    // ------------------------------------------------------------------ //
    //  PHOTO EVENTS
    // ------------------------------------------------------------------ //

    photoUploaded(stopId: string, photoCount: number) {
        if (!mixpanel) return;
        mixpanel.track('Photo Uploaded', {
            stopId,
            photoCount,
            timestamp: Date.now(),
        });
    },

    signatureCaptured(stopId: string) {
        if (!mixpanel) return;
        mixpanel.track('Signature Captured', {
            stopId,
            timestamp: Date.now(),
        });
    },

    // ------------------------------------------------------------------ //
    //  APP EVENTS
    // ------------------------------------------------------------------ //

    appOpened() {
        if (!mixpanel) return;
        mixpanel.track('App Opened', {
            timestamp: Date.now(),
        });
    },

    appBackgrounded() {
        if (!mixpanel) return;
        mixpanel.track('App Backgrounded', {
            timestamp: Date.now(),
        });
    },

    errorOccurred(screen: string, error: string) {
        if (!mixpanel) return;
        mixpanel.track('Error Occurred', {
            screen,
            error,
            timestamp: Date.now(),
        });
    },
};

/**
 * Usage:
 * 
 * // App startup (app/_layout.tsx)
 * await initAnalytics('YOUR_MIXPANEL_TOKEN');
 * analytics.identify(userId, { email, name });
 * 
 * // Route created
 * analytics.routeCreated(routePlanId, 15);
 * 
 * // Stop delivered
 * analytics.stopDelivered(stopId, 3);
 * 
 * // Navigation opened
 * analytics.navigationOpened(stopId, 'GOOGLE_MAPS');
 */