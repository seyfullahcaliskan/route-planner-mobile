export type RoutePlanResponse = {
    id: string;
    userId: string;
    title: string;
    description?: string;
    routeDate?: string;
    startAddress?: string;
    endAddress?: string;
    useTolls: boolean;
    useHighways: boolean;
    useTraffic: boolean;
    optimizationType: 'FASTEST' | 'SHORTEST' | 'BALANCED';
    navigationProvider: 'GOOGLE_MAPS' | 'YANDEX_MAPS' | 'APPLE_MAPS';
    planStatus: 'DRAFT' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    totalStopCount: number;
    completedStopCount: number;
    failedStopCount: number;
    skippedStopCount: number;
};

export type RouteStopResponse = {
    id: string;
    externalReference?: string;
    customerName?: string;
    customerPhone?: string;
    rawAddress: string;
    normalizedAddress?: string;
    latitude?: number;
    longitude?: number;
    sequenceNo: number;
    previousSequenceNo?: number;
    optimizationRound: number;
    priorityNo: number;
    deliveryNote?: string;
    stopStatus: 'PENDING' | 'NAVIGATING' | 'ARRIVED' | 'DELIVERED' | 'FAILED' | 'SKIPPED' | 'POSTPONED';
    navigationUrl?: string;
};