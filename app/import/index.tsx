// app/import/index.tsx
import AppCard from '@/src/components/AppCard';
import LocationPicker from '@/src/components/LocationPicker';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useMapPickerStore } from '@/src/store/useMapPickerStore';
import { useRouteImportStore } from '@/src/store/useRouteImportStore';
import { radius, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ImportHomeScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const {
    title,
    description,
    setTitle,
    setDescription,
    stops,
    removeStop,
    clearAll,
    startAddress,
    startLatitude,
    startLongitude,
    endAddress,
    endLatitude,
    endLongitude,
    setStartPoint,
    setEndPoint,
  } = useRouteImportStore();

  const styles = createStyles(colors);

  /**
   * Map picker'dan dönüldüğünde target'a göre start/end'i set et.
   * (Saved place'i tap'leyince zaten LocationPicker doğrudan onChange çağırıyor;
   * map picker bu yüzden sadece kendisinin yazdığı target'tan tetiklenmeli.)
   */
  useFocusEffect(
    useCallback(() => {
      const mp = useMapPickerStore.getState();
      const target = mp.target;
      const result = mp.consume();
      if (!result) return;

      if (target === 'import-start') {
        setStartPoint({
          address: result.address,
          latitude: result.latitude,
          longitude: result.longitude,
        });
      } else if (target === 'import-end') {
        setEndPoint({
          address: result.address,
          latitude: result.latitude,
          longitude: result.longitude,
        });
      }
    }, [setStartPoint, setEndPoint])
  );

  const handleClear = () => {
    Alert.alert(t('common.warning'), 'Tüm bilgileri temizle?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => {
          haptics.warning();
          clearAll();
        },
      },
    ]);
  };

  const startReady = (startAddress.trim().length > 0) ||
    (startLatitude !== undefined && startLongitude !== undefined);

  const canProceed = title.trim().length > 0 && stops.length > 0 && startReady;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('import.title')}</Text>
            <Text style={styles.subtitle}>{t('import.subtitle')}</Text>
          </View>

          {(title || stops.length > 0 || startAddress) && (
            <Pressable onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Temizle</Text>
            </Pressable>
          )}
        </View>

        {/* Rota Bilgileri */}
        <AppCard>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>📋</Text>
            <Text style={styles.cardHeaderText}>Rota Bilgileri</Text>
          </View>

          <Text style={styles.label}>{t('import.routeTitle')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('import.routeTitlePlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>
            Açıklama <Text style={styles.optional}>({t('common.optional')})</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Kısa not"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </AppCard>

        {/* Başlangıç & Bitiş */}
        <AppCard>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>📍</Text>
            <Text style={styles.cardHeaderText}>Başlangıç & Bitiş</Text>
          </View>

          {/* START */}
          <View style={styles.pointBlock}>
            <View style={styles.pointHeaderRow}>
              <View style={[styles.pointDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.pointLabel}>{t('import.startPoint')}</Text>
            </View>

            <LocationPicker
              value={{
                address: startAddress,
                latitude: startLatitude,
                longitude: startLongitude,
              }}
              onChange={(v) => setStartPoint(v)}
              mapPickerTarget="import-start"
            />
          </View>

          <View style={styles.divider} />

          {/* END */}
          <View style={styles.pointBlock}>
            <View style={styles.pointHeaderRow}>
              <View style={[styles.pointDot, { backgroundColor: colors.success ?? '#22C55E' }]} />
              <Text style={styles.pointLabel}>
                {t('import.endPoint')}{' '}
                <Text style={styles.optional}>({t('common.optional')})</Text>
              </Text>
            </View>

            <LocationPicker
              value={{
                address: endAddress,
                latitude: endLatitude,
                longitude: endLongitude,
              }}
              onChange={(v) => setEndPoint(v)}
              mapPickerTarget="import-end"
            />

            {!endAddress && endLatitude === undefined && (
              <Text style={styles.hint}>{t('import.endPointHint')}</Text>
            )}
          </View>
        </AppCard>

        {/* Duraklar */}
        <AppCard>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>📦</Text>
            <Text style={styles.cardHeaderText}>
              Duraklar{' '}
              <Text style={styles.countBadge}>{stops.length}</Text>
            </Text>
          </View>

          {stops.length === 0 ? (
            <Text style={styles.emptyText}>{t('import.noStops')}</Text>
          ) : (
            <View style={{ gap: spacing.xs }}>
              {stops.map((stop, index) => (
                <View key={`${stop.rawAddress}-${index}`} style={styles.stopRow}>
                  <View style={styles.stopIndex}>
                    <Text style={styles.stopIndexText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stopAddress} numberOfLines={2}>
                      {stop.rawAddress}
                    </Text>
                    {stop.customerName && (
                      <Text style={styles.stopMeta} numberOfLines={1}>
                        {stop.customerName}
                      </Text>
                    )}
                    {stop.latitude !== undefined && stop.longitude !== undefined && (
                      <Text style={styles.stopCoords}>
                        ✓ Koordinat ile kayıtlı
                      </Text>
                    )}
                  </View>
                  <Pressable onPress={() => removeStop(index)} style={styles.removePill}>
                    <Text style={styles.removePillText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={() => router.push('/import/manual')}
            style={[
              styles.addStopButton,
              { marginTop: stops.length > 0 ? spacing.md : spacing.sm },
            ]}
          >
            <Text style={styles.addStopButtonText}>+ {t('import.manualEntry')}</Text>
          </Pressable>

          {/*
                      Toplu Yapıştır ve CSV Yükle yakında — şimdilik kapalı.
                      Aktifleşince aşağıdaki blokları geri aç:

                      <Pressable onPress={() => router.push('/import/paste')} ...>
                        <Text>📋 {t('import.pasteList')}</Text>
                      </Pressable>

                      <Pressable onPress={() => router.push('/import/csv')} ...>
                        <Text>📄 {t('import.csvUpload')}</Text>
                      </Pressable>
                    */}
        </AppCard>

        {/* CTA */}
        <PrimaryButton
          title={t('import.previewAndConfirm')}
          onPress={() => router.push('/import/preview')}
          disabled={!canProceed}
        />

        {!canProceed && (
          <Text style={styles.helperText}>
            {!title.trim()
              ? '• Rota adı gerekli'
              : !startReady
                ? '• Başlangıç noktası seçilmedi'
                : '• En az 1 adres ekle'}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.page },
    content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    title: { ...typography.titleLarge, color: colors.text },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },

    clearButton: {
      minHeight: 36,
      paddingHorizontal: 14,
      borderRadius: radius.md,
      backgroundColor: colors.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearButtonText: {
      ...typography.bodySmall,
      color: colors.danger ?? '#EF4444',
      fontWeight: '700',
    },

    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    cardEmoji: { fontSize: 20 },
    cardHeaderText: {
      ...typography.heading,
      color: colors.text,
      fontWeight: '700',
    },
    countBadge: {
      ...typography.bodySmall,
      color: colors.primary,
      backgroundColor: colors.primarySoft,
      fontWeight: '700',
    },

    label: {
      ...typography.bodySmall,
      color: colors.text,
      fontWeight: '600',
      marginBottom: 6,
    },
    optional: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '400',
    },
    input: {
      minHeight: 48,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardSoft,
      color: colors.text,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },

    pointBlock: { marginVertical: 4 },
    pointHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    pointDot: { width: 10, height: 10, borderRadius: 5 },
    pointLabel: {
      ...typography.body,
      color: colors.text,
      fontWeight: '700',
    },

    hint: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 6,
      textAlign: 'center',
    },

    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },

    emptyText: {
      ...typography.bodySmall,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },

    stopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.cardSoft,
    },
    stopIndex: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopIndexText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    stopAddress: {
      ...typography.bodySmall,
      color: colors.text,
      fontWeight: '600',
    },
    stopMeta: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    stopCoords: {
      ...typography.caption,
      color: colors.success ?? '#22C55E',
      marginTop: 2,
      fontWeight: '600',
    },
    removePill: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    removePillText: {
      color: colors.danger ?? '#EF4444',
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 22,
    },

    addStopButton: {
      minHeight: 48,
      borderRadius: radius.lg,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addStopButtonText: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '700',
    },

    helperText: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: -spacing.sm,
    },
  });