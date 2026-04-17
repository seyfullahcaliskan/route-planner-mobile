import { useSettingsStore } from '../store/useSettingsStore';
import { RoutePlanResponse, RouteStopResponse } from '../types/route';
import { api } from './client';

const DEMO_USER_ID = '1c34b887-83a4-4983-9954-12bca2aa2ce1';

export const getUserRoutes = async (): Promise<RoutePlanResponse[]> => {
    const response = await api.get(`/route-plans/user/${DEMO_USER_ID}`);
    return response.data;
};

export const getRouteStops = async (routePlanId: string): Promise<RouteStopResponse[]> => {
    const response = await api.get(`/route-plans/${routePlanId}/stops`);
    return response.data;
};

export const deliverStop = async (routeStopId: string): Promise<RouteStopResponse> => {
    const response = await api.post(`/route-stops/${routeStopId}/deliver`, {
        note: 'Mobil teslim onayı',
    });
    return response.data;
};

export const skipStop = async (routeStopId: string): Promise<RouteStopResponse> => {
    const response = await api.post(`/route-stops/${routeStopId}/skip`, {
        note: 'Mobil skip',
    });
    return response.data;
};

export const failStop = async (routeStopId: string): Promise<RouteStopResponse> => {
    const response = await api.post(`/route-stops/${routeStopId}/fail`, {
        note: 'Mobil fail',
    });
    return response.data;
};

export const getNavigationUrl = async (
    routeStopId: string
): Promise<{ navigationUrl: string }> => {
    const navigationProvider = useSettingsStore.getState().navigationProvider;

    const response = await api.get(
        `/route-stops/${routeStopId}/navigation-url`,
        {
            params: {
                provider: navigationProvider,
            },
        }
    );

    return response.data;
};

export const reoptimizeRoute = async (routePlanId: string): Promise<RouteStopResponse[]> => {
    const response = await api.post(`/route-plans/${routePlanId}/reoptimize`, {
        includeSkippedStops: true,
        includeFailedStops: false,
        includePostponedStops: true,
        note: 'Mobil yeniden sıralama',
    });
    return response.data;
};