// src/components/LocationPicker.tsx
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getMyPlaces, SavedPlaceType, UserSavedPlace } from '@/src/api/placeService';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAuthStore } from '@/src/store/useAuthStore';
import { MapPickerTarget, useMapPickerStore } from '@/src/store/useMapPickerStore';
import { radius, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';

export type LocationValue = {
    address: string;
    latitude?: number;
    longitude?: number;
};

type Props = {
    value: LocationValue;
    onChange: (v: LocationValue) => void;
    mapPickerTarget: MapPickerTarget;
    /** Etiket: "Başlangıç noktasını seç" gibi */
    placeholder?: string;
    /** false → kayıtlı yerler kısmını gizler (sadece harita) */
    showSavedPlaces?: boolean;
};

const PLACE_ICON: Record<SavedPlaceType, string> = {
    HOME: '🏠',
    WORK: '🏢',
    WAREHOUSE: '📦',
    STORE: '🏪',
    CUSTOM: '📍',
};

export default function LocationPicker({
    value,
    onChange,
    mapPickerTarget,
    placeholder,
    showSavedPlaces = true,
}: Props) {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const userId = useAuthStore((s) => s.user?.id);

    const styles = createStyles(colors);

    const { data: places = [] } = useQuery({
        queryKey: ['myPlaces', userId],
        queryFn: getMyPlaces,
        enabled: !!userId && showSavedPlaces,
        staleTime: 60_000,
    });

    const isSelected = (value.latitude !== undefined && value.longitude !== undefined) ||
        value.address.trim().length > 0;

    const openMapPicker = () => {
        haptics.light();
        useMapPickerStore.getState().open(mapPickerTarget);
        router.push('/map-picker');
    };

    const handlePickSaved = (p: UserSavedPlace) => {
        haptics.success();
        onChange({
            address: p.address,
            latitude: p.latitude,
            longitude: p.longitude,
        });
    };

    const handleClear = () => {
        haptics.light();
        onChange({ address: '', latitude: undefined, longitude: undefined });
    };

    // ─────────────────────────────────────────────────
    // SELECTED — adres + Değiştir
    // ─────────────────────────────────────────────────
    if (isSelected) {
        return (
            <View style={styles.selectedRow}>
                <Text style={styles.selectedAddress} numberOfLines={2}>
                    {value.address || `${value.latitude?.toFixed(5)}, ${value.longitude?.toFixed(5)}`}
                </Text>
                <Pressable onPress={handleClear} style={styles.editPill}>
                    <Text style={styles.editPillText}>Değiştir</Text>
                </Pressable>
            </View>
        );
    }

    // ─────────────────────────────────────────────────
    // EMPTY — saved place chips + map button
    // ─────────────────────────────────────────────────
    return (
        <View style={{ gap: spacing.sm }}>
            {showSavedPlaces && places.length > 0 && (
                <View>
                    <Text style={styles.sectionLabel}>Kayıtlı yerlerin</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipsRow}
                    >
                        {places.map((p) => (
                            <Pressable
                                key={p.id}
                                onPress={() => handlePickSaved(p)}
                                style={({ pressed }) => [
                                    styles.placeChip,
                                    pressed && styles.placeChipPressed,
                                ]}
                            >
                                <Text style={styles.placeChipIcon}>{PLACE_ICON[p.placeType] ?? '📍'}</Text>
                                <View style={{ maxWidth: 140 }}>
                                    <Text style={styles.placeChipName} numberOfLines={1}>
                                        {p.placeName}
                                    </Text>
                                    <Text style={styles.placeChipAddr} numberOfLines={1}>
                                        {p.address}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            )}

            <Pressable onPress={openMapPicker} style={styles.mapButton}>
                <Text style={styles.mapButtonText}>📍 {t('import.pickOnMap')}</Text>
            </Pressable>

            {placeholder && places.length === 0 && (
                <Text style={styles.placeholderHint}>{placeholder}</Text>
            )}
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
    StyleSheet.create({
        selectedRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            borderRadius: radius.lg,
            backgroundColor: colors.cardSoft,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
        },
        selectedAddress: {
            ...typography.body,
            color: colors.text,
            flex: 1,
            fontWeight: '500',
        },
        editPill: {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        editPillText: {
            ...typography.caption,
            color: colors.primary,
            fontWeight: '700',
        },

        sectionLabel: {
            ...typography.caption,
            color: colors.textMuted,
            fontWeight: '600',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        chipsRow: { gap: spacing.sm, paddingRight: spacing.sm },

        placeChip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.lg,
            backgroundColor: colors.cardSoft,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 56,
        },
        placeChipPressed: {
            opacity: 0.7,
            transform: [{ scale: 0.97 }],
        },
        placeChipIcon: { fontSize: 20 },
        placeChipName: {
            ...typography.bodySmall,
            color: colors.text,
            fontWeight: '700',
        },
        placeChipAddr: {
            ...typography.caption,
            color: colors.textSecondary,
            marginTop: 1,
        },

        mapButton: {
            minHeight: 48,
            borderRadius: radius.lg,
            backgroundColor: colors.primarySoft,
            borderWidth: 1,
            borderColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        mapButtonText: {
            ...typography.body,
            color: colors.primary,
            fontWeight: '700',
        },

        placeholderHint: {
            ...typography.caption,
            color: colors.textMuted,
            textAlign: 'center',
            marginTop: 4,
        },
    });