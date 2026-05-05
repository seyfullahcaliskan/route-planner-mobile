// app/auth/login.tsx
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { radius, shadows, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

export default function LoginScreen() {
    const { colors, isDark } = useAppTheme();
    const router = useRouter();
    const styles = createStyles(colors, isDark);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        haptics.light();
        setIsLoading(true);

        // TODO: API call
        setTimeout(() => {
            haptics.success();
            setIsLoading(false);
            router.replace('/(tabs)');
        }, 1500);
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
                    {/* Hero Section */}
                    <Animated.View
                        entering={FadeInUp.delay(100).duration(600)}
                        style={styles.heroSection}
                    >
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>🚚</Text>
                        </View>
                        <Text style={styles.heroTitle}>Route Planner</Text>
                        <Text style={styles.heroSubtitle}>
                            Teslimatlarınızı optimize edin
                        </Text>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        entering={FadeInDown.delay(300).duration(600)}
                        style={styles.formCard}
                    >
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>E-posta</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ornek@email.com"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Şifre</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>

                        <Pressable
                            onPress={() => {
                                haptics.light();
                                // TODO: Forgot password
                            }}
                        >
                            <Text style={styles.forgotPassword}>Şifremi Unuttum</Text>
                        </Pressable>

                        <PrimaryButton
                            title={isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                            onPress={handleLogin}
                            disabled={isLoading || !email || !password}
                            style={styles.loginButton}
                        />

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>veya</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.registerButton,
                                pressed && styles.pressed,
                            ]}
                            onPress={() => {
                                haptics.light();
                                router.push('/auth/register');
                            }}
                        >
                            <Text style={styles.registerButtonText}>Hesap Oluştur</Text>
                        </Pressable>
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View
                        entering={FadeInUp.delay(500).duration(600)}
                        style={styles.footer}
                    >
                        <Text style={styles.footerText}>
                            Giriş yaparak{' '}
                            <Text style={styles.footerLink}>Kullanım Koşulları</Text> ve{' '}
                            <Text style={styles.footerLink}>Gizlilik Politikası</Text> `&apos`nı
                            kabul etmiş olursunuz.
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.page,
        },
        keyboardView: {
            flex: 1,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.xxxl,
        },
        heroSection: {
            alignItems: 'center',
            marginBottom: spacing.xxxl,
        },
        logoCircle: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
            ...shadows.card,
        },
        logoEmoji: {
            fontSize: 48,
        },
        heroTitle: {
            ...typography.title,
            fontSize: 32,
            fontWeight: '800',
            color: colors.text,
            marginBottom: spacing.xs,
        },
        heroSubtitle: {
            ...typography.body,
            fontSize: 16,
            color: colors.textSecondary,
        },
        formCard: {
            backgroundColor: colors.card,
            borderRadius: radius.xxl,
            padding: spacing.xl,
            borderWidth: 1,
            borderColor: colors.border,
            ...shadows.card,
        },
        inputGroup: {
            marginBottom: spacing.lg,
        },
        inputLabel: {
            ...typography.bodySmall,
            fontWeight: '600',
            color: colors.text,
            marginBottom: spacing.xs,
        },
        input: {
            height: 56,
            borderRadius: radius.lg,
            backgroundColor: isDark ? colors.cardSoft : '#F9FAFB',
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.lg,
            fontSize: 16,
            color: colors.text,
        },
        forgotPassword: {
            ...typography.bodySmall,
            color: colors.primary,
            fontWeight: '600',
            textAlign: 'right',
            marginBottom: spacing.xl,
        },
        loginButton: {
            marginBottom: spacing.lg,
        },
        divider: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: spacing.lg,
        },
        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: colors.border,
        },
        dividerText: {
            ...typography.caption,
            color: colors.textMuted,
            marginHorizontal: spacing.md,
        },
        registerButton: {
            height: 56,
            borderRadius: radius.lg,
            backgroundColor: colors.cardSoft,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        registerButtonText: {
            ...typography.body,
            fontWeight: '600',
            color: colors.text,
        },
        footer: {
            marginTop: spacing.xxxl,
            paddingHorizontal: spacing.md,
        },
        footerText: {
            ...typography.caption,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 18,
        },
        footerLink: {
            color: colors.primary,
            fontWeight: '600',
        },
        pressed: {
            opacity: 0.7,
            transform: [{ scale: 0.98 }],
        },
    });