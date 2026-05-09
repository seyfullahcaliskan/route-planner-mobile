// app/(tabs)/explore.tsx
import { logoutApi } from '@/src/api/authService';
import AppCard from '@/src/components/AppCard';
import CompactSegment from '@/src/components/CompactSegment';
import SettingRow from '@/src/components/SettingRow';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { radius, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const {
        themeMode,
        language,
        notificationsEnabled,
        largeTouchMode,
        navigationProvider,
        setThemeMode,
        setLanguage,
        setNotificationsEnabled,
        setLargeTouchMode,
        setNavigationProvider,
    } = useSettingsStore();

    const user = useAuthStore((s) => s.user);
    const refreshToken = useAuthStore((s) => s.refreshToken);
    const clearAuth = useAuthStore((s) => s.clear);

    const styles = createStyles(colors);

    const handleLogout = () => {
        Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('auth.logout'),
                style: 'destructive',
                onPress: async () => {
                    haptics.warning?.();
                    if (refreshToken) {
                        await logoutApi(refreshToken);
                    }
                    clearAuth();
                    router.replace('/auth/login');
                },
            },
        ]);
    };

    const appVersion =
        Constants?.expoConfig?.version ||
        (Constants as any)?.manifest?.version ||
        '1.0.0';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>{t('settings.title')}</Text>

                {/* Kullanıcı kartı — tıklanabilir → profile */}
                {user && (
                    <Pressable
                        onPress={() => {
                            haptics.light();
                            router.push('../profile');
                        }}
                        style={({ pressed }) => [
                            styles.userCardWrap,
                            pressed && { opacity: 0.85 },
                        ]}
                    >
                        <AppCard>
                            <View style={styles.userRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {(user.name?.[0] ?? '').toUpperCase()}
                                        {(user.surname?.[0] ?? '').toUpperCase()}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.userName} numberOfLines={1}>
                                        {user.name} {user.surname ?? ''}
                                    </Text>
                                    <Text style={styles.userEmail} numberOfLines={1}>
                                        {user.email}
                                    </Text>
                                </View>
                                <Text style={styles.chevron}>›</Text>
                            </View>
                        </AppCard>
                    </Pressable>
                )}

                {/* Hesap navigation */}
                <AppCard>
                    <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
                    <NavRow
                        icon="👤"
                        label={t('settings.profile')}
                        onPress={() => router.push('../profile')}
                        colors={colors}
                    />
                    <NavRow
                        icon="📍"
                        label={t('settings.savedPlaces')}
                        onPress={() => router.push('/places')}
                        colors={colors}
                    />
                </AppCard>

                <AppCard>
                    <Text style={styles.sectionTitle}>
                        {t('settings.appearance')}
                    </Text>
                    <SettingRow
                        title={t('settings.theme')}
                        value={
                            themeMode === 'system'
                                ? t('settings.themeSystem')
                                : themeMode === 'light'
                                  ? t('settings.themeLight')
                                  : t('settings.themeDark')
                        }
                    >
                        <CompactSegment
                            value={themeMode}
                            onChange={setThemeMode}
                            options={[
                                { label: t('settings.themeSystem'), value: 'system' },
                                { label: t('settings.themeLight'), value: 'light' },
                                { label: t('settings.themeDark'), value: 'dark' },
                            ]}
                        />
                    </SettingRow>
                </AppCard>

                <AppCard>
                    <Text style={styles.sectionTitle}>{t('settings.user')}</Text>
                    <SettingRow
                        title={t('settings.language')}
                        value={language.toUpperCase()}
                    >
                        <CompactSegment
                            value={language}
                            onChange={setLanguage}
                            options={[
                                { label: 'TR', value: 'tr' },
                                { label: 'EN', value: 'en' },
                            ]}
                        />
                    </SettingRow>

                    <View style={styles.switchRow}>
                        <View style={{ flex: 1, paddingRight: spacing.sm }}>
                            <Text style={styles.switchTitle}>
                                {t('settings.notifications')}
                            </Text>
                            <Text style={styles.switchHint}>
                                {t('settings.notificationsHint')}
                            </Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={(v) => {
                                haptics.light();
                                setNotificationsEnabled(v);
                            }}
                        />
                    </View>

                    <View style={styles.switchRow}>
                        <Text style={styles.switchTitle}>
                            {t('settings.largeTouchMode')}
                        </Text>
                        <Switch
                            value={largeTouchMode}
                            onValueChange={(v) => {
                                haptics.light();
                                setLargeTouchMode(v);
                            }}
                        />
                    </View>
                </AppCard>

                <AppCard>
                    <Text style={styles.sectionTitle}>{t('settings.navigation')}</Text>
                    <SettingRow
                        title={t('settings.defaultProvider')}
                        value={
                            navigationProvider === 'GOOGLE_MAPS'
                                ? 'Google'
                                : navigationProvider === 'YANDEX_MAPS'
                                  ? 'Yandex'
                                  : 'Apple'
                        }
                    >
                        <CompactSegment
                            value={navigationProvider}
                            onChange={setNavigationProvider}
                            options={[
                                { label: 'Google', value: 'GOOGLE_MAPS' },
                                { label: 'Yandex', value: 'YANDEX_MAPS' },
                                { label: 'Apple', value: 'APPLE_MAPS' },
                            ]}
                        />
                    </SettingRow>
                </AppCard>

                {/* About + Logout */}
                <AppCard>
                    <View style={styles.aboutRow}>
                        <Text style={styles.aboutLabel}>{t('settings.version')}</Text>
                        <Text style={styles.aboutValue}>{appVersion}</Text>
                    </View>

                    <Pressable onPress={handleLogout} style={styles.logoutRow}>
                        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
                    </Pressable>
                </AppCard>

                <View style={{ height: spacing.xl }} />
            </ScrollView>
        </SafeAreaView>
    );
}

