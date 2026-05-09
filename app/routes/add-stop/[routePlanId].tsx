// app/routes/add-stop/[routePlanId].tsx
import AppCard from '@/src/components/AppCard';
import PlacePickerSheet, { PickedLocation } from '@/src/components/PlacePickerSheet';
import PrimaryButton from '@/src/components/PrimaryButton';
import { addStopsAndReoptimize } from '@/src/api/routeService';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useApiError } from '@/src/hooks/useApiError';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useMapPickerStore } from '@/src/store/useMapPickerStore';
import { radius, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Yola çıkmışken bir durak ekleme ekranı.
 *
 * Akış:
 *   1) Kullanıcı PlacePickerSheet'ten ya kayıtlı yer seçer ya manuel adres girer ya haritadan seçer
 *   2) Müşteri adı / telefon / not opsiyonel
 *   3) "Ekle ve Yeniden Sırala" → tek API çağrısı:
 *      POST /route-plans/{id}/stops-and-reoptimize
 *      Backend yeni durağı ekler + reoptimize çalıştırır + listeyi döner.
 *   4) React Query cache invalidate edilir → rota detay ekranı otomatik yenilenir.
 */
export default function AddStopScreen() {
    const { routePlanId } = useLocalSearchParams<{ routePlanId: string }>();
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const { show: showError } = useApiError();
    const queryClient = useQueryClient();
    const styles = createStyles(colors);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState<number | undefined>(undefined);
    const [longitude, setLongitude] = useState<number | undefined>(undefined);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');

    /**
     * Map picker'dan dönüş (PlacePickerSheet "Haritadan Seç" CTA → /map-picker)
     */
    useFocusEffect(
        useCallback(() => {
            const target = useMapPickerStore.getState().target;
            if (target !== 'import-manual-stop') return;
            const result = useMapPickerStore.getState().consume();
            if (result) {
                setAddress(result.address);
                setLatitude(result.latitude);
                setLongitude(result.longitude);
                haptics.success();
            }
        }, [])
    );

    const handlePicked = (loc: PickedLocation) => {
        setAddress(loc.address);
        setLatitude(loc.latitude);
        setLongitude(loc.longitude);
    };

    const mutation = useMutation({
        mutationFn: () =>
            addStopsAndReoptimize(routePlanId!, [
                {
                    rawAddress: address.trim(),
                    latitude,
                    longitude,
                    customerName: customerName.trim() || undefined,
                    customerPhone: customerPhone.trim() || undefined,
                    deliveryNote: deliveryNote.trim() || undefined,
                },
            ]),
        onSuccess: () => {
            haptics.success();
            // Rota detay ve durak listelerini invalidate et — tek seferde
            queryClient.invalidateQueries({ queryKey: ['routeStops', routePlanId] });
            queryClient.invalidateQueries({ queryKey: ['userRoutes'] });
            Alert.alert(t('common.success'), t('route.addStopSuccess'), [
                { text: t('common.ok'), onPress: () => router.back() },
            ]);
        },
        onError: (e) => showError(e),
    });

    const canSubmit = address.trim().length > 0 && !mutation.isPending;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
                    <Text style={styles.backText}>‹</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{t('route.addStopTitle')}</Text>
                    <Text style={styles.subtitle}>{t('route.addStopSubtitle')}</Text>
                </View>
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
                    {/* Adres / picker */}
                    <Text style={styles.fieldLabel}>{t('import.address')}</Text>
                    {address ? (
                        <View style={styles.addressBox}>
                            <Text style={styles.addressText} numberOfLines={3}>
                                📍 {address}
                            </Text>
                            {latitude !== undefined && longitude !== undefined && (
                                <Text style={styles.coordsText}>
                                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                                </Text>
                            )}
                            <Pressable
                                onPress={() => setPickerOpen(true)}
                                style={styles.changeButton}
                            >
                                <Text style={styles.changeButtonText}>
                                    {t('common.change')}
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable
                            onPress={() => setPickerOpen(true)}
                            style={styles.pickerCta}
                        >
                            <Text style={styles.pickerCtaText}>
                                ⭐ {t('places.pickerTitle')}
                            </Text>
                            <Text style={styles.pickerCtaHint}>
                                {t('places.pickerSavedTab')} • {t('places.pickerMapTab')} • {t('places.pickerManualTab')}
                            </Text>
                        </Pressable>
                    )}

                    {/* Müşteri bilgisi (opsiyonel) */}
                    <Text style={styles.fieldLabel}>{t('import.customerName')}</Text>
                    <TextInput
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder={`${t('common.optional')}`}
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                    />

                    <Text style={styles.fieldLabel}>{t('import.customerPhone')}</Text>
                    <TextInput
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                        placeholder={`${t('common.optional')}`}
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.fieldLabel}>{t('import.deliveryNote')}</Text>
                    <TextInput
                        value={deliveryNote}
                        onChangeText={setDeliveryNote}
                        placeholder={`${t('common.optional')}`}
                        placeholderTextColor={colors.textMuted}
                        style={[styles.input, styles.textArea]}
                        multiline
                    />

                    <AppCard soft style={{ marginTop: spacing.md }}>
                        <Text style={styles.tipText}>
                            💡 {t('route.addStopSubtitle')}
                        </Text>
                    </AppCard>

                    <PrimaryButton
                        title={
                            mutation.isPending
                                ? t('route.addingStop')
                                : t('route.addStopAndOptimize')
                        }
                        onPress={() => mutation.mutate()}
                        disabled={!canSubmit}
                        style={{ marginTop: spacing.lg }}
                    />

                    <View style={{ height: spacing.xl }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {mutation.isPending && (
                <View pointerEvents="none" style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>{t('route.addingStop')}</Text>
                </View>
            )}

            <PlacePickerSheet
                visible={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onPick={handlePicked}
                mapPickerTarget="import-manual-stop"
                title={t('route.addStopTitle')}
            />
        </SafeAreaView>
    );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
    StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.page },

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
        subtitle: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            marginTop: 2,
        },

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
        textArea: {
            minHeight: 80,
            paddingTop: 12,
            textAlignVertical: 'top',
        },

        pickerCta: {
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.md,
            borderRadius: radius.lg,
            backgroundColor: colors.primarySoft,
            borderWidth: 1.5,
            borderColor: colors.primary,
            alignItems: 'center',
            gap: 4,
        },
        pickerCtaText: {
            ...typography.body,
            color: colors.primary,
            fontWeight: '700',
        },
        pickerCtaHint: {
            ...typography.caption,
            color: colors.primary,
            opacity: 0.7,
        },

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

        tipText: {
            ...typography.caption,
            color: colors.textSecondary,
            lineHeight: 18,
        },

        loadingOverlay: {
            position: 'absolute',
            bottom: spacing.xl,
            alignSelf: 'center',
            backgroundColor: colors.card,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
        },
        loadingText: {
            ...typography.bodySmall,
            color: colors.text,
            fontWeight: '600',
        },
    });
