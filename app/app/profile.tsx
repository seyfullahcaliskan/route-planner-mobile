// app/profile.tsx
import { changeMyPassword, updateMyProfile } from '@/src/api/userService';
import AppCard from '@/src/components/AppCard';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useApiError } from '@/src/hooks/useApiError';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAuthStore } from '@/src/store/useAuthStore';
import { radius, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';
import { useMutation } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
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

export default function ProfileScreen() {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const { show: showError } = useApiError();
    const styles = createStyles(colors);

    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);

    const isOAuth = user?.authProvider && user.authProvider !== 'LOCAL';

    // ---- Profil formu state ----
    const [name, setName] = useState(user?.name ?? '');
    const [surname, setSurname] = useState(user?.surname ?? '');
    const [phone, setPhone] = useState(user?.phoneNumber ?? '');

    const dirty =
        name !== (user?.name ?? '') ||
        surname !== (user?.surname ?? '') ||
        phone !== (user?.phoneNumber ?? '');

    const profileMutation = useMutation({
        mutationFn: () =>
            updateMyProfile({
                name: name.trim(),
                surname: surname.trim(),
                phoneNumber: phone.trim(),
            }),
        onSuccess: (data) => {
            haptics.success();
            setUser(data);
            Alert.alert(t('common.success'), t('profile.updateSuccess'));
        },
        onError: (e) => {
            haptics.error?.();
            showError(e);
        },
    });

    // ---- Şifre değiştirme ----
    const [pwOpen, setPwOpen] = useState(false);
    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [newPw2, setNewPw2] = useState('');

    const passwordMutation = useMutation({
        mutationFn: () => changeMyPassword({ oldPassword: oldPw, newPassword: newPw }),
        onSuccess: () => {
            haptics.success();
            setOldPw('');
            setNewPw('');
            setNewPw2('');
            setPwOpen(false);
            Alert.alert(t('common.success'), t('profile.passwordChanged'));
        },
        onError: (e) => {
            haptics.error?.();
            showError(e);
        },
    });

    const submitPassword = () => {
        if (newPw.length < 6) {
            Alert.alert(t('common.warning'), t('errors.PASSWORD_TOO_SHORT'));
            return;
        }
        if (newPw !== newPw2) {
            Alert.alert(t('common.warning'), t('profile.passwordMismatch'));
            return;
        }
        passwordMutation.mutate();
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
                    <Text style={styles.backText}>‹</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{t('profile.title')}</Text>
                    <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>
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
                    {/* Avatar pad */}
                    <View style={styles.avatarRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {(name || user?.email || '?').slice(0, 1).toUpperCase()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.avatarName} numberOfLines={1}>
                                {[name, surname].filter(Boolean).join(' ') || user?.email}
                            </Text>
                            <Text style={styles.avatarEmail} numberOfLines={1}>
                                {user?.email}
                            </Text>
                            {isOAuth && (
                                <View style={styles.oauthBadge}>
                                    <Text style={styles.oauthBadgeText}>
                                        {user?.authProvider}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Kişisel bilgi */}
                    <Text style={styles.sectionLabel}>{t('profile.personalInfo')}</Text>
                    <AppCard>
                        <Text style={styles.fieldLabel}>{t('auth.name')}</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder={t('auth.namePlaceholder')}
                            placeholderTextColor={colors.textMuted}
                            style={styles.input}
                            autoCapitalize="words"
                        />

                        <Text style={styles.fieldLabel}>{t('auth.surname')}</Text>
                        <TextInput
                            value={surname}
                            onChangeText={setSurname}
                            placeholder={t('auth.surnamePlaceholder')}
                            placeholderTextColor={colors.textMuted}
                            style={styles.input}
                            autoCapitalize="words"
                        />
                    </AppCard>

                    {/* İletişim */}
                    <Text style={styles.sectionLabel}>{t('profile.contactInfo')}</Text>
                    <AppCard>
                        <Text style={styles.fieldLabel}>{t('auth.email')}</Text>
                        <View style={styles.readOnlyBox}>
                            <Text style={styles.readOnlyText} numberOfLines={1}>
                                {user?.email}
                            </Text>
                            <Text style={styles.readOnlyBadge}>🔒</Text>
                        </View>
                        <Text style={styles.helperText}>
                            {t('profile.emailReadOnlyHint')}
                        </Text>

                        <View style={{ height: spacing.md }} />

                        <Text style={styles.fieldLabel}>{t('auth.phone')}</Text>
                        <TextInput
                            value={phone}
                            onChangeText={setPhone}
                            placeholder={t('auth.phonePlaceholder')}
                            placeholderTextColor={colors.textMuted}
                            style={styles.input}
                            keyboardType="phone-pad"
                        />
                    </AppCard>

                    <PrimaryButton
                        title={
                            profileMutation.isPending
                                ? t('common.saving')
                                : t('common.save')
                        }
                        onPress={() => profileMutation.mutate()}
                        disabled={!dirty || profileMutation.isPending}
                        style={{ marginTop: spacing.lg }}
                    />

                    {/* Güvenlik */}
                    <Text style={styles.sectionLabel}>{t('profile.security')}</Text>

                    {isOAuth ? (
                        <AppCard soft>
                            <Text style={styles.disabledText}>
                                {t('profile.oauthCannotChangePassword')}
                            </Text>
                        </AppCard>
                    ) : (
                        <AppCard>
                            <Pressable
                                onPress={() => {
                                    haptics.light();
                                    setPwOpen((v) => !v);
                                }}
                                style={styles.expandRow}
                            >
                                <Text style={styles.expandText}>
                                    🔐 {t('profile.changePassword')}
                                </Text>
                                <Text style={styles.expandChevron}>
                                    {pwOpen ? '▴' : '▾'}
                                </Text>
                            </Pressable>

                            {pwOpen && (
                                <View style={{ marginTop: spacing.md }}>
                                    <Text style={styles.fieldLabel}>
                                        {t('profile.oldPassword')}
                                    </Text>
                                    <TextInput
                                        value={oldPw}
                                        onChangeText={setOldPw}
                                        placeholder="••••••••"
                                        placeholderTextColor={colors.textMuted}
                                        style={styles.input}
                                        secureTextEntry
                                        autoCapitalize="none"
                                    />

                                    <Text style={styles.fieldLabel}>
                                        {t('profile.newPassword')}
                                    </Text>
                                    <TextInput
                                        value={newPw}
                                        onChangeText={setNewPw}
                                        placeholder="••••••••"
                                        placeholderTextColor={colors.textMuted}
                                        style={styles.input}
                                        secureTextEntry
                                        autoCapitalize="none"
                                    />

                                    <Text style={styles.fieldLabel}>
                                        {t('profile.newPasswordConfirm')}
                                    </Text>
                                    <TextInput
                                        value={newPw2}
                                        onChangeText={setNewPw2}
                                        placeholder="••••••••"
                                        placeholderTextColor={colors.textMuted}
                                        style={styles.input}
                                        secureTextEntry
                                        autoCapitalize="none"
                                    />

                                    <PrimaryButton
                                        title={
                                            passwordMutation.isPending
                                                ? t('common.saving')
                                                : t('profile.changePassword')
                                        }
                                        onPress={submitPassword}
                                        disabled={
                                            !oldPw ||
                                            !newPw ||
                                            !newPw2 ||
                                            passwordMutation.isPending
                                        }
                                        style={{ marginTop: spacing.md }}
                                    />
                                </View>
                            )}
                        </AppCard>
                    )}

                    <View style={{ height: spacing.xl }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {profileMutation.isPending && (
                <View pointerEvents="none" style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            )}
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
        subtitle: { ...typography.bodySmall, color: colors.textSecondary },

        content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

        avatarRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.lg,
        },
        avatar: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
        avatarName: {
            ...typography.heading,
            color: colors.text,
        },
        avatarEmail: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            marginTop: 2,
        },
        oauthBadge: {
            alignSelf: 'flex-start',
            backgroundColor: colors.primarySoft,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: radius.sm,
            marginTop: 4,
        },
        oauthBadgeText: {
            ...typography.caption,
            color: colors.primary,
            fontWeight: '700',
            fontSize: 10,
            letterSpacing: 0.4,
        },

        sectionLabel: {
            ...typography.caption,
            color: colors.textMuted,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginTop: spacing.lg,
            marginBottom: spacing.sm,
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
        readOnlyBox: {
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 48,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.cardSoft,
            paddingHorizontal: spacing.md,
            opacity: 0.7,
        },
        readOnlyText: {
            ...typography.body,
            color: colors.text,
            flex: 1,
        },
        readOnlyBadge: { fontSize: 14 },
        helperText: {
            ...typography.caption,
            color: colors.textMuted,
            marginTop: 4,
        },

        expandRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 32,
        },
        expandText: {
            ...typography.body,
            color: colors.text,
            fontWeight: '600',
        },
        expandChevron: {
            ...typography.body,
            color: colors.textSecondary,
        },
        disabledText: {
            ...typography.bodySmall,
            color: colors.textMuted,
            textAlign: 'center',
            paddingVertical: spacing.sm,
        },

        loadingOverlay: {
            position: 'absolute',
            bottom: spacing.xl,
            alignSelf: 'center',
            backgroundColor: colors.card,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.full ?? 20,
        },
    });