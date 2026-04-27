import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import StatusPill from '@/src/components/StatusPill';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { radius, shadows, spacing, typography } from '@/src/theme';
import { getStatusColor } from '@/src/utils/status';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    deliverStop,
    failStop,
    getNavigationUrl,
    getRouteStops,
    reoptimizeRoute,
    skipStop,
} from '../../src/api/routeService';

type RouteStopItem = {
    id: string;
    externalReference?: string;
    customerName?: string;
    customerPhone?: string;
    rawAddress: string;
    normalizedAddress?: string;
    latitude?: number;
    longitude?: number;
    sequenceNo: number;
    previousSequenceNo?: number;
    optimizationRound: number;
    priorityNo: number;
    deliveryNote?: string;
    stopStatus:
    | 'PENDING'
    | 'NAVIGATING'
    | 'ARRIVED'
    | 'DELIVERED'
    | 'FAILED'
    | 'SKIPPED'
    | 'POSTPONED';
    navigationUrl?: string;
};

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

    const listRef = useRef<FlatList<RouteStopItem>>(null);
    const mapRef = useRef<MapView | null>(null);

    const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

    const { data, isLoading, error } = useQuery<RouteStopItem[]>({
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

    const selectedStop = useMemo(() => {
        if (selectedStopId) {
            const found = stops.find((item) => item.id === selectedStopId);
            if (found) return found;
        }
        return currentStop;
    }, [selectedStopId, stops, currentStop]);

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

    const coordinateStops = useMemo(
        () =>
            [...stops]
                .filter(
                    (item) =>
                        item.latitude !== undefined &&
                        item.latitude !== null &&
                        item.longitude !== undefined &&
                        item.longitude !== null
                )
                .sort((a, b) => a.sequenceNo - b.sequenceNo),
        [stops]
    );

    const polylineCoordinates = useMemo(
        () =>
            coordinateStops.map((item) => ({
                latitude: Number(item.latitude),
                longitude: Number(item.longitude),
            })),
        [coordinateStops]
    );

    useEffect(() => {
        if (!selectedStopId && currentStop?.id) {
            setSelectedStopId(currentStop.id);
        }
    }, [selectedStopId, currentStop]);

    useEffect(() => {
        if (!currentStop?.id) return;

        setSelectedStopId((prev) => {
            if (!prev) return currentStop.id;

            const prevStillExists = stops.some((item) => item.id === prev);
            if (!prevStillExists) return currentStop.id;

            const prevStop = stops.find((item) => item.id === prev);
            const prevIsTerminal =
                prevStop?.stopStatus === 'DELIVERED' ||
                prevStop?.stopStatus === 'FAILED' ||
                prevStop?.stopStatus === 'SKIPPED';

            return prevIsTerminal ? currentStop.id : prev;
        });
    }, [currentStop, stops]);

    useEffect(() => {
        if (!mapRef.current || polylineCoordinates.length === 0) return;

        const timeout = setTimeout(() => {
            if (polylineCoordinates.length === 1) {
                mapRef.current?.animateToRegion(
                    {
                        latitude: polylineCoordinates[0].latitude,
                        longitude: polylineCoordinates[0].longitude,
                        latitudeDelta: 0.04,
                        longitudeDelta: 0.04,
                    },
                    500
                );
            } else {
                mapRef.current?.fitToCoordinates(polylineCoordinates, {
                    edgePadding: {
                        top: 80,
                        right: 50,
                        bottom: 240,
                        left: 50,
                    },
                    animated: true,
                });
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [polylineCoordinates]);

    const scrollToStop = (stopId: string) => {
        const index = stops.findIndex((item) => item.id === stopId);
        if (index === -1) return;

        listRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.3,
        });
    };

    const focusMapToStop = (stopId: string) => {
        const stop = stops.find((item) => item.id === stopId);
        if (!stop?.latitude || !stop?.longitude || !mapRef.current) return;

        mapRef.current.animateToRegion(
            {
                latitude: Number(stop.latitude),
                longitude: Number(stop.longitude),
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
            },
            500
        );
    };

    const handleSelectStop = (stopId: string) => {
        setSelectedStopId(stopId);
        scrollToStop(stopId);
        focusMapToStop(stopId);
    };

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
                ref={listRef}
                data={stops}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
                stickyHeaderIndices={selectedStop ? [1] : undefined}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                        listRef.current?.scrollToIndex({
                            index: info.index,
                            animated: true,
                            viewPosition: 0.3,
                        });
                    }, 250);
                }}
                ListHeaderComponent={
                    <>
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
                                title={
                                    reoptimizeMutation.isPending
                                        ? 'Rota Güncelleniyor...'
                                        : 'Yeniden Rota Oluştur'
                                }
                                onPress={() => reoptimizeMutation.mutate()}
                                disabled={reoptimizeMutation.isPending}
                            />

                            {coordinateStops.length > 0 ? (
                                <AppCard style={styles.mapCard}>
                                    <View style={styles.mapHeaderRow}>
                                        <Text style={styles.mapTitle}>Harita</Text>

                                        {selectedStop ? (
                                            <StatusPill
                                                label={`#${selectedStop.sequenceNo}`}
                                                color={colors.primary}
                                                backgroundColor={colors.primarySoft}
                                            />
                                        ) : null}
                                    </View>

                                    <View style={styles.mapWrapper}>
                                        <MapView
                                            ref={mapRef}
                                            style={styles.map}
                                            initialRegion={{
                                                latitude: Number(
                                                    selectedStop?.latitude ??
                                                    currentStop?.latitude ??
                                                    coordinateStops[0]?.latitude ??
                                                    41.2061
                                                ),
                                                longitude: Number(
                                                    selectedStop?.longitude ??
                                                    currentStop?.longitude ??
                                                    coordinateStops[0]?.longitude ??
                                                    32.6204
                                                ),
                                                latitudeDelta: 0.12,
                                                longitudeDelta: 0.12,
                                            }}
                                        >
                                            {polylineCoordinates.length >= 2 ? (
                                                <Polyline
                                                    coordinates={polylineCoordinates}
                                                    strokeColor={colors.primary}
                                                    strokeWidth={4}
                                                />
                                            ) : null}

                                            {coordinateStops.map((item) => {
                                                const isCurrent = currentStop?.id === item.id;
                                                const isSelected = selectedStop?.id === item.id;

                                                return (
                                                    <Marker
                                                        key={item.id}
                                                        coordinate={{
                                                            latitude: Number(item.latitude),
                                                            longitude: Number(item.longitude),
                                                        }}
                                                        title={item.customerName || `Durak ${item.sequenceNo}`}
                                                        description={item.rawAddress}
                                                        pinColor={
                                                            isSelected
                                                                ? colors.primary
                                                                : isCurrent
                                                                    ? colors.success
                                                                    : undefined
                                                        }
                                                        onPress={() => handleSelectStop(item.id)}
                                                    />
                                                );
                                            })}
                                        </MapView>
                                    </View>
                                </AppCard>
                            ) : null}
                        </View>

                        {selectedStop ? (
                            <View style={styles.stickyWrap}>
                                <View style={styles.stickyCard}>
                                    <View style={styles.stickyTop}>
                                        <View style={styles.stickyLeft}>
                                            <Text style={styles.stickyTitle} numberOfLines={1}>
                                                {selectedStop.customerName ||
                                                    `Durak ${selectedStop.sequenceNo}`}
                                            </Text>
                                            <Text style={styles.stickyAddress} numberOfLines={2}>
                                                {selectedStop.rawAddress}
                                            </Text>
                                        </View>

                                        <StatusPill
                                            label={getStopStatusLabel(selectedStop.stopStatus)}
                                            color={
                                                getStatusColor(selectedStop.stopStatus) ||
                                                colors.textSecondary
                                            }
                                            backgroundColor={colors.cardSoft}
                                        />
                                    </View>

                                    <View style={styles.stickyActions}>
                                        <Pressable
                                            onPress={() => openNavigation(selectedStop.id)}
                                            style={({ pressed }) => [
                                                styles.overlayPrimaryButton,
                                                pressed && styles.pressed,
                                            ]}
                                        >
                                            <Text style={styles.overlayPrimaryButtonText}>
                                                Navigasyon
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => {
                                                if (currentStop?.id) {
                                                    handleSelectStop(currentStop.id);
                                                }
                                            }}
                                            style={({ pressed }) => [
                                                styles.overlaySecondaryButton,
                                                pressed && styles.pressed,
                                            ]}
                                        >
                                            <Text style={styles.overlaySecondaryButtonText}>
                                                Aktif Durağa Dön
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        ) : null}
                    </>
                }
                renderItem={({ item }) => {
                    const isCurrent = currentStop?.id === item.id;
                    const isSelected = selectedStop?.id === item.id;
                    const localizedStatus = getStopStatusLabel(item.stopStatus);

                    return (
                        <Pressable onPress={() => handleSelectStop(item.id)}>
                            <AppCard
                                style={[
                                    styles.stopCard,
                                    isCurrent && styles.stopCardCurrent,
                                    isSelected && styles.stopCardSelected,
                                ]}
                            >
                                <View style={styles.stopHeader}>
                                    <View
                                        style={[
                                            styles.sequenceBadge,
                                            isCurrent && styles.sequenceBadgeCurrent,
                                        ]}
                                    >
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
                                                color={
                                                    getStatusColor(item.stopStatus) || colors.textSecondary
                                                }
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
                        </Pressable>
                    );
                }}
                ListEmptyComponent={
                    <AppCard style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Durak bulunamadı</Text>
                        <Text style={styles.emptyDescription}>
                            Bu rotada henüz durak yok.
                        </Text>
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
        mapHeaderRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.sm,
        },
        mapTitle: {
            ...typography.heading,
            color: colors.text,
        },
        mapWrapper: {
            position: 'relative',
        },
        mapCard: {
            marginBottom: spacing.md,
            overflow: 'hidden',
        },
        map: {
            width: '100%',
            height: largeTouchMode ? 300 : 240,
            borderRadius: radius.lg,
        },
        stickyWrap: {
            backgroundColor: colors.page,
            paddingBottom: spacing.md,
        },
        stickyCard: {
            backgroundColor: colors.card,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.md,
            ...shadows.card,
        },
        stickyTop: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: spacing.sm,
            marginBottom: spacing.md,
        },
        stickyLeft: {
            flex: 1,
            minWidth: 0,
        },
        stickyTitle: {
            ...typography.body,
            color: colors.text,
            fontWeight: '700',
            marginBottom: 4,
        },
        stickyAddress: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        stickyActions: {
            flexDirection: 'row',
            gap: spacing.sm,
        },
        overlayPrimaryButton: {
            flex: 1,
            minHeight: largeTouchMode ? 52 : 44,
            borderRadius: radius.md,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        overlayPrimaryButtonText: {
            color: colors.white,
            fontSize: 13,
            fontWeight: '700',
        },
        overlaySecondaryButton: {
            flex: 1,
            minHeight: largeTouchMode ? 52 : 44,
            borderRadius: radius.md,
            backgroundColor: colors.cardSoft,
            alignItems: 'center',
            justifyContent: 'center',
        },
        overlaySecondaryButtonText: {
            color: colors.text,
            fontSize: 13,
            fontWeight: '700',
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
        stopCardSelected: {
            borderColor: colors.primary,
            borderWidth: 1.5,
            backgroundColor: isDark ? colors.card : '#F7FBFF',
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