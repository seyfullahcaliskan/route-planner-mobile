// app/import/manual.tsx
import AppCard from '@/src/components/AppCard';
import LocationPicker from '@/src/components/LocationPicker';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useMapPickerStore } from '@/src/store/useMapPickerStore';
import { useRouteImportStore } from '@/src/store/useRouteImportStore';
import { radius, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManualImportScreen() {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const { addStop, stops } = useRouteImportStore();
    const styles = createStyles(colors);

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [rawAddress, setRawAddress] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');
    const [priorityNo, setPriorityNo] = useState('0');
    const [latitude, setLatitude] = useState<number | undefined>(undefined);
    const [longitude, setLongitude] = useState<number | undefined>(undefined);

    /** Map picker'dan dönüldüğünde sonucu yakala (sadece bizim target için). */
    useFocusEffect(
        useCallback(() => {
            const mp = useMapPickerStore.getState();
            const target = mp.target;
            const result = mp.consume();
            if (result && target === 'import-manual-stop') {
                setRawAddress(result.address);
                setLatitude(result.latitude);
                setLongitude(result.longitude);
                haptics.success();
            }
        }, [])
    );

    const reset = () => {
        setCustomerName('');
        setCustomerPhone('');
        setRawAddress('');
        setDeliveryNote('');
        setPriorityNo('0');
        setLatitude(undefined);
        setLongitude(undefined);
    };

    const handleAdd = (continueAdding: boolean) => {
        if (!rawAddress.trim() && (latitude === undefined || longitude === undefined)) {
            Alert.alert(t('common.warning'), t('import.addressEmpty'));
            return;
        }

        addStop({
            customerName: customerName.trim() || undefined,
            customerPhone: customerPhone.trim() || undefined,
            rawAddress:
                rawAddress.trim() ||
                `${latitude?.toFixed(5)}, ${longitude?.toFixed(5)}`,
            deliveryNote: deliveryNote.trim() || undefined,
            priorityNo: Number(priorityNo || '0'),
            latitude,
            longitude,
        });

        haptics.success();
        reset();

        if (!continueAdding) {
            router.replace('/import');
        }
    };

    const hasCoords = latitude !== undefined && longitude !== undefined;
    const canSave = rawAddress.trim().length > 0 || hasCoords;

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View>
                    <Text style={styles.title}>{t('import.manualTitle')}</Text>
                    <Text style={styles.subtitle}>
                        {stops.length === 0
                            ? 'İlk adresi ekleyerek başla'
                            : `${stops.length} adres eklendi · Yeni durak ekle`}
                    </Text>
                </View>

                {/* Adres kartı */}
                <AppCard>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardEmoji}>📍</Text>
                        <Text style={styles.cardHeaderText}>Adres</Text>
                    </View>

                    <LocationPicker
                        value={{ address: rawAddress, latitude, longitude }}
                        onChange={(v) => {
                            setRawAddress(v.address);
                            setLatitude(v.latitude);
                            setLongitude(v.longitude);
                        }}
                        mapPickerTarget="import-manual-stop"
                    />

                    {/* Elle yazma seçeneği — sadece henüz adres seçilmemişse göster */}
                    {!canSave && (
                        <>
                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.orText}>veya elle yaz</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TextInput
                                value={rawAddress}
                                onChangeText={setRawAddress}
                                placeholder="Mahalle, sokak, no..."
                                placeholderTextColor={colors.textMuted}
                                multiline
                                style={[styles.input, styles.textArea]}
                            />
                        </>
                    )}
                </AppCard>

                {/* Müşteri bilgisi */}
                <AppCard>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardEmoji}>👤</Text>
                        <Text style={styles.cardHeaderText}>
                            Müşteri{' '}
                            <Text style={styles.optional}>({t('common.optional')})</Text>
                        </Text>
                    </View>

                    <Text style={styles.label}>{t('import.customerName')}</Text>
                    <TextInput
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="Ad Soyad"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                    />

                    <Text style={styles.label}>{t('import.customerPhone')}</Text>
                    <TextInput
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                        placeholder="5xx xxx xx xx"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        style={styles.input}
                    />
                </AppCard>

                {/* Detaylar */}
                <AppCard>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardEmoji}>📝</Text>
                        <Text style={styles.cardHeaderText}>
                            Detaylar{' '}
                            <Text style={styles.optional}>({t('common.optional')})</Text>
                        </Text>
                    </View>

                    <Text style={styles.label}>{t('import.deliveryNote')}</Text>
                    <TextInput
                        value={deliveryNote}
                        onChangeText={setDeliveryNote}
                        placeholder="Kapı kodu, kat, daire..."
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                    />

                    <Text style={styles.label}>{t('import.priority')}</Text>
                    <View style={styles.priorityRow}>
                        {[0, 1, 2, 3].map((n) => (
                            <Pressable
                                key={n}
                                onPress={() => {
                                    haptics.light();
                                    setPriorityNo(String(n));
                                }}
                                style={[
                                    styles.priorityChip,
                                    priorityNo === String(n) && styles.priorityChipActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.priorityChipText,
                                        priorityNo === String(n) && styles.priorityChipTextActive,
                                    ]}
                                >
                                    {n === 0 ? 'Normal' : n === 1 ? 'Düşük' : n === 2 ? 'Orta' : 'Yüksek'}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </AppCard>

                <View style={{ gap: spacing.md }}>
                    <PrimaryButton
                        title="Ekle ve Yeni Durak Daha Ekle"
                        onPress={() => handleAdd(true)}
                        disabled={!canSave}
                    />
                    <Pressable
                        onPress={() => handleAdd(false)}
                        disabled={!canSave}
                        style={({ pressed }) => [
                            styles.secondaryButton,
                            pressed && styles.pressed,
                            !canSave && styles.disabled,
                        ]}
                    >
                        <Text style={styles.secondaryButtonText}>Ekle ve Listeye Dön</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.page },
        content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },

        title: { ...typography.titleLarge, color: colors.text },
        subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },

        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.md,
        },
        cardEmoji: { fontSize: 20 },
        cardHeaderText: {
            ...typography.heading,
            color: colors.text,
            fontWeight: '700',
        },
        optional: {
            ...typography.caption,
            color: colors.textMuted,
            fontWeight: '400',
        },

        label: {
            ...typography.bodySmall,
            color: colors.text,
            fontWeight: '600',
            marginBottom: 6,
        },

        dividerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginVertical: spacing.md,
        },
        dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
        orText: {
            ...typography.caption,
            color: colors.textMuted,
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
            minHeight: 90,
            paddingTop: 14,
            textAlignVertical: 'top',
            marginBottom: 0,
        },

        priorityRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
        },
        priorityChip: {
            paddingHorizontal: spacing.md,
            paddingVertical: 10,
            borderRadius: radius.lg,
            backgroundColor: colors.cardSoft,
            borderWidth: 1,
            borderColor: colors.border,
        },
        priorityChipActive: {
            backgroundColor: colors.primarySoft,
            borderColor: colors.primary,
        },
        priorityChipText: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            fontWeight: '600',
        },
        priorityChipTextActive: {
            color: colors.primary,
            fontWeight: '700',
        },

        secondaryButton: {
            minHeight: 52,
            borderRadius: radius.lg,
            backgroundColor: colors.cardSoft,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
        },
        secondaryButtonText: {
            ...typography.body,
            color: colors.text,
            fontWeight: '700',
        },
        pressed: { opacity: 0.7 },
        disabled: { opacity: 0.4 },
    });