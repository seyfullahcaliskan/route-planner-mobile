// app/auth/register.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { registerApi } from '@/src/api/authService';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAuthStore } from '@/src/store/useAuthStore';
import { radius, shadows, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';

/** Backend ProblemDetail response'undan okunabilir hata mesajı çıkar. */
const extractErrorMessage = (e: any, fallback: string): string => {
    const data = e?.response?.data;
    if (!data) return fallback;

    // Önce 'message' property'sine bak (bizim GlobalExceptionHandler ekliyor)
    if (typeof data.message === 'string' && data.message.trim()) return data.message;

    // Validation hataları: errors map'i
    if (data.errors && typeof data.errors === 'object') {
        const first = Object.values(data.errors)[0];
        if (typeof first === 'string') return first;
    }

    // Spring default 'detail'
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;

    // Spring default 'title'
    if (typeof data.title === 'string' && data.title.trim()) return data.title;

    return fallback;
};

export default function RegisterScreen() {
    const { colors, isDark } = useAppTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const setSession = useAuthStore((s) => s.setSession);

    const styles = createStyles(colors, isDark);

    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length >= 6;

    const handleRegister = async () => {
        if (!canSubmit) return;
        haptics.light();
        setIsLoading(true);
        try {
            const data = await registerApi({
                name: name.trim(),
                surname: surname.trim() || undefined,
                email: email.trim(),
                password,
                phoneNumber: phone.trim() || undefined,
            });
            setSession({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                accessTokenExpiresAt: data.accessTokenExpiresAt,
                refreshTokenExpiresAt: data.refreshTokenExpiresAt,
                user: data.user,
            });
            haptics.success();
            router.replace('/(tabs)');
        } catch (e: any) {
            haptics.error();
            const status = e?.response?.status;
            let msg: string;

            if (!e?.response) {
                // Gerçek ağ hatası
                msg = t('auth.networkError');
            } else if (status === 400) {
                const serverMsg = extractErrorMessage(e, '');
                // E-posta zaten kayıtlı mı kontrol et
                if (serverMsg.toLowerCase().includes('e-posta') && serverMsg.toLowerCase().includes('kayıtlı')) {
                    msg = t('auth.emailExists');
                } else if (serverMsg) {
                    msg = serverMsg;
                } else {
                    msg = t('auth.emailExists');
                }
            } else {
                msg = extractErrorMessage(e, t('auth.networkError'));
            }

            Alert.alert(t('common.error'), msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        entering={FadeInUp.delay(100).duration(500)}
                        style={styles.heroSection}
                    >
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>📦</Text>
                        </View>
                        <Text style={styles.heroTitle}>{t('auth.registerTitle')}</Text>
                        <Text style={styles.heroSubtitle}>{t('auth.registerSubtitle')}</Text>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(250).duration(500)}
                        style={styles.formCard}
                    >
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                                <Text style={styles.inputLabel}>{t('auth.name')}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={t('auth.namePlaceholder')}
                                    placeholderTextColor={colors.textMuted}
                                    autoCapitalize="words"
                                    textContentType="givenName"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>{t('auth.surname')}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={surname}
                                    onChangeText={setSurname}
                                    placeholder={t('auth.surnamePlaceholder')}
                                    placeholderTextColor={colors.textMuted}
                                    autoCapitalize="words"
                                    textContentType="familyName"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('auth.email')}</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder={t('auth.emailPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                textContentType="emailAddress"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>
                                {t('auth.phone')}{' '}
                                <Text style={styles.optional}>({t('common.optional')})</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder={t('auth.phonePlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                keyboardType="phone-pad"
                                textContentType="telephoneNumber"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('auth.password')}</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder={t('auth.passwordPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                secureTextEntry
                                autoCapitalize="none"
                                textContentType="newPassword"
                            />
                            <Text style={styles.hint}>{t('auth.passwordHint')}</Text>
                        </View>

                        <PrimaryButton
                            title={isLoading ? t('auth.registering') : t('auth.registerButton')}
                            onPress={handleRegister}
                            disabled={!canSubmit || isLoading}
                            style={{ marginTop: spacing.sm }}
                        />

                        <View style={styles.loginRow}>
                            <Text style={styles.loginHint}>{t('auth.hasAccount')} </Text>
                            <Pressable
                                onPress={() => {
                                    haptics.light();
                                    router.replace('/auth/login');
                                }}
                            >
                                <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.page },
        keyboardView: { flex: 1 },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.xl,
        },
        heroSection: { alignItems: 'center', marginBottom: spacing.xl },
        logoCircle: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
            ...shadows.card,
        },
        logoEmoji: { fontSize: 36 },
        heroTitle: {
            ...typography.title,
            fontSize: 26,
            fontWeight: '800',
            color: colors.text,
            marginBottom: 4,
        },
        heroSubtitle: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            textAlign: 'center',
        },
        formCard: {
            backgroundColor: colors.card,
            borderRadius: radius.xxl,
            padding: spacing.xl,
            borderWidth: 1,
            borderColor: colors.border,
            ...shadows.card,
        },
        row: { flexDirection: 'row' },
        inputGroup: { marginBottom: spacing.md },
        inputLabel: {
            ...typography.bodySmall,
            fontWeight: '600',
            color: colors.text,
            marginBottom: spacing.xs,
        },
        optional: { ...typography.caption, color: colors.textMuted, fontWeight: '400' },
        input: {
            height: 52,
            borderRadius: radius.lg,
            backgroundColor: isDark ? colors.cardSoft : '#F9FAFB',
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.lg,
            fontSize: 16,
            color: colors.text,
        },
        hint: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
        loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
        loginHint: { ...typography.bodySmall, color: colors.textSecondary },
        loginLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' },
    });