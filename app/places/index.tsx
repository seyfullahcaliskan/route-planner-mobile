// app/places/index.tsx
import { getMyPlaces, SavedPlaceType } from '@/src/api/placeService';
import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { radius, spacing, typography } from '@/src/theme';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
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
    const styles = createStyles(colors);

    const { data: places = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['myPlaces'],
        queryFn: getMyPlaces,
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.helperText}>{t('common.loading')}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <FlatList
                data={places}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.content}
                refreshing={isRefetching}
                onRefresh={refetch}
                ListHeaderComponent={
                    <View style={{ marginBottom: spacing.lg }}>
                        <Text style={styles.title}>{t('places.title')}</Text>
                        <Text style={styles.subtitle}>
                            Sık kullandığın adresleri kaydet, rotada hızlıca seç
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.placeCard}>
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
                                        <Text style={styles.tag}>Varsayılan başlangıç</Text>
                                    )}
                                    {item.isDefaultEnd && (
                                        <Text style={styles.tag}>Varsayılan bitiş</Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <AppCard style={styles.emptyCard}>
                        <Text style={styles.emptyIcon}>📍</Text>
                        <Text style={styles.emptyTitle}>{t('places.emptyTitle')}</Text>
                        <Text style={styles.emptyDesc}>{t('places.emptySubtitle')}</Text>
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
        },
        content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
        helperText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },

        title: { ...typography.titleLarge, color: colors.text },
        subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },

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

        tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
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
            marginBottom: spacing.xs,
        },
        emptyDesc: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            textAlign: 'center',
        },
    });