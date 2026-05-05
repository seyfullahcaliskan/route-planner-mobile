import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React from 'react';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://92648e07c670e165d38a85212586be63@o4511331992338432.ingest.de.sentry.io/4511331992862800',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const queryClient = new QueryClient();

export default Sentry.wrap(function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: '#F2F2F7',
          },
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerTintColor: '#111827',
          contentStyle: {
            backgroundColor: '#F2F2F7',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="routes/[routePlanId]" options={{ title: 'Rota Detayı' }} />
        <Stack.Screen name="import/index" options={{ title: 'Yeni Rota' }} />
        <Stack.Screen name="import/manual" options={{ title: 'Tek Tek Adres Ekle' }} />
        <Stack.Screen name="import/paste" options={{ title: 'Toplu Yapıştır' }} />
        <Stack.Screen name="import/csv" options={{ title: 'CSV Yükle' }} />
        <Stack.Screen name="import/preview" options={{ title: 'Önizleme ve Onay' }} />
      </Stack>
    </QueryClientProvider>
  );
});