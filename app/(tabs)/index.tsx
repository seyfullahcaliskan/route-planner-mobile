import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import StatusPill from '@/src/components/StatusPill';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { radius, spacing, typography } from '@/src/theme';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserRoutes } from '../../src/api/routeService';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { largeTouchMode } = useSettingsStore();
  const styles = createStyles(colors, largeTouchMode);

  const { data, isLoading, error } = useQuery({
    queryKey: ['userRoutes'],
    queryFn: getUserRoutes,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.helperText}>Rotalar yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <AppCard style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>Bir sorun oluştu</Text>
          <Text style={styles.feedbackDescription}>Rotalar alınamadı.</Text>
        </AppCard>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginTop: spacing.md }}>
        <PrimaryButton
          title="Yeni Rota Oluştur"
          onPress={() => router.push('/import')}
        />
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <Text style={styles.title}>Rotalar</Text>
            <Text style={styles.subtitle}>Bugünkü ve kayıtlı rota planların</Text>
          </View>
          
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/routes/[routePlanId]',
                params: { routePlanId: item.id },
              })
            }
          >
            <AppCard style={[styles.routeCard, largeTouchMode && styles.routeCardLarge]}>
              <View style={styles.routeTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.routeDescription} numberOfLines={2}>
                    {item.description || 'Açıklama yok'}
                  </Text>
                </View>

                <StatusPill
                  label={item.planStatus}
                  color={colors.primary}
                  backgroundColor={colors.primarySoft}
                />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Durak</Text>
                  <Text style={styles.statValue}>{item.totalStopCount}</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Tamamlanan</Text>
                  <Text style={styles.statValue}>{item.completedStopCount}</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Başarısız</Text>
                  <Text style={styles.statValue}>{item.failedStopCount}</Text>
                </View>
              </View>
            </AppCard>
          </Pressable>
        )}
        ListEmptyComponent={
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Henüz rota yok</Text>
            <Text style={styles.emptyDescription}>
              Adres girip rota oluşturduğunda burada görünecek.
            </Text>
          </AppCard>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  largeTouchMode: boolean
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.page,
    },
    contentContainer: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    centered: {
      flex: 1,
      backgroundColor: colors.page,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    helperText: {
      marginTop: spacing.md,
      ...typography.body,
      color: colors.textSecondary,
    },
    feedbackCard: {
      width: '100%',
    },
    feedbackTitle: {
      ...typography.heading,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    feedbackDescription: {
      ...typography.body,
      color: colors.textSecondary,
    },
    headerArea: {
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.titleLarge,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    routeCard: {
      marginBottom: spacing.md,
    },
    routeCardLarge: {
      padding: 20,
    },
    routeTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    routeTitle: {
      ...typography.heading,
      color: colors.text,
      marginBottom: spacing.xs,
      fontSize: largeTouchMode ? 20 : 18,
    },
    routeDescription: {
      ...typography.body,
      color: colors.textSecondary,
      fontSize: largeTouchMode ? 16 : 15,
      lineHeight: largeTouchMode ? 23 : 20,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.cardSoft,
      borderRadius: radius.lg,
      padding: largeTouchMode ? spacing.lg : spacing.md,
    },
    statLabel: {
      ...typography.caption,
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    statValue: {
      ...typography.heading,
      color: colors.text,
      fontSize: largeTouchMode ? 20 : 18,
    },
    emptyCard: {
      marginTop: spacing.xl,
      alignItems: 'center',
    },
    emptyTitle: {
      ...typography.heading,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    emptyDescription: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });