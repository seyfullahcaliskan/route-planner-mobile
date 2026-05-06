// app/import/preview.tsx
import { confirmRouteImport, previewRouteImport } from '@/src/api/importService';
import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useRouteImportStore } from '@/src/store/useRouteImportStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { radius, shadows, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ImportPreviewScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { navigationProvider } = useSettingsStore();
  const userId = useAuthStore((s) => s.user?.id);

  const {
    title,
    description,
    stops,
    removeStop,
    updateStop,
    clearAll,
    startAddress,
    startLatitude,
    startLongitude,
    endAddress,
    endLatitude,
    endLongitude,
  } = useRouteImportStore();

  const styles = createStyles(colors);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [rawAddress, setRawAddress] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [priorityNo, setPriorityNo] = useState('0');

  /** Backend'e gönderilen payload — store'daki gerçek start/end ve lat/lng kullanılıyor. */
  const payload = useMemo(
    () => ({
      userId: userId ?? '',
      title,
      description,
      routeDate: new Date().toISOString().slice(0, 10),
      startAddress: startAddress.trim() || (
        startLatitude !== undefined && startLongitude !== undefined
          ? `${startLatitude.toFixed(5)}, ${startLongitude.toFixed(5)}`
          : ''
      ),
      startLatitude,
      startLongitude,
      endAddress: endAddress.trim() || undefined,
      endLatitude,
      endLongitude,
      useTolls: false,
      useHighways: true,
      useTraffic: true,
      optimizationType: 'FASTEST' as const,
      navigationProvider,
      stops,
    }),
    [
      userId, title, description, navigationProvider, stops,
      startAddress, startLatitude, startLongitude,
      endAddress, endLatitude, endLongitude,
    ]
  );

  const previewQuery = useQuery({
    queryKey: ['routeImportPreview', payload],
    queryFn: () => previewRouteImport(payload),
    enabled: !!userId && stops.length > 0 && !!title.trim(),
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmRouteImport(payload),
    onSuccess: (data) => {
      haptics.success();
      clearAll();
      Alert.alert(t('common.success'), t('import.createSuccess'));
      router.replace({
        pathname: '/routes/[routePlanId]',
        params: { routePlanId: data.id },
      });
    },
    onError: (e: any) => {
      haptics.error();
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        'Rota oluşturulamadı.';
      Alert.alert(t('common.error'), msg);
    },
  });

  useEffect(() => {
    if (editingIndex === null) return;
    const item = stops[editingIndex];
    if (!item) return;

    setCustomerName(item.customerName || '');
    setCustomerPhone(item.customerPhone || '');
    setRawAddress(item.rawAddress || '');
    setDeliveryNote(item.deliveryNote || '');
    setPriorityNo(String(item.priorityNo ?? 0));
  }, [editingIndex, stops]);

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    if (!rawAddress.trim()) {
      Alert.alert(t('common.warning'), t('import.addressEmpty'));
      return;
    }

    updateStop(editingIndex, {
      ...stops[editingIndex],
      customerName,
      customerPhone,
      rawAddress: rawAddress.trim(),
      deliveryNote,
      priorityNo: Number(priorityNo || '0'),
    });

    setEditingIndex(null);
  };

  const handleCloseModal = () => setEditingIndex(null);

  if (previewQuery.isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.helper}>Adresler kontrol ediliyor...</Text>
      </SafeAreaView>
    );
  }

  if (previewQuery.error) {
    return (
      <SafeAreaView style={styles.centered}>
        <AppCard>
          <Text style={styles.errorTitle}>{t('common.somethingWentWrong')}</Text>
          <Text style={styles.errorMsg}>
            {(previewQuery.error as any)?.response?.data?.message ||
              (previewQuery.error as any)?.message ||
              ''}
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <PrimaryButton
              title={t('common.back')}
              onPress={() => router.back()}
            />
          </View>
        </AppCard>
      </SafeAreaView>
    );
  }

  const preview = previewQuery.data;
  const allValid = (preview?.invalidCount ?? 0) === 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={preview?.items ?? []}
        keyExtractor={(item) => `${item.rowNo}`}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <Text style={styles.title}>{t('import.previewAndConfirm')}</Text>

            {/* Özet kart */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.summaryTotal]}>
                <Text style={styles.summaryNumber}>{preview?.totalCount ?? 0}</Text>
                <Text style={styles.summaryLabel}>Toplam</Text>
              </View>
              <View style={[styles.summaryCard, styles.summaryValid]}>
                <Text style={[styles.summaryNumber, { color: colors.success ?? '#22C55E' }]}>
                  {preview?.validCount ?? 0}
                </Text>
                <Text style={styles.summaryLabel}>Geçerli</Text>
              </View>
              <View style={[styles.summaryCard, styles.summaryInvalid]}>
                <Text style={[styles.summaryNumber, { color: colors.danger ?? '#EF4444' }]}>
                  {preview?.invalidCount ?? 0}
                </Text>
                <Text style={styles.summaryLabel}>Hatalı</Text>
              </View>
            </View>

            {/* Rota başlık + start/end mini özet */}
            <AppCard>
              <Text style={styles.routeTitle}>{title}</Text>
              {description ? (
                <Text style={styles.routeDesc}>{description}</Text>
              ) : null}

              <View style={styles.routePoints}>
                <View style={styles.routePointRow}>
                  <View style={[styles.routePointDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.routePointText} numberOfLines={1}>
                    {payload.startAddress}
                  </Text>
                </View>
                {payload.endAddress && (
                  <View style={styles.routePointRow}>
                    <View style={[styles.routePointDot, { backgroundColor: colors.success ?? '#22C55E' }]} />
                    <Text style={styles.routePointText} numberOfLines={1}>
                      {payload.endAddress}
                    </Text>
                  </View>
                )}
              </View>
            </AppCard>
          </View>
        }
        renderItem={({ item, index }) => (
          <AppCard style={styles.itemCard}>
            <View style={styles.itemTopRow}>
              <View style={styles.itemBadge}>
                <Text style={styles.itemBadgeText}>#{item.rowNo}</Text>
              </View>

              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => setEditingIndex(index)}
                  style={styles.editButton}
                >
                  <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                </Pressable>
                <Pressable onPress={() => removeStop(index)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>{t('common.delete')}</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.itemAddress}>{item.rawAddress}</Text>

            {item.normalizedAddress && item.normalizedAddress !== item.rawAddress ? (
              <Text style={styles.itemNormalized}>↳ {item.normalizedAddress}</Text>
            ) : null}

            {item.latitude && item.longitude ? (
              <Text style={styles.itemMeta}>
                📍 {Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}
              </Text>
            ) : null}

            {(stops[index]?.customerName || stops[index]?.customerPhone) ? (
              <Text style={styles.itemMeta}>
                {[stops[index]?.customerName, stops[index]?.customerPhone]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
            ) : null}

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.valid
                    ? (colors.success ?? '#22C55E') + '22'
                    : (colors.danger ?? '#EF4444') + '22',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: item.valid ? (colors.success ?? '#22C55E') : (colors.danger ?? '#EF4444') },
                ]}
              >
                {item.valid ? '✓' : '✗'} {item.validationMessage}
              </Text>
            </View>
          </AppCard>
        )}
        ListFooterComponent={
          <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
            <PrimaryButton
              title={
                confirmMutation.isPending
                  ? t('import.creating')
                  : t('import.confirmCreate')
              }
              onPress={() => confirmMutation.mutate()}
              disabled={!allValid || confirmMutation.isPending}
            />
            <Pressable
              onPress={() => router.push('/import')}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>{t('common.back')}</Text>
            </Pressable>
          </View>
        }
      />

      {/* Edit modal */}
      <Modal
        visible={editingIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Satırı Düzenle</Text>

            <Text style={styles.label}>{t('import.customerName')}</Text>
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder={t('common.optional')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>{t('import.customerPhone')}</Text>
            <TextInput
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder={t('common.optional')}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Text style={styles.label}>{t('import.address')}</Text>
            <TextInput
              value={rawAddress}
              onChangeText={setRawAddress}
              placeholder={t('import.address')}
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.input, styles.textArea]}
            />

            <Text style={styles.label}>{t('import.deliveryNote')}</Text>
            <TextInput
              value={deliveryNote}
              onChangeText={setDeliveryNote}
              placeholder={t('common.optional')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>{t('import.priority')}</Text>
            <TextInput
              value={priorityNo}
              onChangeText={setPriorityNo}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <View style={styles.modalButtonGroup}>
              <PrimaryButton title={t('common.save')} onPress={handleSaveEdit} />
              <Pressable onPress={handleCloseModal} style={styles.backButton}>
                <Text style={styles.backButtonText}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
      padding: spacing.lg,
    },
    helper: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
    errorTitle: { ...typography.heading, color: colors.text, marginBottom: spacing.xs },
    errorMsg: { ...typography.bodySmall, color: colors.textSecondary },

    title: { ...typography.titleLarge, color: colors.text },

    summaryRow: { flexDirection: 'row', gap: spacing.sm },
    summaryCard: {
      flex: 1,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      ...shadows.card,
    },
    summaryTotal: {},
    summaryValid: {},
    summaryInvalid: {},
    summaryNumber: {
      ...typography.titleLarge,
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
    },
    summaryLabel: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },

    routeTitle: { ...typography.heading, color: colors.text, fontWeight: '700' },
    routeDesc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
    routePoints: { marginTop: spacing.md, gap: spacing.xs },
    routePointRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    routePointDot: { width: 8, height: 8, borderRadius: 4 },
    routePointText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      flex: 1,
    },

    itemCard: { marginTop: spacing.sm },
    itemTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    itemBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
    },
    itemBadgeText: {
      ...typography.bodySmall,
      color: colors.primary,
      fontWeight: '700',
    },
    rowActions: { flexDirection: 'row', gap: spacing.sm },

    itemAddress: { ...typography.body, color: colors.text, marginBottom: 4, fontWeight: '600' },
    itemNormalized: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 4 },
    itemMeta: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },

    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.md,
      marginTop: 6,
    },
    statusBadgeText: {
      ...typography.caption,
      fontWeight: '700',
    },

    editButton: {
      minHeight: 32,
      paddingHorizontal: 12,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editButtonText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    removeButton: {
      minHeight: 32,
      paddingHorizontal: 12,
      borderRadius: radius.md,
      backgroundColor: colors.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButtonText: {
      ...typography.caption,
      color: colors.danger ?? '#EF4444',
      fontWeight: '700',
    },

    backButton: {
      minHeight: 48,
      borderRadius: radius.lg,
      backgroundColor: colors.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    backButtonText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: colors.page,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },
    modalTitle: { ...typography.title, color: colors.text, marginBottom: spacing.sm },

    label: {
      ...typography.bodySmall,
      color: colors.text,
      fontWeight: '600',
      marginBottom: 4,
    },
    input: {
      minHeight: 48,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardSoft,
      color: colors.text,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    textArea: { minHeight: 100, paddingTop: 14, textAlignVertical: 'top' },
    modalButtonGroup: { gap: spacing.sm, marginTop: spacing.md },
  });