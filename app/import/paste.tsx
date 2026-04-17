import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useRouteImportStore } from '@/src/store/useRouteImportStore';
import { spacing, typography } from '@/src/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PasteImportScreen() {
  const { colors } = useAppTheme();
  const { appendStops } = useRouteImportStore();
  const [rawText, setRawText] = useState('');
  const styles = createStyles(colors);

  const handleParse = () => {
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const parsed = lines.map((line) => ({
      rawAddress: line,
      customerName: '',
      customerPhone: '',
      priorityNo: 0,
      deliveryNote: '',
    }));

    if (parsed.length === 0) {
      Alert.alert('Uyarı', 'En az bir adres girmen gerekiyor.');
      return;
    }

    appendStops(parsed);
    Alert.alert('Başarılı', `${parsed.length} adres eklendi.`);
    router.push({
      pathname: '/import',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Toplu Yapıştır</Text>

        <AppCard>
          <Text style={styles.helperText}>
            Her satıra bir adres gelecek şekilde yapıştır.
          </Text>

          <TextInput
            value={rawText}
            onChangeText={setRawText}
            multiline
            textAlignVertical="top"
            placeholder={'Karabük Merkez ...\nSafranbolu ...\nEskipazar ...'}
            placeholderTextColor={colors.textMuted}
            style={styles.textArea}
          />

          <View style={styles.buttonGroup}>
            <PrimaryButton title="Adresleri Ekle" onPress={handleParse} />
            <PrimaryButton
              title="Geri Dön"
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
    helperText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
    textArea: {
      minHeight: 260,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardSoft,
      color: colors.text,
      padding: 14,
      marginBottom: spacing.md,
    },
    buttonGroup: {
      gap: spacing.md,
    },
  });