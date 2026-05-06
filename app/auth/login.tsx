// app/auth/login.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginApi, oauthLoginApi } from '@/src/api/authService';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import {
    isAppleAuthAvailable,
    isGoogleAuthConfigured,
    signInWithApple,
    useGoogleAuthRequest,
} from '@/src/lib/oauth';
import { useAuthStore } from '@/src/store/useAuthStore';
import { radius, shadows, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';

type OAuthHandler = (
    provider: 'GOOGLE' | 'APPLE',
    idToken: string,
    fallbackEmail?: string,
    fallbackName?: string
) => Promise<void>;

/**
 * Google butonu AYRI komponent — useGoogleAuthRequest hook'u sadece env var'lar
 * tanımlıysa, yani isGoogleAuthConfigured()===true iken render edilen bu komponent
 * içinde çağrılır. Aksi halde "Client Id must be defined" hatası alırız.
 */
function GoogleSignInButton({
    onLogin,
    isAnyLoading,
    setOauthLoading,
    isLoading,
    styles,
    colors,
    label,
    failedMessage,
    errorTitle,
}: {
    onLogin: OAuthHandler;
    isAnyLoading: boolean;
    setOauthLoading: (v: 'google' | 'apple' | null) => void;
    isLoading: boolean;
    styles: any;
    colors: any;
    label: string;
    failedMessage: string;
    errorTitle: string;
}) {
    const [request, response, prompt] = useGoogleAuthRequest();

    useEffect(() => {
        if (response?.type === 'success') {
            const idToken = response.authentication?.idToken;
            if (idToken) {
                onLogin('GOOGLE', idToken).catch(() => { });
            } else {
                setOauthLoading(null);
                Alert.alert(errorTitle, failedMessage);
            }
        } else if (response?.type === 'error' || response?.type === 'cancel' || response?.type === 'dismiss') {
            setOauthLoading(null);
        }
    }, [response]);

    const onPress = async () => {
        if (!request) return;
        haptics.light();
        setOauthLoading('google');
        try {
            await prompt();
        } catch {
            setOauthLoading(null);
        }
    };

    const disabled = !request || isAnyLoading;

    return (
        <Pressable
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.oauthButton,
                pressed && styles.pressed,
                disabled && styles.disabled,
            ]}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
            ) : (
                <>
                    <Text style={styles.oauthIcon}>G</Text>
                    <Text style={styles.oauthButtonText}>{label}</Text>
                </>
            )}
        </Pressable>
    );
}

