// app/places/index.tsx
import { getMyPlaces, SavedPlaceType, UserSavedPlace } from '@/src/api/placeService';
import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useApiError } from '@/src/hooks/useApiError';
import { useTranslation } from '@/src/hooks/useTranslation';
import { radius, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';
import { useQuery } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PLACE_ICON: Record<SavedPlaceType, string> = {
    HOME: '🏠',
    WORK: '🏢',
    WAREHOUSE: '📦',
    STORE: '🏪',
    CUSTOM: '📍',
};

export default function PlacesScreen() {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const { show: showError } = useApiError();
    const styles = createStyles(colors);

    const { data: places = [], isLoading, isError, error, refetch, isRefetching } = useQuery({
        queryKey: ['myPlaces'],
        queryFn: getMyPlaces,
    });

    if (isError) {
        // Sessizce göstermek yerine retry butonu
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>{t('common.somethingWentWrong')}</Text>
                <PrimaryButton
                    title={t('common.retry')}
                    onPress={() => refetch()}
                    style={{ marginTop: spacing.md, paddingHorizontal: spacing.xl }}
                />
            </SafeAreaView>
        );
    }

    if (isLoading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.helperText}>{t('common.loading')}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <FlatList
                data={places}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.content}
                refreshing={isRefetching}
                onRefresh={refetch}
                ListHeaderComponent={
                    <View style={{ marginBottom: spacing.lg }}>
                        <View style={styles.headerRow}>
                            <Pressable
                                onPress={() => router.back()}
                                style={styles.backBtn}
                                hitSlop={12}
                            >
                                <Text style={styles.backText}>‹</Text>
                            </Pressable>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{t('places.title')}</Text>
                                <Text style={styles.subtitle}>
                                    {t('places.subtitle')}
                                </Text>
                            </View>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => {
                            haptics.light();
                            router.push(`/places/edit/${item.id}`);
                        }}
                        style={({ pressed }) => [
                            styles.placeCard,
                            pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] },
                        ]}
                    >
                        <Text style={styles.placeIcon}>
                            {PLACE_ICON[item.placeType] ?? '📍'}
                        </Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.placeName} numberOfLines={1}>
                                {item.placeName}
                            </Text>
                            <Text style={styles.placeAddr} numberOfLines={2}>
                                {item.address}
                            </Text>
                            {(item.isDefaultStart || item.isDefaultEnd) && (
                                <View style={styles.tagRow}>
                                    {item.isDefaultStart && (
                                        <Text style={styles.tag}>
                                            ▸ {t('places.defaultStart')}
                                        </Text>
                                    )}
                                    {item.isDefaultEnd && (
                                        <Text style={styles.tag}>
                                            ◂ {t('places.defaultEnd')}
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </Pressable>
                )}
                ListEmptyComponent={
                    <AppCard style={styles.emptyCard}>
                        <Text style={styles.emptyIcon}>📍</Text>
                        <Text style={styles.emptyTitle}>{t('places.emptyTitle')}</Text>
                        <Text style={styles.emptyDesc}>
                            {t('places.emptySubtitle')}
                        </Text>
                    </AppCard>
                }
                ListFooterComponent={
                    <View style={{ marginTop: spacing.lg }}>
                        <PrimaryButton
                            title={`+ ${t('places.addPlace')}`}
                            onPress={() => router.push('/places/create')}
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
        centered: {
            flex: 1,
            backgroundColor: colors.page,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
        },
        content: { padding: spacing.lg, paddingBottom: spacing.xxxl ?? 80 },
        helperText: {
            ...typography.body,
            color: colors.textSecondary,
            marginTop: spacing.md,
        },
        errorIcon: { fontSize: 48, marginBottom: spacing.sm },
        errorTitle: {
            ...typography.heading,
            color: colors.text,
            textAlign: 'center',
        },

        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
        },
        backBtn: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.cardSoft,
            alignItems: 'center',
            justifyContent: 'center',
        },
        backText: {
            fontSize: 26,
            color: colors.text,
            fontWeight: '300',
            marginTop: -3,
        },
        title: { ...typography.titleLarge ?? typography.heading, color: colors.text },
        subtitle: {
            ...typography.body,
            color: colors.textSecondary,
            marginTop: 4,
        },

        placeCard: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.md,
            borderRadius: radius.lg,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: spacing.sm,
        },
        placeIcon: { fontSize: 28 },
        placeName: {
            ...typography.body,
            color: colors.text,
            fontWeight: '700',
        },
        placeAddr: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            marginTop: 2,
        },
        chevron: {
            fontSize: 26,
            color: colors.textMuted,
            fontWeight: '300',
        },

        tagRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 6,
        },
        tag: {
            ...typography.caption,
            color: colors.primary,
            backgroundColor: colors.primarySoft,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: radius.sm,
            fontWeight: '700',
        },

        emptyCard: {
            alignItems: 'center',
            paddingVertical: spacing.xl,
        },
        emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
        emptyTitle: {
            ...typography.heading,
            color: colors.text,
            marginBottom: spacing.xs ?? 4,
        },
        emptyDesc: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            textAlign: 'center',
        },
    });
