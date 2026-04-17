import { api } from './client';

export type ImportStopItem = {
    externalReference?: string;
    customerName?: string;
    customerPhone?: string;
    rawAddress: string;
    priorityNo?: number;
    deliveryNote?: string;
};

export type RouteImportPreviewRequest = {
    userId: string;
    title: string;
    description?: string;
    routeDate?: string;
    startAddress?: string;
    startLatitude?: number;
    startLongitude?: number;
    endAddress?: string;
    endLatitude?: number;
    endLongitude?: number;
    useTolls: boolean;
    useHighways: boolean;
    useTraffic: boolean;
    optimizationType: 'FASTEST' | 'SHORTEST' | 'BALANCED';
    navigationProvider: 'GOOGLE_MAPS' | 'YANDEX_MAPS' | 'APPLE_MAPS';
    stops: ImportStopItem[];
};

export const previewRouteImport = async (payload: RouteImportPreviewRequest) => {
    const response = await api.post('/route-imports/preview', payload);
    return response.data;
};

export const confirmRouteImport = async (payload: RouteImportPreviewRequest) => {
    const response = await api.post('/route-imports/confirm', payload);
    return response.data;
};