export default function LoginScreen() {
    const { colors, isDark } = useAppTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const setSession = useAuthStore((s) => s.setSession);

    const styles = createStyles(colors, isDark);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
    const [appleAvailable, setAppleAvailable] = useState(false);

    const googleConfigured = isGoogleAuthConfigured();

    useEffect(() => {
        isAppleAuthAvailable().then(setAppleAvailable);
    }, []);

    const handleOAuthLogin: OAuthHandler = async (provider, idToken, fallbackEmail, fallbackName) => {
        try {
            const data = await oauthLoginApi({ provider, idToken, fallbackEmail, fallbackName });
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
            const msg = e?.response?.data?.message || e?.message || t('auth.oauthFailed');
            Alert.alert(t('common.error'), msg);
        } finally {
            setOauthLoading(null);
        }
    };

    const handleApplePress = async () => {
        haptics.light();
        setOauthLoading('apple');
        try {
            const result = await signInWithApple();
            if (!result) {
                setOauthLoading(null);
                return;
            }
            await handleOAuthLogin('APPLE', result.idToken, result.fallbackEmail, result.fallbackName);
        } catch (e: any) {
            setOauthLoading(null);
            Alert.alert(t('common.error'), e?.message || t('auth.oauthFailed'));
        }
    };

    const handleLogin = async () => {
        if (!email.trim() || !password) return;
        haptics.light();
        setIsLoading(true);
        try {
            const data = await loginApi({ email: email.trim(), password });
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
            const msg =
                status === 400 || status === 401
                    ? t('auth.invalidCredentials')
                    : e?.response?.data?.message || t('auth.networkError');
            Alert.alert(t('common.error'), msg);
        } finally {
            setIsLoading(false);
        }
    };

    const showOAuthSection = googleConfigured || appleAvailable;

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
                        entering={FadeInUp.delay(100).duration(600)}
                        style={styles.heroSection}
                    >
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>🚚</Text>
                        </View>
                        <Text style={styles.heroTitle}>{t('auth.appName')}</Text>
                        <Text style={styles.heroSubtitle}>{t('auth.tagline')}</Text>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(300).duration(600)}
                        style={styles.formCard}
                    >
                        <Text style={styles.formTitle}>{t('auth.loginTitle')}</Text>
                        <Text style={styles.formSubtitle}>{t('auth.loginSubtitle')}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('auth.email')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('auth.emailPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="email"
                                textContentType="emailAddress"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('auth.password')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('auth.passwordPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoComplete="password"
                                textContentType="password"
                            />
                        </View>

                        <Pressable onPress={() => haptics.light()}>
                            <Text style={styles.forgotPassword}>{t('auth.forgotPassword')}</Text>
                        </Pressable>

                        <PrimaryButton
                            title={isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
                            onPress={handleLogin}
                            disabled={isLoading || !email || !password}
                            style={styles.loginButton}
                        />

                        {showOAuthSection && (
                            <>
                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>{t('auth.or')}</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                {googleConfigured && (
                                    <GoogleSignInButton
                                        onLogin={handleOAuthLogin}
                                        isAnyLoading={oauthLoading !== null}
                                        setOauthLoading={setOauthLoading}
                                        isLoading={oauthLoading === 'google'}
                                        styles={styles}
                                        colors={colors}
                                        label={t('auth.continueWithGoogle')}
                                        failedMessage={t('auth.oauthFailed')}
                                        errorTitle={t('common.error')}
                                    />
                                )}

                                {appleAvailable && (
                                    <Pressable
                                        disabled={oauthLoading !== null}
                                        onPress={handleApplePress}
                                        style={({ pressed }) => [
                                            styles.oauthButton,
                                            styles.appleButton,
                                            pressed && styles.pressed,
                                            oauthLoading !== null && styles.disabled,
                                        ]}
                                    >
                                        {oauthLoading === 'apple' ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Text style={[styles.oauthIcon, { color: '#FFFFFF' }]}></Text>
                                                <Text style={[styles.oauthButtonText, { color: '#FFFFFF' }]}>
                                                    {t('auth.continueWithApple')}
                                                </Text>
                                            </>
                                        )}
                                    </Pressable>
                                )}
                            </>
                        )}

                        <View style={styles.registerRow}>
                            <Text style={styles.registerHint}>{t('auth.noAccount')} </Text>
                            <Pressable
                                onPress={() => {
                                    haptics.light();
                                    router.push('/auth/register');
                                }}
                            >
                                <Text style={styles.registerLink}>{t('auth.signUp')}</Text>
                            </Pressable>
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInUp.delay(500).duration(600)}
                        style={styles.footer}
                    >
                        <Text style={styles.footerText}>
                            {t('auth.termsPrefix')}{' '}
                            <Text style={styles.footerLink}>{t('auth.termsLink')}</Text>{' '}
                            {t('auth.and')}{' '}
                            <Text style={styles.footerLink}>{t('auth.privacyLink')}</Text>
                            {t('auth.termsSuffix')}
                        </Text>
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
            paddingVertical: spacing.xxxl,
        },
        heroSection: { alignItems: 'center', marginBottom: spacing.xxxl },
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
        logoEmoji: { fontSize: 48 },
        heroTitle: {
            ...typography.title,
            fontSize: 32,
            fontWeight: '800',
            color: colors.text,
            marginBottom: spacing.xs,
            textAlign: 'center',
        },
        heroSubtitle: {
            ...typography.body,
            fontSize: 15,
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
        formTitle: {
            ...typography.title,
            fontSize: 22,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
        },
        formSubtitle: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            marginBottom: spacing.lg,
        },
        inputGroup: { marginBottom: spacing.lg },
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
            marginBottom: spacing.lg,
        },
        loginButton: { marginBottom: spacing.lg },
        divider: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: spacing.md,
        },
        dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
        dividerText: {
            ...typography.caption,
            color: colors.textMuted,
            marginHorizontal: spacing.md,
        },
        oauthButton: {
            height: 52,
            borderRadius: radius.lg,
            backgroundColor: colors.cardSoft,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: spacing.md,
        },
        appleButton: {
            backgroundColor: '#000000',
            borderColor: '#000000',
        },
        oauthIcon: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginRight: spacing.sm,
        },
        oauthButtonText: {
            ...typography.body,
            fontWeight: '600',
            color: colors.text,
        },
        pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
        disabled: { opacity: 0.5 },
        registerRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: spacing.md,
            flexWrap: 'wrap',
        },
        registerHint: {
            ...typography.bodySmall,
            color: colors.textSecondary,
        },
        registerLink: {
            ...typography.bodySmall,
            color: colors.primary,
            fontWeight: '700',
        },
        footer: { marginTop: spacing.xxl, paddingHorizontal: spacing.md },
        footerText: {
            ...typography.caption,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 18,
        },
        footerLink: { color: colors.primary, fontWeight: '600' },
    });