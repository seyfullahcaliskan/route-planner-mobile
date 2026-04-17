import { confirmRouteImport, previewRouteImport } from '@/src/api/importService';
import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useRouteImportStore } from '@/src/store/useRouteImportStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { spacing, typography } from '@/src/theme';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEMO_USER_ID = '1c34b887-83a4-4983-9954-12bca2aa2ce1';

export default function ImportPreviewScreen() {
  const { colors } = useAppTheme();
  const { navigationProvider } = useSettingsStore();
  const { title, description, stops, removeStop, clearAll } = useRouteImportStore();
  const styles = createStyles(colors);

  const payload = {
    userId: DEMO_USER_ID,
    title,
    description,
    routeDate: new Date().toISOString().slice(0, 10),
    startAddress: 'Başlangıç Noktası',
    endAddress: 'Bitiş Noktası',
    useTolls: false,
    useHighways: true,
    useTraffic: true,
    optimizationType: 'FASTEST' as const,
    navigationProvider,
    stops,
  };

  const previewQuery = useQuery({
    queryKey: ['routeImportPreview', title, description, stops, navigationProvider],
    queryFn: () => previewRouteImport(payload),
    enabled: stops.length > 0 && !!title.trim(),
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmRouteImport(payload),
    onSuccess: (data) => {
      clearAll();
      Alert.alert('Başarılı', 'Rota oluşturuldu.');
      router.replace({
        pathname: '/routes/[routePlanId]',
        params: { routePlanId: data.id },
      });
    },
    onError: () => {
      Alert.alert('Hata', 'Rota oluşturulamadı.');
    },
  });

  if (previewQuery.isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.helper}>Adresler kontrol ediliyor...</Text>
      </SafeAreaView>
    );
  }

  const preview = previewQuery.data;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={preview?.items ?? []}
        keyExtractor={(item) => `${item.rowNo}`}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <Text style={styles.title}>Önizleme ve Onay</Text>

            <AppCard>
              <Text style={styles.summaryText}>Toplam: {preview?.totalCount ?? 0}</Text>
              <Text style={styles.summaryText}>Geçerli: {preview?.validCount ?? 0}</Text>
              <Text style={styles.summaryText}>Hatalı: {preview?.invalidCount ?? 0}</Text>
            </AppCard>
          </View>
        }
        renderItem={({ item, index }) => (
          <AppCard style={styles.itemCard}>
            <View style={styles.itemTopRow}>
              <Text style={styles.itemTitle}>#{item.rowNo}</Text>

              <Pressable onPress={() => removeStop(index)} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>Sil</Text>
              </Pressable>
            </View>

            <Text style={styles.itemAddress}>{item.rawAddress}</Text>
            <Text style={[styles.itemStatus, { color: item.valid ? colors.success : colors.danger }]}>
              {item.validationMessage}
            </Text>
          </AppCard>
        )}
        ListFooterComponent={
          <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
            <PrimaryButton
              title={confirmMutation.isPending ? 'Oluşturuluyor...' : 'Rotayı Oluştur'}
              onPress={() => confirmMutation.mutate()}
              disabled={(preview?.invalidCount ?? 0) > 0 || confirmMutation.isPending}
            />

            <PrimaryButton
              title="Düzenlemeye Geri Dön"
              onPress={() =>
                router.push({
                  pathname: '/import',
                })
              }
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.page },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
    centered: {
      flex: 1,
      backgroundColor: colors.page,
      justifyContent: 'center',
      alignItems: 'center',
    },
    helper: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
    title: { ...typography.titleLarge, color: colors.text, marginBottom: spacing.sm },
    summaryText: { ...typography.body, color: colors.text, marginBottom: 6 },
    itemCard: { marginTop: spacing.md },
    itemTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    itemTitle: { ...typography.heading, color: colors.text },
    itemAddress: { ...typography.body, color: colors.text, marginBottom: 8 },
    itemStatus: { ...typography.bodySmall, fontWeight: '700' },
    removeButton: {
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButtonText: {
      ...typography.bodySmall,
      color: colors.danger,
      fontWeight: '700',
    },
  });