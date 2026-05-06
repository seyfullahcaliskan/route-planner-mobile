// src/store/useAuthStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'APPLE';

export type AuthUser = {
    id: string;
    name: string;
    surname?: string | null;
    email: string;
    phoneNumber?: string | null;
    role?: 'ADMIN' | 'DISPATCHER' | 'COURIER';
    authProvider?: AuthProvider;
    avatarUrl?: string | null;
    emailVerified?: boolean;
};

type AuthState = {
    accessToken: string | null;
    refreshToken: string | null;
    accessTokenExpiresAt: number | null; // epoch millis
    refreshTokenExpiresAt: number | null;
    user: AuthUser | null;
    hydrated: boolean;

    setSession: (data: {
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt: number;
        refreshTokenExpiresAt: number;
        user: AuthUser;
    }) => void;
    setAccessToken: (data: { accessToken: string; accessTokenExpiresAt: number }) => void;
    setUser: (user: AuthUser) => void;
    clear: () => void;
    setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            user: null,
            hydrated: false,

            setSession: (data) =>
                set({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    accessTokenExpiresAt: data.accessTokenExpiresAt,
                    refreshTokenExpiresAt: data.refreshTokenExpiresAt,
                    user: data.user,
                }),

            setAccessToken: (data) =>
                set({
                    accessToken: data.accessToken,
                    accessTokenExpiresAt: data.accessTokenExpiresAt,
                }),

            setUser: (user) => set({ user }),

            clear: () =>
                set({
                    accessToken: null,
                    refreshToken: null,
                    accessTokenExpiresAt: null,
                    refreshTokenExpiresAt: null,
                    user: null,
                }),

            setHydrated: (v) => set({ hydrated: v }),
        }),
        {
            name: 'route-planner-auth',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                accessTokenExpiresAt: state.accessTokenExpiresAt,
                refreshTokenExpiresAt: state.refreshTokenExpiresAt,
                user: state.user,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
        }
    )
);

/** Refresh token'ın hâlâ geçerli olup olmadığını döner. */
export const isRefreshTokenValid = (state: AuthState): boolean => {
    if (!state.refreshToken || !state.refreshTokenExpiresAt) return false;
    return state.refreshTokenExpiresAt > Date.now();
};

export const isAccessTokenValid = (state: AuthState): boolean => {
    if (!state.accessToken || !state.accessTokenExpiresAt) return false;
    // 30 saniye buffer — yenilemeye fırsat ver
    return state.accessTokenExpiresAt > Date.now() + 30_000;
};