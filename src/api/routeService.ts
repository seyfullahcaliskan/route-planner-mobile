// src/api/routeService.ts
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { RoutePlanResponse, RouteStopResponse } from '../types/route';
import { api } from './client';

const requireUserId = (): string => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
    }
    return userId;
};

export const getUserRoutes = async (): Promise<RoutePlanResponse[]> => {
    const userId = requireUserId();
    const response = await api.get(`/route-plans/user/${userId}`);
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
    const response = await api.get(`/route-stops/${routeStopId}/navigation-url`, {
        params: { provider: navigationProvider },
    });
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