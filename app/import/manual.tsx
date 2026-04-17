import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useRouteImportStore } from '@/src/store/useRouteImportStore';
import { spacing, typography } from '@/src/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManualImportScreen() {
    const { colors } = useAppTheme();
    const { addStop } = useRouteImportStore();
    const styles = createStyles(colors);

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [rawAddress, setRawAddress] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');
    const [priorityNo, setPriorityNo] = useState('0');

    const handleAdd = () => {
        if (!rawAddress.trim()) {
            Alert.alert('Uyarı', 'Adres boş olamaz.');
            return;
        }

        addStop({
            customerName,
            customerPhone,
            rawAddress,
            deliveryNote,
            priorityNo: Number(priorityNo || '0'),
        });

        setCustomerName('');
        setCustomerPhone('');
        setRawAddress('');
        setDeliveryNote('');
        setPriorityNo('0');

        Alert.alert('Başarılı', 'Adres eklendi.');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Tek Tek Adres Ekle</Text>

                <AppCard>
                    <Text style={styles.label}>Müşteri Adı</Text>
                    <TextInput
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="İsteğe bağlı"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                    />

                    <Text style={styles.label}>Telefon</Text>
                    <TextInput
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                        placeholder="İsteğe bağlı"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                    />

                    <Text style={styles.label}>Adres</Text>
                    <TextInput
                        value={rawAddress}
                        onChangeText={setRawAddress}
                        placeholder="Teslimat adresi"
                        placeholderTextColor={colors.textMuted}
                        multiline
                        style={[styles.input, styles.textArea]}
                    />

                    <Text style={styles.label}>Teslimat Notu</Text>
                    <TextInput
                        value={deliveryNote}
                        onChangeText={setDeliveryNote}
                        placeholder="İsteğe bağlı"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                    />

                    <Text style={styles.label}>Öncelik</Text>
                    <TextInput
                        value={priorityNo}
                        onChangeText={setPriorityNo}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                    />

                    <View style={styles.buttonGroup}>
                        <PrimaryButton title="Adresi Ekle" onPress={handleAdd} />
                        <PrimaryButton
                            title="Listeye Dön"
                            onPress={() =>
                                router.push({
                                    pathname: '/import',
                                })
                            }
                        />
                    </View>
                </AppCard>
            </View>
        </SafeAreaView>
    );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.page },
        content: { padding: spacing.lg, gap: spacing.lg },
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
        textArea: {
            minHeight: 120,
            paddingTop: 14,
            textAlignVertical: 'top',
        },
        buttonGroup: {
            gap: spacing.md,
            marginTop: spacing.sm,
        },
    });