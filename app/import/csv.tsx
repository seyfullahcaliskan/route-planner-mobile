import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useRouteImportStore } from '@/src/store/useRouteImportStore';
import { spacing, typography } from '@/src/theme';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import Papa from 'papaparse';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ParsedCsvRow = {
    customerName?: string;
    customerPhone?: string;
    rawAddress: string;
    deliveryNote?: string;
    priorityNo?: number;
};

export default function CsvImportScreen() {
    const { colors } = useAppTheme();
    const { appendStops } = useRouteImportStore();
    const styles = createStyles(colors);

    const [fileName, setFileName] = useState<string>('');
    const [previewRows, setPreviewRows] = useState<ParsedCsvRow[]>([]);
    const [isParsing, setIsParsing] = useState(false);

    const pickCsvFile = async () => {
        try {
            setIsParsing(true);

            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'public.comma-separated-values-text'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled) {
                setIsParsing(false);
                return;
            }

            const asset = result.assets?.[0];
            if (!asset?.uri) {
                setIsParsing(false);
                Alert.alert('Hata', 'Dosya okunamadı.');
                return;
            }

            setFileName(asset.name || 'Seçilen dosya');

            const fileContent = await FileSystem.readAsStringAsync(asset.uri);

            Papa.parse<Record<string, string>>(fileContent, {
                header: true,
                skipEmptyLines: true,
                complete: (parseResult) => {
                    const rows = (parseResult.data || [])
                        .map((row) => {
                            const customerName =
                                row.customerName ||
                                row.customer_name ||
                                row.name ||
                                '';

                            const customerPhone =
                                row.customerPhone ||
                                row.customer_phone ||
                                row.phone ||
                                '';

                            const rawAddress =
                                row.rawAddress ||
                                row.raw_address ||
                                row.address ||
                                '';

                            const deliveryNote =
                                row.deliveryNote ||
                                row.delivery_note ||
                                row.note ||
                                '';

                            const priorityRaw =
                                row.priorityNo ||
                                row.priority_no ||
                                row.priority ||
                                '0';

                            return {
                                customerName,
                                customerPhone,
                                rawAddress: rawAddress.trim(),
                                deliveryNote,
                                priorityNo: Number(priorityRaw || '0'),
                            };
                        })
                        .filter((item) => item.rawAddress);

                    setPreviewRows(rows);
                    setIsParsing(false);
                },
                error: () => {
                    setIsParsing(false);
                    Alert.alert('Hata', 'CSV dosyası parse edilemedi.');
                },
            });
        } catch (error) {
            setIsParsing(false);
            Alert.alert('Hata', 'Dosya seçme veya okuma sırasında hata oluştu.');
        }
    };

    const handleImport = () => {
        if (previewRows.length === 0) {
            Alert.alert('Uyarı', 'İçe aktarılacak geçerli satır bulunamadı.');
            return;
        }

        appendStops(
            previewRows.map((item) => ({
                customerName: item.customerName,
                customerPhone: item.customerPhone,
                rawAddress: item.rawAddress,
                deliveryNote: item.deliveryNote,
                priorityNo: item.priorityNo ?? 0,
            }))
        );

        Alert.alert('Başarılı', `${previewRows.length} satır içe aktarıldı.`);
        router.push({
            pathname: '/import',
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>CSV Dosyası Yükle</Text>

                <AppCard>
                    <Text style={styles.sectionTitle}>Beklenen kolonlar</Text>
                    <Text style={styles.helperText}>
                        Desteklenen kolon adları:
                        {'\n'}- address / rawAddress / raw_address
                        {'\n'}- customerName / customer_name / name
                        {'\n'}- customerPhone / customer_phone / phone
                        {'\n'}- deliveryNote / delivery_note / note
                        {'\n'}- priorityNo / priority_no / priority
                    </Text>

                    <PrimaryButton
                        title={isParsing ? 'Dosya Okunuyor...' : 'CSV Seç'}
                        onPress={pickCsvFile}
                        disabled={isParsing}
                    />
                </AppCard>

                {fileName ? (
                    <AppCard>
                        <Text style={styles.sectionTitle}>Seçilen Dosya</Text>
                        <Text style={styles.fileName}>{fileName}</Text>
                        <Text style={styles.helperText}>Geçerli satır sayısı: {previewRows.length}</Text>
                    </AppCard>
                ) : null}

                {previewRows.length > 0 ? (
                    <AppCard>
                        <Text style={styles.sectionTitle}>Önizleme</Text>

                        {previewRows.slice(0, 8).map((item, index) => (
                            <View key={`${item.rawAddress}-${index}`} style={styles.previewRow}>
                                <Text style={styles.previewIndex}>{index + 1}.</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.previewAddress}>{item.rawAddress}</Text>
                                    {item.customerName ? (
                                        <Text style={styles.previewMeta}>{item.customerName}</Text>
                                    ) : null}
                                </View>
                            </View>
                        ))}

                        {previewRows.length > 8 ? (
                            <Text style={styles.moreText}>+ {previewRows.length - 8} satır daha</Text>
                        ) : null}

                        <View style={styles.buttonGroup}>
                            <PrimaryButton title="İçe Aktar" onPress={handleImport} />
                            <PrimaryButton
                                title="Önizlemeye Git"
                                onPress={() =>
                                    router.push({
                                        pathname: '/import/preview',
                                    })
                                }
                            />
                        </View>
                    </AppCard>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.page,
        },
        content: {
            padding: spacing.lg,
            gap: spacing.lg,
            paddingBottom: spacing.xxxl,
        },
        title: {
            ...typography.titleLarge,
            color: colors.text,
        },
        sectionTitle: {
            ...typography.heading,
            color: colors.text,
            marginBottom: spacing.sm,
        },
        helperText: {
            ...typography.body,
            color: colors.textSecondary,
            marginBottom: spacing.md,
            lineHeight: 22,
        },
        fileName: {
            ...typography.body,
            color: colors.text,
            fontWeight: '700',
            marginBottom: spacing.sm,
        },
        previewRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.sm,
            marginBottom: spacing.md,
        },
        previewIndex: {
            ...typography.bodySmall,
            color: colors.textMuted,
            width: 20,
            fontWeight: '700',
        },
        previewAddress: {
            ...typography.body,
            color: colors.text,
        },
        previewMeta: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            marginTop: 4,
        },
        moreText: {
            ...typography.bodySmall,
            color: colors.primary,
            fontWeight: '700',
            marginBottom: spacing.md,
        },
        buttonGroup: {
            gap: spacing.md,
            marginTop: spacing.sm,
        },
    });