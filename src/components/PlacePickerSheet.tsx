// src/components/PlacePickerSheet.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    createPlace,
    getMyPlaces,
    SavedPlaceType,
    UserSavedPlace,
} from '../api/placeService';
import { useAppTheme } from '../hooks/useAppTheme';
import { useApiError } from '../hooks/useApiError';
import { useTranslation } from '../hooks/useTranslation';
import { MapPickerTarget, useMapPickerStore } from '../store/useMapPickerStore';
import { radius, shadows, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';

export type PickedLocation = {
    address: string;
    latitude?: number;
    longitude?: number;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    onPick: (loc: PickedLocation) => void;
    /** Map picker'a hangi target ile gidilsin? */
    mapPickerTarget: MapPickerTarget;
    title?: string;
};

const PLACE_ICON: Record<SavedPlaceType, string> = {
    HOME: '🏠',
    WORK: '🏢',
    WAREHOUSE: '📦',
    STORE: '🏪',
    CUSTOM: '📍',
};

type Tab = 'saved' | 'manual';

/**
 * Premium konum seçici — bottom sheet.
 *
 * Üç sekme:
 *   1) Kayıtlılar  — listeden direkt seç
 *   2) Manuel      — adres yaz + opsiyonel "kaydet" toggle
 *
 * Ayrıca üstte "Haritadan Seç" CTA → map-picker route'una yönlendirir,
 * geri dönüldüğünde useMapPickerStore'dan değer okunur (parent ekran tetikler).
 *
 * Tasarım kararları:
 *   - Modal'ı kapatmadan haritaya gitmiyoruz; çünkü harita-picker tüm ekranı kaplar.
 *     Onun yerine: parent ekranda zaten useFocusEffect ile sonuç dinleniyor → bu sheet
 *     "Haritadan Seç"e basıldığında onClose() çağırır + map-picker'ı açar.
 */
export default function PlacePickerSheet({
    visible,
    onClose,
    onPick,
    mapPickerTarget,
    title,
}: Props) {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const { show: showError } = useApiError();
    const queryClient = useQueryClient();
    const styles = createStyles(colors);

    const [tab, setTab] = useState<Tab>('saved');
    const [search, setSearch] = useState('');

    // Manual tab state
    const [manualName, setManualName] = useState('');
    const [manualAddress, setManualAddress] = useState('');
    const [manualType, setManualType] = useState<SavedPlaceType>('CUSTOM');
    const [saveAfter, setSaveAfter] = useState(false);

    // Animasyon
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            slideAnim.setValue(0);
            // reset
            setSearch('');
            setManualName('');
            setManualAddress('');
            setManualType('CUSTOM');
            setSaveAfter(false);
            setTab('saved');
        }
    }, [visible, slideAnim]);

    const { data: places = [], isLoading } = useQuery({
        queryKey: ['myPlaces'],
        queryFn: getMyPlaces,
        enabled: visible,
        staleTime: 60_000,
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return places;
        return places.filter(
            (p) =>
                p.placeName.toLowerCase().includes(q) ||
                p.address.toLowerCase().includes(q)
        );
    }, [places, search]);

    const createMutation = useMutation({
        mutationFn: createPlace,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myPlaces'] });
        },
    });

    const handleSelectSaved = (p: UserSavedPlace) => {
        haptics.success();
        onPick({
            address: p.address,
            latitude: p.latitude,
            longitude: p.longitude,
        });
        onClose();
    };

    const handleOpenMap = () => {
        haptics.light();
        useMapPickerStore.getState().open(mapPickerTarget);
        onClose();
        // Bir tick sonra map-picker'a git — modal kapanma animasyonu engelin önüne geçmesin
        setTimeout(() => {
            router.push('/map-picker');
        }, 50);
    };

    const handleManualSubmit = async () => {
        if (!manualAddress.trim()) return;
        haptics.success();

        const picked: PickedLocation = {
            address: manualAddress.trim(),
            // koordinat yok — backend geocode edecek
        };

        // Eğer "kaydet" işaretliyse + isim verildiyse arka planda kayıtlı yer oluştur.
        // Hata olsa bile picked değerini parent'a iletmeye devam ediyoruz.
        if (saveAfter && manualName.trim()) {
            try {
                // Manuel girişlerde lat/lng yok — backend bu durumda kayıt için lat/lng zorunlu;
                // bu yüzden "saveAfter" ancak haritadan gelen lokasyonlar için anlamlı.
                // Burada güvenli tarafta kalıp uyarı gösteriyoruz.
                showError(
                    new Error(
                        t('errors.PLACE_COORDS_REQUIRED')
                    ),
                    { title: t('common.warning') }
                );
            } catch (e) {
                // yutuyoruz — picked yine de iletilecek
            }
        }

        onPick(picked);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={{ flex: 1 }} onPress={(e) => e.stopPropagation()}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.kavWrap}
                    >
                        <Animated.View
                            style={[
                                styles.sheet,
                                {
                                    transform: [
                                        {
                                            translateY: slideAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [600, 0],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            {/* Drag handle */}
                            <View style={styles.handle} />

                            <Text style={styles.title}>
                                {title ?? t('places.pickerTitle')}
                            </Text>

                            {/* Tab seçici */}
                            <View style={styles.tabs}>
                                <Pressable
                                    onPress={() => setTab('saved')}
                                    style={[styles.tab, tab === 'saved' && styles.tabActive]}
                                >
                                    <Text
                                        style={[
                                            styles.tabText,
                                            tab === 'saved' && styles.tabTextActive,
                                        ]}
                                    >
                                        ⭐ {t('places.pickerSavedTab')}
                                        {places.length > 0 ? ` (${places.length})` : ''}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setTab('manual')}
                                    style={[styles.tab, tab === 'manual' && styles.tabActive]}
                                >
                                    <Text
                                        style={[
                                            styles.tabText,
                                            tab === 'manual' && styles.tabTextActive,
                                        ]}
                                    >
                                        ✍️ {t('places.pickerManualTab')}
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Üstte daima görünür "Haritadan Seç" CTA */}
                            <Pressable
                                onPress={handleOpenMap}
                                style={({ pressed }) => [
                                    styles.mapCta,
                                    pressed && { opacity: 0.85 },
                                ]}
                            >
                                <Text style={styles.mapCtaText}>
                                    {t('places.pickerOpenMap')}
                                </Text>
                            </Pressable>

                            <View style={styles.divider} />

                            {/* TAB IÇERIKLERI */}
                            {tab === 'saved' ? (
                                <View style={{ flex: 1 }}>
                                    <TextInput
                                        value={search}
                                        onChangeText={setSearch}
                                        placeholder={t('places.pickerSearch')}
                                        placeholderTextColor={colors.textMuted}
                                        style={styles.searchInput}
                                    />
                                    <ScrollView
                                        keyboardShouldPersistTaps="handled"
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={{ paddingBottom: spacing.xl }}
                                    >
                                        {isLoading ? (
                                            <Text style={styles.helperText}>
                                                {t('common.loading')}
                                            </Text>
                                        ) : filtered.length === 0 ? (
                                            <View style={styles.emptyBox}>
                                                <Text style={styles.emptyIcon}>📍</Text>
                                                <Text style={styles.emptyText}>
                                                    {places.length === 0
                                                        ? t('places.pickerNoSaved')
                                                        : t('common.empty')}
                                                </Text>
                                            </View>
                                        ) : (
                                            filtered.map((p) => (
                                                <Pressable
                                                    key={p.id}
                                                    onPress={() => handleSelectSaved(p)}
                                                    style={({ pressed }) => [
                                                        styles.placeRow,
                                                        pressed && { opacity: 0.7 },
                                                    ]}
                                                >
                                                    <Text style={styles.placeRowIcon}>
                                                        {PLACE_ICON[p.placeType] ?? '📍'}
                                                    </Text>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={styles.placeRowTopline}>
                                                            <Text
                                                                style={styles.placeRowName}
                                                                numberOfLines={1}
                                                            >
                                                                {p.placeName}
                                                            </Text>
                                                            {(p.isDefaultStart || p.isDefaultEnd) && (
                                                                <Text style={styles.defaultBadge}>
                                                                    {p.isDefaultStart ? '▸' : '◂'}{' '}
                                                                    {p.isDefaultStart
                                                                        ? t('places.defaultStart')
                                                                        : t('places.defaultEnd')}
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <Text
                                                            style={styles.placeRowAddr}
                                                            numberOfLines={2}
                                                        >
                                                            {p.address}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            ) : (
                                // MANUAL TAB
                                <ScrollView
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: spacing.xl }}
                                >
                                    <Text style={styles.fieldLabel}>{t('import.address')}</Text>
                                    <TextInput
                                        value={manualAddress}
                                        onChangeText={setManualAddress}
                                        placeholder="Mahalle, sokak, no..."
                                        placeholderTextColor={colors.textMuted}
                                        multiline
                                        style={[styles.input, styles.textArea]}
                                    />

                                    <Text style={styles.tipText}>
                                        💡 Adresi haritadan seçmek daha hassas — rastgele
                                        şehirde bulunmuyor olabilir.
                                    </Text>

                                    <Pressable
                                        onPress={handleManualSubmit}
                                        disabled={!manualAddress.trim()}
                                        style={({ pressed }) => [
                                            styles.submitButton,
                                            !manualAddress.trim() && { opacity: 0.5 },
                                            pressed && { opacity: 0.85 },
                                        ]}
                                    >
                                        <Text style={styles.submitButtonText}>
                                            {t('common.confirm')}
                                        </Text>
                                    </Pressable>
                                </ScrollView>
                            )}

                            <Pressable
                                onPress={onClose}
                                style={({ pressed }) => [
                                    styles.cancelButton,
                                    pressed && { opacity: 0.7 },
                                ]}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {t('common.cancel')}
                                </Text>
                            </Pressable>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
    StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
        },
        kavWrap: { justifyContent: 'flex-end' },
        sheet: {
            backgroundColor: colors.card,
            borderTopLeftRadius: radius.xxl,
            borderTopRightRadius: radius.xxl,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xl,
            maxHeight: '85%',
            ...shadows.card,
        },
        handle: {
            alignSelf: 'center',
            width: 38,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.border,
            marginVertical: spacing.sm,
        },
        title: {
            ...typography.heading,
            color: colors.text,
            marginBottom: spacing.md,
            textAlign: 'center',
        },
        tabs: {
            flexDirection: 'row',
            backgroundColor: colors.cardSoft,
            borderRadius: radius.md,
            padding: 4,
            gap: 4,
            marginBottom: spacing.md,
        },
        tab: {
            flex: 1,
            paddingVertical: 10,
            borderRadius: radius.md,
            alignItems: 'center',
        },
        tabActive: {
            backgroundColor: colors.card,
            ...shadows.button,
        },
        tabText: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            fontWeight: '600',
        },
        tabTextActive: {
            color: colors.primary,
            fontWeight: '700',
        },
        mapCta: {
            minHeight: 50,
            borderRadius: radius.lg,
            backgroundColor: colors.primarySoft,
            borderWidth: 1.5,
            borderColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
        },
        mapCtaText: {
            ...typography.body,
            color: colors.primary,
            fontWeight: '700',
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
            marginBottom: spacing.md,
        },
        searchInput: {
            minHeight: 44,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.cardSoft,
            color: colors.text,
            paddingHorizontal: spacing.md,
            marginBottom: spacing.sm,
        },
        helperText: {
            ...typography.bodySmall,
            color: colors.textMuted,
            textAlign: 'center',
            paddingVertical: spacing.lg,
        },
        emptyBox: {
            alignItems: 'center',
            paddingVertical: spacing.xl,
        },
        emptyIcon: { fontSize: 36, marginBottom: spacing.sm },
        emptyText: {
            ...typography.bodySmall,
            color: colors.textMuted,
            textAlign: 'center',
        },
        placeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.cardSoft,
            marginBottom: 6,
        },
        placeRowIcon: { fontSize: 24 },
        placeRowTopline: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            flexWrap: 'wrap',
        },
        placeRowName: {
            ...typography.body,
            color: colors.text,
            fontWeight: '700',
        },
        placeRowAddr: {
            ...typography.caption,
            color: colors.textSecondary,
            marginTop: 2,
        },
        defaultBadge: {
            ...typography.caption,
            color: colors.primary,
            backgroundColor: colors.primarySoft,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: radius.sm,
            fontSize: 10,
            fontWeight: '700',
        },

        fieldLabel: {
            ...typography.bodySmall,
            color: colors.text,
            fontWeight: '600',
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
            marginBottom: spacing.md,
        },
        textArea: {
            minHeight: 84,
            paddingTop: 12,
            textAlignVertical: 'top',
        },
        tipText: {
            ...typography.caption,
            color: colors.textMuted,
            marginBottom: spacing.md,
            lineHeight: 16,
        },
        submitButton: {
            minHeight: 50,
            borderRadius: radius.lg,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing.sm,
            ...shadows.button,
        },
        submitButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '700',
        },
        cancelButton: {
            minHeight: 44,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing.sm,
        },
        cancelButtonText: {
            ...typography.body,
            color: colors.textSecondary,
            fontWeight: '600',
        },
    });