function NavRow({
    icon,
    label,
    onPress,
    colors,
}: {
    icon: string;
    label: string;
    onPress: () => void;
    colors: ReturnType<typeof useAppTheme>['colors'];
}) {
    return (
        <Pressable
            onPress={() => {
                haptics.light();
                onPress();
            }}
            style={({ pressed }) => [navRowStyles.row, pressed && { opacity: 0.7 }]}
        >
            <Text style={navRowStyles.icon}>{icon}</Text>
            <Text style={[navRowStyles.label, { color: colors.text }]}>{label}</Text>
            <Text style={[navRowStyles.chevron, { color: colors.textMuted }]}>›</Text>
        </Pressable>
    );
}

const navRowStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 50,
        paddingVertical: spacing.sm,
    },
    icon: { fontSize: 20 },
    label: { ...typography.body, fontWeight: '600', flex: 1 },
    chevron: { fontSize: 22, fontWeight: '300' },
});

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.page },
        content: {
            padding: spacing.lg,
            gap: spacing.lg,
            paddingBottom: spacing.xxxl ?? 80,
        },
        title: {
            ...(typography.titleLarge ?? typography.heading),
            color: colors.text,
        },
        sectionTitle: {
            ...typography.heading,
            color: colors.text,
            marginBottom: spacing.md,
        },
        switchRow: {
            minHeight: 52,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.md,
            paddingVertical: spacing.xs ?? 4,
        },
        switchTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
        switchHint: {
            ...typography.caption,
            color: colors.textMuted,
            marginTop: 2,
        },

        userCardWrap: { borderRadius: radius.xl ?? radius.lg },
        userRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
        },
        avatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
        },
        avatarText: {
            ...typography.heading,
            color: colors.primary,
            fontWeight: '700',
            fontSize: 16,
        },
        userName: { ...typography.body, color: colors.text, fontWeight: '700' },
        userEmail: {
            ...typography.bodySmall,
            color: colors.textSecondary,
            marginTop: 2,
        },
        chevron: {
            fontSize: 26,
            color: colors.textMuted,
            fontWeight: '300',
        },

        aboutRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: spacing.sm,
            marginBottom: spacing.sm,
        },
        aboutLabel: {
            ...typography.body,
            color: colors.text,
            fontWeight: '600',
        },
        aboutValue: {
            ...typography.bodySmall,
            color: colors.textSecondary,
        },

        logoutRow: {
            minHeight: 52,
            borderRadius: radius.lg,
            backgroundColor: colors.cardSoft,
            alignItems: 'center',
            justifyContent: 'center',
        },
        logoutText: {
            ...typography.body,
            color: colors.danger ?? '#EF4444',
            fontWeight: '700',
        },
    });
