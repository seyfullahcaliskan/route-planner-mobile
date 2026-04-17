import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React from 'react';

const queryClient = new QueryClient();

export default function RootLayout() {
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
}