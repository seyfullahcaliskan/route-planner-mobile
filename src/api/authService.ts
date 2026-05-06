// src/api/authService.ts
import { Platform } from 'react-native';
import { AuthProvider, AuthUser } from '../store/useAuthStore';
import { rawApi } from './client';

export type AuthResponse = {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
    refreshTokenExpiresAt: number;
    tokenType: string;
    user: AuthUser;
};

const buildDeviceLabel = () => {
    return `${Platform.OS} ${Platform.Version ?? ''}`.trim();
};

export const registerApi = async (payload: {
    name: string;
    surname?: string;
    email: string;
    password: string;
    phoneNumber?: string;
}): Promise<AuthResponse> => {
    const res = await rawApi.post<AuthResponse>('/auth/register', {
        ...payload,
        deviceLabel: buildDeviceLabel(),
    });
    return res.data;
};

export const loginApi = async (payload: {
    email: string;
    password: string;
}): Promise<AuthResponse> => {
    const res = await rawApi.post<AuthResponse>('/auth/login', {
        ...payload,
        deviceLabel: buildDeviceLabel(),
    });
    return res.data;
};

export const oauthLoginApi = async (payload: {
    provider: AuthProvider;
    idToken: string;
    fallbackEmail?: string;
    fallbackName?: string;
}): Promise<AuthResponse> => {
    const res = await rawApi.post<AuthResponse>('/auth/oauth', {
        ...payload,
        deviceLabel: buildDeviceLabel(),
    });
    return res.data;
};

export const refreshApi = async (refreshToken: string): Promise<AuthResponse> => {
    const res = await rawApi.post<AuthResponse>('/auth/refresh', { refreshToken });
    return res.data;
};

export const logoutApi = async (refreshToken: string): Promise<void> => {
    try {
        await rawApi.post('/auth/logout', { refreshToken });
    } catch {
        // Sunucu down olsa bile lokal çıkışa engel olma
    }
};