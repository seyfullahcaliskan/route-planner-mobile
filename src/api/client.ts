// src/api/client.ts
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Geliştirme:
 *   - Android emulator: 10.0.2.2 → host machine
 *   - iOS simulator: localhost
 *   - Fiziksel cihaz: kendi LAN IP'in (örn. 192.168.1.42)
 *
 * Production: env'den oku.
 */
const DEV_BASE_URL =
    Platform.OS === 'android' ? 'http://10.0.2.2:8080/api/v1' : 'http://localhost:8080/api/v1';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_BASE_URL;

/** Auth header KOYMAYAN ham client (login/register/refresh için). */
export const rawApi = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

/** Tüm korumalı çağrılar için kullanılan, auth header otomatik koyan client. */
export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

// --- Request interceptor: access token ekle ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Response interceptor: 401'de tek seferlik refresh ---
type RetriableConfig = AxiosRequestConfig & { _retried?: boolean };

let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
    const state = useAuthStore.getState();
    const refreshToken = state.refreshToken;
    if (!refreshToken) return null;

    try {
        const res = await rawApi.post('/auth/refresh', { refreshToken });
        const data = res.data as {
            accessToken: string;
            refreshToken: string;
            accessTokenExpiresAt: number;
            refreshTokenExpiresAt: number;
            user: any;
        };
        useAuthStore.getState().setSession({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            accessTokenExpiresAt: data.accessTokenExpiresAt,
            refreshTokenExpiresAt: data.refreshTokenExpiresAt,
            user: data.user,
        });
        return data.accessToken;
    } catch (e) {
        // refresh de başarısız ⇒ kullanıcıyı çıkışa zorla
        useAuthStore.getState().clear();
        return null;
    }
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as RetriableConfig | undefined;
        if (!original || error.response?.status !== 401 || original._retried) {
            return Promise.reject(error);
        }

        // Refresh çağrısı sırasında oluşan 401'lerde retry yapma
        const url = original.url || '';
        if (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register')) {
            return Promise.reject(error);
        }

        original._retried = true;

        if (!refreshPromise) {
            refreshPromise = performRefresh().finally(() => {
                refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;
        if (!newToken) {
            return Promise.reject(error);
        }
        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${newToken}`;
        return api.request(original);
    }
);