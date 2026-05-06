// app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { isRefreshTokenValid, useAuthStore } from '@/src/store/useAuthStore';

SplashScreen.preventAutoHideAsync().catch(() => { });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

/**
 * Auth state ↔ route hiyerarşisi senkronizasyonu.
 * setTimeout(0) ile navigation çağrısını sonraki tick'e erteliyoruz; bu sayede
 * navigator router store'a register olduktan sonra replace çalışıyor ve
 * "Attempted to navigate before mounting the Root Layout" hatası oluşmuyor.
 */
function AuthGate() {
  const router = useRouter();
  const segments = useSegments();

  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const refreshExpiresAt = useAuthStore((s) => s.refreshTokenExpiresAt);

  useEffect(() => {
    if (!hydrated) return;

    const sessionValid = isRefreshTokenValid({
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: refreshExpiresAt,
    } as any);

    const inAuthGroup = segments[0] === 'auth';

    const timer = setTimeout(() => {
      if (!sessionValid && !inAuthGroup) {
        router.replace('/auth/login');
      } else if (sessionValid && inAuthGroup) {
        router.replace('/(tabs)');
      }
      SplashScreen.hideAsync().catch(() => { });
    }, 0);

    return () => clearTimeout(timer);
  }, [hydrated, segments, accessToken, refreshToken, refreshExpiresAt, router]);

  return null;
}

export default function RootLayout() {
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.page }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.page },
            headerTitleStyle: { fontWeight: '700', color: colors.text },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.page },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen
            name="map-picker"
            options={{ title: t('mapPicker.title'), presentation: 'modal' }}
          />
          <Stack.Screen name="routes/[routePlanId]" options={{ title: t('route.detail') }} />
          <Stack.Screen name="import/index" options={{ title: t('import.title') }} />
          <Stack.Screen name="import/manual" options={{ title: t('import.manualTitle') }} />
          <Stack.Screen name="import/paste" options={{ title: t('import.pasteList') }} />
          <Stack.Screen name="import/csv" options={{ title: t('import.csvUpload') }} />
          <Stack.Screen name="import/preview" options={{ title: t('import.previewAndConfirm') }} />
        </Stack>
        <AuthGate />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}