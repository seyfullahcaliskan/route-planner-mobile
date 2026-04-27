import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useRouteImportStore } from '@/src/store/useRouteImportStore';
import { spacing, typography } from '@/src/theme';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ImportHomeScreen() {
  const { colors } = useAppTheme();
  const {
    title,
    description,
    setTitle,
    setDescription,
    stops,
    clearAll,
    startAddress,
    endAddress,
    setStartAddress,
    setEndAddress,
  } = useRouteImportStore();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Yeni Rota</Text>
            <Text style={styles.subtitle}>Adresleri ekle, kontrol et ve rotayı oluştur</Text>
          </View>

          <Pressable onPress={clearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Temizle</Text>
          </Pressable>
        </View>

        <AppCard>
          <Text style={styles.label}>Rota Adı</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Örn: Sabah Dağıtım Rotası"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="İsteğe bağlı"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Adres Girişi</Text>
          <Text style={styles.helperText}>Toplam eklenen adres: {stops.length}</Text>
          <Text style={styles.label}>Başlangıç Adresi</Text>
          <TextInput
            value={startAddress}
            onChangeText={setStartAddress}
            placeholder="Örn: Karabük Merkez"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Bitiş Adresi</Text>
          <TextInput
            value={endAddress}
            onChangeText={setEndAddress}
            placeholder="Örn: Karabük Merkez"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <PrimaryButton
            title="CSV Dosyası Yükle"
            onPress={() =>
              router.push({
                pathname: '/import/csv',
              })
            }
          />
          <View style={styles.buttonGroup}>
            <PrimaryButton
              title="Tek Tek Adres Ekle"
              onPress={() =>
                router.push({
                  pathname: '/import/manual',
                })
              }
            />

            <PrimaryButton
              title="Toplu Yapıştır"
              onPress={() =>
                router.push({
                  pathname: '/import/paste',
                })
              }
            />

            <PrimaryButton
              title="Önizleme ve Onay"
              onPress={() =>
                router.push({
                  pathname: '/import/preview',
                })
              }
              disabled={
                !title.trim() ||
                stops.length === 0 ||
                !startAddress.trim()
              }
            />
          </View>
        </AppCard>

        {stops.length > 0 ? (
          <AppCard>
            <Text style={styles.sectionTitle}>Eklenen Adresler</Text>

            {stops.slice(0, 5).map((item, index) => (
              <View key={`${item.rawAddress}-${index}`} style={styles.previewRow}>
                <Text style={styles.previewIndex}>{index + 1}.</Text>
                <Text style={styles.previewText} numberOfLines={2}>
                  {item.rawAddress}
                </Text>
              </View>
            ))}

            {stops.length > 5 ? (
              <Text style={styles.moreText}>+ {stops.length - 5} adres daha</Text>
            ) : null}
          </AppCard>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.page,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    title: {
      ...typography.titleLarge,
      color: colors.text,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: 4,
    },
    clearButton: {
      minHeight: 40,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearButtonText: {
      ...typography.bodySmall,
      color: colors.danger,
      fontWeight: '700',
    },
    sectionTitle: {
      ...typography.heading,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    label: {
      ...typography.body,
      color: colors.text,
      marginBottom: 6,
      fontWeight: '700',
    },
    helperText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginBottom: spacing.md,
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
    buttonGroup: {
      gap: spacing.md,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    previewIndex: {
      ...typography.bodySmall,
      color: colors.textMuted,
      width: 20,
      fontWeight: '700',
    },
    previewText: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    moreText: {
      ...typography.bodySmall,
      color: colors.primary,
      fontWeight: '700',
      marginTop: spacing.sm,
    },
  });