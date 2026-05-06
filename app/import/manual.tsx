// app/import/manual.tsx
import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useMapPickerStore } from '@/src/store/useMapPickerStore';
import { useRouteImportStore } from '@/src/store/useRouteImportStore';
import { radius, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManualImportScreen() {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const { addStop } = useRouteImportStore();
    const styles = createStyles(colors);

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [rawAddress, setRawAddress] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');
    const [priorityNo, setPriorityNo] = useState('0');
    const [latitude, setLatitude] = useState<number | undefined>(undefined);
    const [longitude, setLongitude] = useState<number | undefined>(undefined);

    /** Map picker'dan dönüldüğünde sonucu yakala. */
    useFocusEffect(
        useCallback(() => {
            const result = useMapPickerStore.getState().consume();
            if (result && useMapPickerStore.getState().target === null) {
                // consume() target'i de null'lar; result varsa target'imiz biziz demek
            }
            if (result) {
                setRawAddress(result.address);
                setLatitude(result.latitude);
                setLongitude(result.longitude);
            }
        }, [])
    );

    const handlePickOnMap = () => {
        haptics.light();
        useMapPickerStore.getState().open('import-manual-stop');
        router.push('/map-picker');
    };

    const handleAdd = () => {
        if (!rawAddress.trim() && (latitude === undefined || longitude === undefined)) {
            Alert.alert(t('common.warning'), t('import.addressEmpty'));
            return;
        }

        addStop({
            customerName: customerName || undefined,
            customerPhone: customerPhone || undefined,
            rawAddress: rawAddress.trim() || `${latitude?.toFixed(5)}, ${longitude?.toFixed(5)}`,
            deliveryNote: deliveryNote || undefined,
            priorityNo: Number(priorityNo || '0'),
            latitude,
            longitude,
        });

        haptics.success();
        // Reset
        setCustomerName('');
        setCustomerPhone('');
        setRawAddress('');
        setDeliveryNote('');
        setPriorityNo('0');
        setLatitude(undefined);
        setLongitude(undefined);

        Alert.alert(t('common.success'), t('import.addressAdded'));
    };

    const hasCoords = latitude !== undefined && longitude !== undefined;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>{t('import.manualTitle')}</Text>

                <AppCard>
                    <Text style={styles.label}>{t('import.customerName')}</Text>
                    <TextInput
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder={t('common.optional')}
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                    />

                    <Text style={styles.label}>{t('import.customerPhone')}</Text>
                    <TextInput
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                        placeholder={t('common.optional')}
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        style={styles.input}
                    />

                    <Text style={styles.label}>{t('import.address')}</Text>
                    <TextInput
                        value={rawAddress}
                        onChangeText={(v) => {
                            setRawAddress(v);
                            // Manuel düzenleme yapıldıysa eski koordinatları temizle
                            // (kullanıcı haritadan farklı bir adresi yazıyor olabilir)
                            if (hasCoords && v !== rawAddress) {
                                setLatitude(undefined);
                                setLongitude(undefined);
                            }
                        }}
                        placeholder={t('import.address')}
                        placeholderTextColor={colors.textMuted}
                        multiline
                        style={[styles.input, styles.textArea]}
                    />

                    {/* Haritadan Seç butonu */}
                    <Pressable onPress={handlePickOnMap} style={styles.mapButton}>
                        <Text style={styles.mapButtonText}>📍 {t('import.pickOnMap')}</Text>
                    </Pressable>

                    {hasCoords && (
                        <View style={styles.coordsBadge}>
                            <Text style={styles.coordsBadgeText}>
                                ✓ {t('import.coordsSelected')} (
                                {latitude!.toFixed(5)}, {longitude!.toFixed(5)})
                            </Text>
                        </View>
                    )}

                    <Text style={styles.label}>{t('import.deliveryNote')}</Text>
                    <TextInput
                        value={deliveryNote}
                        onChangeText={setDeliveryNote}
                        placeholder={t('common.optional')}
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                    />

                    <Text style={styles.label}>{t('import.priority')}</Text>
                    <TextInput
                        value={priorityNo}
                        onChangeText={setPriorityNo}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                    />

                    <View style={styles.buttonGroup}>
                        <PrimaryButton title={t('import.addAddress')} onPress={handleAdd} />
                        <PrimaryButton
                            title={t('import.backToList')}
                            onPress={() => router.push({ pathname: '/import' })}
                        />
                    </View>
                </AppCard>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.page },
        content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
        title: { ...typography.titleLarge, color: colors.text },
        label: {
            ...typography.body,
            color: colors.text,
            marginBottom: 6,
            fontWeight: '700',
        },
        input: {
            minHeight: 48,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.cardSoft,
            color: colors.text,
            paddingHorizontal: 14,
            marginBottom: spacing.md,
        },
        textArea: { minHeight: 100, paddingTop: 14, textAlignVertical: 'top' },
        mapButton: {
            minHeight: 48,
            borderRadius: radius.lg,
            backgroundColor: colors.primarySoft,
            borderWidth: 1,
            borderColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
        },
        mapButtonText: {
            ...typography.body,
            color: colors.primary,
            fontWeight: '700',
        },
        coordsBadge: {
            backgroundColor: colors.cardSoft,
            borderRadius: radius.md,
            padding: spacing.sm,
            marginBottom: spacing.md,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
        },
        coordsBadgeText: { ...typography.caption, color: colors.textSecondary },
        buttonGroup: { gap: spacing.md, marginTop: spacing.sm },
    });