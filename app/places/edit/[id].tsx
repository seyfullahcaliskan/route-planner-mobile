// app/places/edit/[id].tsx
import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import {
    deletePlace,
    getMyPlaces,
    SavedPlaceType,
    updatePlace,
} from '@/src/api/placeService';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useApiError } from '@/src/hooks/useApiError';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useMapPickerStore } from '@/src/store/useMapPickerStore';
import { radius, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PLACE_TYPES: Array<{ key: SavedPlaceType; icon: string; labelKey: string }> = [
    { key: 'HOME', icon: '🏠', labelKey: 'places.placeTypeHome' },
    { key: 'WORK', icon: '🏢', labelKey: 'places.placeTypeWork' },
    { key: 'WAREHOUSE', icon: '📦', labelKey: 'places.placeTypeWarehouse' },
    { key: 'STORE', icon: '🏪', labelKey: 'places.placeTypeStore' },
    { key: 'CUSTOM', icon: '📍', labelKey: 'places.placeTypeCustom' },
];

export default function EditPlaceScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const { show: showError } = useApiError();
    const queryClient = useQueryClient();
    const styles = createStyles(colors);

    /**
     * Tek kaydı çekmek için ayrı bir endpoint çağrısı yapmak yerine
     * mevcut listeden okuyoruz — getMyPlaces zaten cache'te.
     * Bu sayede +1 API çağrısı yapmıyoruz.
     */
    const { data: places = [], isLoading } = useQuery({
        queryKey: ['myPlaces'],
        queryFn: getMyPlaces,
        staleTime: 60_000,
    });

    const original = places.find((p) => p.id === id);

    const [placeName, setPlaceName] = useState('');
    const [placeType, setPlaceType] = useState<SavedPlaceType>('CUSTOM');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState<number | undefined>(undefined);
    const [longitude, setLongitude] = useState<number | undefined>(undefined);
    const [isDefaultStart, setIsDefaultStart] = useState(false);
    const [isDefaultEnd, setIsDefaultEnd] = useState(false);

    // Yüklenince state'i senkronla — sadece bir kez
    useEffect(() => {
        if (original && placeName === '' && address === '') {
            setPlaceName(original.placeName);
            setPlaceType(original.placeType);
            setAddress(original.address);
            setLatitude(original.latitude);
            setLongitude(original.longitude);
            setIsDefaultStart(original.isDefaultStart);
            setIsDefaultEnd(original.isDefaultEnd);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [original]);

    useFocusEffect(
        useCallback(() => {
            const target = useMapPickerStore.getState().target;
            if (target !== 'place-create') return;
            const result = useMapPickerStore.getState().consume();
            if (result) {
                setAddress(result.address);
                setLatitude(result.latitude);
                setLongitude(result.longitude);
                haptics.success();
            }
        }, [])
    );

    const openMapPicker = () => {
        haptics.light();
        useMapPickerStore.getState().open('place-create');
        router.push('/map-picker');
    };

    const updateMutation = useMutation({
        mutationFn: () =>
            updatePlace(id!, {
                placeName: placeName.trim(),
                placeType,
                address: address.trim(),
                latitude,
                longitude,
                isDefaultStart,
                isDefaultEnd,
            }),
        onSuccess: () => {
            haptics.success();
            queryClient.invalidateQueries({ queryKey: ['myPlaces'] });
            Alert.alert(t('common.success'), t('places.updateSuccess'), [
                { text: t('common.ok'), onPress: () => router.back() },
            ]);
        },
        onError: (e) => showError(e),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deletePlace(id!),
        onSuccess: () => {
            haptics.success();
            queryClient.invalidateQueries({ queryKey: ['myPlaces'] });
            router.back();
        },
        onError: (e) => showError(e),
    });

    const confirmDelete = () => {
        Alert.alert(
            t('places.deleteConfirmTitle'),
            t('places.deleteConfirmMessage', { name: placeName }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(),
                },
            ]
        );
    };

    const dirty =
        original &&
        (placeName !== original.placeName ||
            placeType !== original.placeType ||
            address !== original.address ||
            latitude !== original.latitude ||
            longitude !== original.longitude ||
            isDefaultStart !== original.isDefaultStart ||
            isDefaultEnd !== original.isDefaultEnd);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <ActivityIndicator color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!original) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={[styles.title, { textAlign: 'center' }]}>
                    {t('errors.PLACE_NOT_FOUND')}
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    style={[styles.changeButton, { marginTop: spacing.md }]}
                >
                    <Text style={styles.changeButtonText}>{t('common.back')}</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
                    <Text style={styles.backText}>‹</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{t('places.editPlace')}</Text>
                </View>
                <Pressable onPress={confirmDelete} style={styles.deleteIconBtn}>
                    <Text style={styles.deleteIconText}>🗑️</Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={20}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.fieldLabel}>{t('places.placeName')}</Text>
                    <TextInput
                        value={placeName}
                        onChangeText={setPlaceName}
                        placeholder={t('places.placeNamePlaceholder')}
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                        maxLength={80}
                    />

                    <Text style={styles.fieldLabel}>{t('places.placeType')}</Text>
                    <View style={styles.typeRow}>
                        {PLACE_TYPES.map((tp) => (
                            <Pressable
                                key={tp.key}
                                onPress={() => {
                                    haptics.light();
                                    setPlaceType(tp.key);
                                }}
                                style={[
                                    styles.typeChip,
                                    placeType === tp.key && styles.typeChipActive,
                                ]}
                            >
                                <Text style={styles.typeChipIcon}>{tp.icon}</Text>
                                <Text
                                    style={[
                                        styles.typeChipText,
                                        placeType === tp.key && styles.typeChipTextActive,
                                    ]}
                                >
                                    {t(tp.labelKey as any)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.fieldLabel}>{t('places.savedAddress')}</Text>
                    <View style={styles.addressBox}>
                        <Text style={styles.addressText} numberOfLines={3}>
                            📍 {address}
                        </Text>
                        {latitude !== undefined && longitude !== undefined && (
                            <Text style={styles.coordsText}>
                                {latitude.toFixed(5)}, {longitude.toFixed(5)}
                            </Text>
                        )}
                        <Pressable onPress={openMapPicker} style={styles.changeButton}>
                            <Text style={styles.changeButtonText}>
                                {t('common.change')}
                            </Text>
                        </Pressable>
                    </View>

                    <AppCard style={{ marginTop: spacing.lg }}>
                        <View style={styles.toggleRow}>
                            <View style={{ flex: 1, paddingRight: spacing.sm }}>
                                <Text style={styles.toggleTitle}>
                                    ▸ {t('places.useAsDefaultStart')}
                                </Text>
                            </View>
                            <Switch
                                value={isDefaultStart}
                                onValueChange={setIsDefaultStart}
                                trackColor={{ false: colors.border, true: colors.primary }}
                            />
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.toggleRow}>
                            <View style={{ flex: 1, paddingRight: spacing.sm }}>
                                <Text style={styles.toggleTitle}>
                                    ◂ {t('places.useAsDefaultEnd')}
                                </Text>
                            </View>
                            <Switch
                                value={isDefaultEnd}
                                onValueChange={setIsDefaultEnd}
                                trackColor={{ false: colors.border, true: colors.primary }}
                            />
                        </View>
                    </AppCard>

                    <PrimaryButton
                        title={
                            updateMutation.isPending
                                ? t('common.saving')
                                : t('common.update')
                        }
                        onPress={() => updateMutation.mutate()}
                        disabled={
                            !placeName.trim() ||
                            !address.trim() ||
                            latitude === undefined ||
                            longitude === undefined ||
                            !dirty ||
                            updateMutation.isPending
                        }
                        style={{ marginTop: spacing.lg }}
                    />

                    <Pressable
                        onPress={confirmDelete}
                        style={({ pressed }) => [
                            styles.deleteButton,
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <Text style={styles.deleteButtonText}>
                            🗑️ {t('common.delete')}
                        </Text>
                    </Pressable>

                    <View style={{ height: spacing.xl }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
    StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.page },
        center: { alignItems: 'center', justifyContent: 'center' },

        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
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
        title: { ...typography.heading, color: colors.text },
        deleteIconBtn: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.cardSoft,
            alignItems: 'center',
            justifyContent: 'center',
        },
        deleteIconText: { fontSize: 18 },

        content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

        fieldLabel: {
            ...typography.bodySmall,
            color: colors.text,
            fontWeight: '600',
            marginTop: spacing.md,
            marginBottom: 6,
        },
        input: {
            minHeight: 48,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.cardSoft,
            color: colors.text,
            paddingHorizontal: spacing.md,
        },

        typeRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginBottom: spacing.sm,
        },
        typeChip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.pill,
            borderWidth: 1.5,
            borderColor: colors.border,
            backgroundColor: colors.cardSoft,
        },
        typeChipActive: {
            borderColor: colors.primary,
            backgroundColor: colors.primarySoft,
        },
        typeChipIcon: { fontSize: 16 },
        typeChipText: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            fontWeight: '600',
        },
        typeChipTextActive: { color: colors.primary, fontWeight: '700' },

        addressBox: {
            padding: spacing.md,
            borderRadius: radius.lg,
            backgroundColor: colors.cardSoft,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
        },
        addressText: {
            ...typography.body,
            color: colors.text,
            fontWeight: '500',
        },
        coordsText: {
            ...typography.caption,
            color: colors.textMuted,
            marginTop: 4,
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        },
        changeButton: {
            marginTop: spacing.sm,
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        changeButtonText: {
            ...typography.caption,
            color: colors.primary,
            fontWeight: '700',
        },

        toggleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing.sm,
            minHeight: 48,
        },
        toggleTitle: {
            ...typography.body,
            color: colors.text,
            fontWeight: '600',
        },
        divider: { height: 1, marginVertical: spacing.xs ?? 4 },

        deleteButton: {
            marginTop: spacing.md,
            paddingVertical: spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.lg,
        },
        deleteButtonText: {
            ...typography.body,
            color: colors.danger,
            fontWeight: '700',
        },
    });
