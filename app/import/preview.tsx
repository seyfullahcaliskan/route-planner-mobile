import { confirmRouteImport, previewRouteImport } from '@/src/api/importService';
import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useRouteImportStore } from '@/src/store/useRouteImportStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { radius, spacing, typography } from '@/src/theme';
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

const DEMO_USER_ID = '1c34b887-83a4-4983-9954-12bca2aa2ce1';

export default function ImportPreviewScreen() {
  const { colors } = useAppTheme();
  const { navigationProvider } = useSettingsStore();
  const {
    title,
    description,
    stops,
    removeStop,
    updateStop,
    clearAll,
  } = useRouteImportStore();

  const styles = createStyles(colors);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [rawAddress, setRawAddress] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [priorityNo, setPriorityNo] = useState('0');

  const payload = useMemo(
    () => ({
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
    }),
    [title, description, navigationProvider, stops]
  );

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
      Alert.alert('Uyarı', 'Adres boş olamaz.');
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

  const handleCloseModal = () => {
    setEditingIndex(null);
  };

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

              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => setEditingIndex(index)}
                  style={styles.editButton}
                >
                  <Text style={styles.editButtonText}>Düzenle</Text>
                </Pressable>

                <Pressable onPress={() => removeStop(index)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>Sil</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.itemAddress}>{item.rawAddress}</Text>

            {item.normalizedAddress ? (
              <Text style={styles.itemNormalized}>
                Normalized: {item.normalizedAddress}
              </Text>
            ) : null}

            {item.latitude && item.longitude ? (
              <Text style={styles.itemMeta}>
                {item.latitude}, {item.longitude}
              </Text>
            ) : null}

            {(stops[index]?.customerName || stops[index]?.customerPhone) ? (
              <Text style={styles.itemMeta}>
                {[stops[index]?.customerName, stops[index]?.customerPhone]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
            ) : null}

            <Text
              style={[
                styles.itemStatus,
                { color: item.valid ? colors.success : colors.danger },
              ]}
            >
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

      <Modal
        visible={editingIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Satırı Düzenle</Text>

            <Text style={styles.label}>Müşteri Adı</Text>
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="İsteğe bağlı"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Telefon</Text>
            <TextInput
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="İsteğe bağlı"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Adres</Text>
            <TextInput
              value={rawAddress}
              onChangeText={setRawAddress}
              placeholder="Adres"
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.input, styles.textArea]}
            />

            <Text style={styles.label}>Teslimat Notu</Text>
            <TextInput
              value={deliveryNote}
              onChangeText={setDeliveryNote}
              placeholder="İsteğe bağlı"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Öncelik</Text>
            <TextInput
              value={priorityNo}
              onChangeText={setPriorityNo}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <View style={styles.modalButtonGroup}>
              <PrimaryButton title="Kaydet" onPress={handleSaveEdit} />
              <PrimaryButton title="Vazgeç" onPress={handleCloseModal} />
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
    },
    helper: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    title: {
      ...typography.titleLarge,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    summaryText: {
      ...typography.body,
      color: colors.text,
      marginBottom: 6,
    },
    itemCard: {
      marginTop: spacing.md,
    },
    itemTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    rowActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    itemTitle: {
      ...typography.heading,
      color: colors.text,
    },
    itemAddress: {
      ...typography.body,
      color: colors.text,
      marginBottom: 8,
    },
    itemNormalized: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    itemMeta: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    itemStatus: {
      ...typography.bodySmall,
      fontWeight: '700',
    },
    editButton: {
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editButtonText: {
      ...typography.bodySmall,
      color: colors.primary,
      fontWeight: '700',
    },
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.page,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    modalTitle: {
      ...typography.title,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    label: {
      ...typography.body,
      color: colors.text,
      fontWeight: '700',
      marginBottom: 4,
    },
    input: {
      minHeight: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardSoft,
      color: colors.text,
      paddingHorizontal: 14,
      marginBottom: spacing.md,
    },
    textArea: {
      minHeight: 110,
      paddingTop: 14,
      textAlignVertical: 'top',
    },
    modalButtonGroup: {
      gap: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
  });