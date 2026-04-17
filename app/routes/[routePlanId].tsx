import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import StatusPill from '@/src/components/StatusPill';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { radius, shadows, spacing, typography } from '@/src/theme';
import { getStatusColor } from '@/src/utils/status';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    deliverStop,
    failStop,
    getNavigationUrl,
    getRouteStops,
    reoptimizeRoute,
    skipStop,
} from '../../src/api/routeService';

const getStopStatusLabel = (status: string) => {
    switch (status) {
        case 'PENDING':
            return 'Bekliyor';
        case 'NAVIGATING':
            return 'Navigasyonda';
        case 'ARRIVED':
            return 'Varıldı';
        case 'DELIVERED':
            return 'Teslim Edildi';
        case 'FAILED':
            return 'Başarısız';
        case 'SKIPPED':
            return 'Atlandı';
        case 'POSTPONED':
            return 'Ertelendi';
        default:
            return status;
    }
};

export default function RouteDetailScreen() {
    const { routePlanId } = useLocalSearchParams<{ routePlanId: string }>();
    const queryClient = useQueryClient();
    const { colors, isDark } = useAppTheme();
    const { largeTouchMode } = useSettingsStore();
    const styles = createStyles(colors, isDark, largeTouchMode);

    const { data, isLoading, error } = useQuery({
        queryKey: ['routeStops', routePlanId],
        queryFn: () => getRouteStops(routePlanId!),
        enabled: !!routePlanId,
    });

    const refreshStops = async () => {
        await queryClient.invalidateQueries({ queryKey: ['routeStops', routePlanId] });
        await queryClient.invalidateQueries({ queryKey: ['userRoutes'] });
    };

    const deliverMutation = useMutation({
        mutationFn: deliverStop,
        onSuccess: refreshStops,
    });

    const skipMutation = useMutation({
        mutationFn: skipStop,
        onSuccess: refreshStops,
    });

    const failMutation = useMutation({
        mutationFn: failStop,
        onSuccess: refreshStops,
    });

    const reoptimizeMutation = useMutation({
        mutationFn: () => reoptimizeRoute(routePlanId!),
        onSuccess: refreshStops,
    });

    const openNavigation = async (routeStopId: string) => {
        const response = await getNavigationUrl(routeStopId);
        if (response?.navigationUrl) {
            await Linking.openURL(response.navigationUrl);
        }
    };

    const stops = data ?? [];

    const currentStop = useMemo(() => {
        return (
            stops.find(
                (item) =>
                    item.stopStatus === 'PENDING' ||
                    item.stopStatus === 'NAVIGATING' ||
                    item.stopStatus === 'ARRIVED' ||
                    item.stopStatus === 'POSTPONED'
            ) ?? null
        );
    }, [stops]);

    const completedCount = useMemo(
        () => stops.filter((item) => item.stopStatus === 'DELIVERED').length,
        [stops]
    );

    const pendingCount = useMemo(
        () =>
            stops.filter(
                (item) =>
                    item.stopStatus === 'PENDING' ||
                    item.stopStatus === 'NAVIGATING' ||
                    item.stopStatus === 'ARRIVED' ||
                    item.stopStatus === 'POSTPONED'
            ).length,
        [stops]
    );

    const failedCount = useMemo(
        () =>
            stops.filter(
                (item) => item.stopStatus === 'FAILED' || item.stopStatus === 'SKIPPED'
            ).length,
        [stops]
    );

    const isAnyPending =
        deliverMutation.isPending ||
        skipMutation.isPending ||
        failMutation.isPending ||
        reoptimizeMutation.isPending;

    if (isLoading) {
        return (
            <SafeAreaView edges={['top']} style={styles.centeredScreen}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.helperText}>Duraklar yükleniyor...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView edges={['top']} style={styles.centeredScreen}>
                <AppCard style={styles.feedbackCard}>
                    <Text style={styles.feedbackTitle}>Bir sorun oluştu</Text>
                    <Text style={styles.feedbackDescription}>Duraklar alınamadı.</Text>
                </AppCard>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <FlatList
                data={stops}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
                ListHeaderComponent={
                    <View style={styles.headerArea}>
                        <AppCard style={styles.heroCard}>
                            <View style={styles.heroTopRow}>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={styles.heroEyebrow}>Rota Detayı</Text>
                                    <Text style={styles.heroTitle}>Bugünkü Duraklar</Text>
                                    <Text style={styles.heroSubTitle} numberOfLines={1}>
                                        Sıradaki: {currentStop?.customerName || 'Aktif durak yok'}
                                    </Text>
                                </View>

                                <View style={styles.countPill}>
                                    <Text style={styles.countPillText}>{stops.length}</Text>
                                </View>
                            </View>

                            <View style={styles.heroDivider} />

                            <View style={styles.heroStatsRow}>
                                <View style={styles.heroStatBox}>
                                    <Text style={styles.heroStatLabel}>Toplam</Text>
                                    <Text style={styles.heroStatValue}>{stops.length}</Text>
                                </View>

                                <View style={styles.heroStatBox}>
                                    <Text style={styles.heroStatLabel}>Bekleyen</Text>
                                    <Text style={styles.heroStatValue}>{pendingCount}</Text>
                                </View>

                                <View style={styles.heroStatBox}>
                                    <Text style={styles.heroStatLabel}>Teslim</Text>
                                    <Text style={styles.heroStatValue}>{completedCount}</Text>
                                </View>

                                <View style={styles.heroStatBox}>
                                    <Text style={styles.heroStatLabel}>Sorunlu</Text>
                                    <Text style={styles.heroStatValue}>{failedCount}</Text>
                                </View>
                            </View>
                        </AppCard>

                        <PrimaryButton
                            title={reoptimizeMutation.isPending ? 'Rota Güncelleniyor...' : 'Yeniden Rota Oluştur'}
                            onPress={() => reoptimizeMutation.mutate()}
                            disabled={reoptimizeMutation.isPending}
                        />
                    </View>
                }
                renderItem={({ item }) => {
                    const isCurrent = currentStop?.id === item.id;
                    const localizedStatus = getStopStatusLabel(item.stopStatus);

                    return (
                        <AppCard style={[styles.stopCard, isCurrent && styles.stopCardCurrent]}>
                            <View style={styles.stopHeader}>
                                <View style={[styles.sequenceBadge, isCurrent && styles.sequenceBadgeCurrent]}>
                                    <Text
                                        style={[
                                            styles.sequenceBadgeText,
                                            isCurrent && styles.sequenceBadgeTextCurrent,
                                        ]}
                                    >
                                        {item.sequenceNo}
                                    </Text>
                                </View>

                                <View style={styles.stopMainInfo}>
                                    <Text style={styles.customerName} numberOfLines={1}>
                                        {item.customerName || 'Müşteri'}
                                    </Text>

                                    <View style={styles.metaRow}>
                                        <StatusPill
                                            label={localizedStatus}
                                            color={getStatusColor(item.stopStatus) || colors.textSecondary}
                                            backgroundColor={colors.cardSoft}
                                        />

                                        {isCurrent ? (
                                            <StatusPill
                                                label="Aktif Durak"
                                                color={colors.primary}
                                                backgroundColor={colors.primarySoft}
                                            />
                                        ) : null}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.addressBox}>
                                <Text style={styles.addressLabel}>Adres</Text>
                                <Text style={styles.addressText}>{item.rawAddress}</Text>
                            </View>

                            {item.deliveryNote ? (
                                <View style={styles.noteBox}>
                                    <Text style={styles.noteLabel}>Not</Text>
                                    <Text style={styles.noteText}>{item.deliveryNote}</Text>
                                </View>
                            ) : null}

                            <Pressable
                                onPress={() => openNavigation(item.id)}
                                style={({ pressed }) => [
                                    styles.navigationButton,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <Text style={styles.navigationButtonText}>Navigasyonu Aç</Text>
                            </Pressable>

                            <View style={styles.actionsGrid}>
                                <Pressable
                                    onPress={() => deliverMutation.mutate(item.id)}
                                    disabled={isAnyPending}
                                    style={({ pressed }) => [
                                        styles.actionButton,
                                        styles.successButton,
                                        pressed && styles.pressed,
                                        isAnyPending && styles.disabled,
                                    ]}
                                >
                                    <Text style={styles.actionButtonText}>Teslim</Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => skipMutation.mutate(item.id)}
                                    disabled={isAnyPending}
                                    style={({ pressed }) => [
                                        styles.actionButton,
                                        styles.warningButton,
                                        pressed && styles.pressed,
                                        isAnyPending && styles.disabled,
                                    ]}
                                >
                                    <Text style={styles.actionButtonText}>Atla</Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => failMutation.mutate(item.id)}
                                    disabled={isAnyPending}
                                    style={({ pressed }) => [
                                        styles.actionButton,
                                        styles.dangerButton,
                                        pressed && styles.pressed,
                                        isAnyPending && styles.disabled,
                                    ]}
                                >
                                    <Text style={styles.actionButtonText}>Başarısız</Text>
                                </Pressable>
                            </View>
                        </AppCard>
                    );
                }}
                ListEmptyComponent={
                    <AppCard style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Durak bulunamadı</Text>
                        <Text style={styles.emptyDescription}>Bu rotada henüz durak yok.</Text>
                    </AppCard>
                }
            />
        </SafeAreaView>
    );
}

const createStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    isDark: boolean,
    largeTouchMode: boolean
) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.page,
        },
        contentContainer: {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xxxl,
        },
        centeredScreen: {
            flex: 1,
            backgroundColor: colors.page,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
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
            marginBottom: spacing.md,
        },
        heroCard: {
            marginBottom: spacing.md,
            borderColor: colors.border,
        },
        heroTopRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: spacing.md,
        },
        heroEyebrow: {
            ...typography.caption,
            color: colors.textMuted,
            marginBottom: spacing.xs,
        },
        heroTitle: {
            ...typography.title,
            color: colors.text,
            marginBottom: spacing.xs,
            fontSize: largeTouchMode ? 24 : 22,
        },
        heroSubTitle: {
            ...typography.body,
            color: colors.textSecondary,
            fontSize: largeTouchMode ? 16 : 15,
        },
        countPill: {
            minWidth: 42,
            height: 42,
            paddingHorizontal: 12,
            borderRadius: radius.pill,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
        },
        countPillText: {
            color: colors.primary,
            fontSize: 16,
            fontWeight: '700',
        },
        heroDivider: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: spacing.lg,
        },
        heroStatsRow: {
            flexDirection: 'row',
            gap: spacing.sm,
            flexWrap: 'wrap',
        },
        heroStatBox: {
            flex: 1,
            minWidth: '22%',
            backgroundColor: colors.cardSoft,
            borderRadius: radius.lg,
            padding: largeTouchMode ? spacing.lg : spacing.md,
        },
        heroStatLabel: {
            ...typography.caption,
            color: colors.textMuted,
            marginBottom: spacing.xs,
        },
        heroStatValue: {
            ...typography.heading,
            color: colors.text,
            fontSize: largeTouchMode ? 20 : 18,
        },
        stopCard: {
            marginBottom: spacing.md,
            borderColor: colors.border,
            backgroundColor: colors.card,
            padding: largeTouchMode ? 20 : 16,
        },
        stopCardCurrent: {
            borderColor: colors.primarySoft,
            backgroundColor: isDark ? colors.card : '#FAFCFF',
        },
        stopHeader: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: spacing.md,
        },
        sequenceBadge: {
            width: largeTouchMode ? 44 : 40,
            height: largeTouchMode ? 44 : 40,
            borderRadius: largeTouchMode ? 22 : 20,
            backgroundColor: colors.cardSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
        },
        sequenceBadgeCurrent: {
            backgroundColor: colors.primarySoft,
        },
        sequenceBadgeText: {
            fontSize: largeTouchMode ? 16 : 15,
            fontWeight: '700',
            color: colors.text,
        },
        sequenceBadgeTextCurrent: {
            color: colors.primary,
        },
        stopMainInfo: {
            flex: 1,
            minWidth: 0,
        },
        customerName: {
            ...typography.heading,
            color: colors.text,
            marginBottom: spacing.sm,
            fontSize: largeTouchMode ? 20 : 18,
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: spacing.sm,
        },
        addressBox: {
            backgroundColor: colors.cardSoft,
            borderRadius: radius.lg,
            padding: largeTouchMode ? spacing.lg : spacing.md,
            marginBottom: spacing.md,
        },
        addressLabel: {
            ...typography.caption,
            color: colors.textMuted,
            textTransform: 'uppercase',
            marginBottom: spacing.xs,
        },
        addressText: {
            ...typography.body,
            color: colors.text,
            lineHeight: largeTouchMode ? 24 : 21,
            fontSize: largeTouchMode ? 16 : 15,
        },
        noteBox: {
            backgroundColor: colors.primarySoft,
            borderRadius: radius.lg,
            padding: largeTouchMode ? spacing.lg : spacing.md,
            marginBottom: spacing.md,
        },
        noteLabel: {
            ...typography.caption,
            color: colors.primary,
            textTransform: 'uppercase',
            marginBottom: spacing.xs,
        },
        noteText: {
            ...typography.body,
            color: colors.text,
            fontSize: largeTouchMode ? 16 : 15,
        },
        navigationButton: {
            height: largeTouchMode ? 58 : 52,
            borderRadius: radius.lg,
            backgroundColor: colors.darkButton,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
            ...shadows.card,
        },
        navigationButtonText: {
            color: colors.white,
            fontSize: largeTouchMode ? 16 : 15,
            fontWeight: '700',
        },
        actionsGrid: {
            flexDirection: 'row',
            gap: spacing.sm,
        },
        actionButton: {
            flex: 1,
            minHeight: largeTouchMode ? 56 : 48,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
        },
        successButton: {
            backgroundColor: colors.success,
        },
        warningButton: {
            backgroundColor: colors.warning,
        },
        dangerButton: {
            backgroundColor: colors.danger,
        },
        actionButtonText: {
            color: colors.white,
            fontSize: largeTouchMode ? 14 : 13,
            fontWeight: '700',
        },
        emptyCard: {
            alignItems: 'center',
            marginTop: spacing.xl,
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
        pressed: {
            opacity: 0.86,
            transform: [{ scale: 0.995 }],
        },
        disabled: {
            opacity: 0.55,
        },
    });