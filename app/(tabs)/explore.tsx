import AppCard from '@/src/components/AppCard';
import CompactSegment from '@/src/components/CompactSegment';
import SettingRow from '@/src/components/SettingRow';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { spacing, typography } from '@/src/theme';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const {
    themeMode,
    language,
    notificationsEnabled,
    largeTouchMode,
    navigationProvider,
    setThemeMode,
    setLanguage,
    setNotificationsEnabled,
    setLargeTouchMode,
    setNavigationProvider,
  } = useSettingsStore();

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ayarlar</Text>

        <AppCard>
          <Text style={styles.sectionTitle}>Görünüm</Text>

          <SettingRow
            title="Tema"
            value={
              themeMode === 'system'
                ? 'Sistem'
                : themeMode === 'light'
                  ? 'Açık'
                  : 'Koyu'
            }
          >
            <CompactSegment
              value={themeMode}
              onChange={setThemeMode}
              options={[
                { label: 'Sistem', value: 'system' },
                { label: 'Açık', value: 'light' },
                { label: 'Koyu', value: 'dark' },
              ]}
            />
          </SettingRow>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Kullanıcı</Text>

          <SettingRow title="Dil" value={language.toUpperCase()}>
            <CompactSegment
              value={language}
              onChange={setLanguage}
              options={[
                { label: 'TR', value: 'tr' },
                { label: 'EN', value: 'en' },
              ]}
            />
          </SettingRow>

          <View style={styles.switchRow}>
            <Text style={styles.switchTitle}>Bildirimler</Text>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchTitle}>Büyük Dokunma Modu</Text>
            <Switch value={largeTouchMode} onValueChange={setLargeTouchMode} />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Navigasyon</Text>

          <SettingRow
            title="Varsayılan Sağlayıcı"
            value={
              navigationProvider === 'GOOGLE_MAPS'
                ? 'Google'
                : navigationProvider === 'YANDEX_MAPS'
                  ? 'Yandex'
                  : 'Apple'
            }
          >
            <CompactSegment
              value={navigationProvider}
              onChange={setNavigationProvider}
              options={[
                { label: 'Google', value: 'GOOGLE_MAPS' },
                { label: 'Yandex', value: 'YANDEX_MAPS' },
                { label: 'Apple', value: 'APPLE_MAPS' },
              ]}
            />
          </SettingRow>
        </AppCard>
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
    title: {
      ...typography.titleLarge,
      color: colors.text,
    },
    sectionTitle: {
      ...typography.heading,
      color: colors.text,
      marginBottom: spacing.md,
    },
    switchRow: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    switchTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: '700',
    },
  });