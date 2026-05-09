// src/lib/notifications.ts
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
import { registerDeviceToken } from '../api/deviceTokenService';
import { translate } from '../i18n';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Foreground'da bildirim geldiğinde nasıl davranılacağı:
 *   - Banner ve liste göster
 *   - Sesi çal — yalnızca ayarlardan açıksa
 *   - Badge set ETME (istemcide tutmuyoruz)
 */
Notifications.setNotificationHandler({
    handleNotification: async () => {
        const enabled = useSettingsStore.getState().notificationsEnabled;
        return {
            shouldShowBanner: enabled,
            shouldShowList: enabled,
            shouldPlaySound: enabled,
            shouldSetBadge: false,
        };
    },
});

/** Son aldığımız token'ı tutar; aynı oturumda 2x register/unregister'ı engeller. */
let cachedExpoPushToken: string | null = null;

/**
 * Bildirim izni iste + token al + backend'e kaydet.
 *
 * @returns Expo push token (başarılıysa) ya da null.
 *
 * Önemli:
 *   - Expo Go'da push çalışmaz → null döner.
 *   - Simülatörlerde push çalışmaz → null döner.
 *   - Settings'te `notificationsEnabled = false` ise OS izni İSTENMEZ.
 *     Kullanıcı önce ayar açmalı, sonra çağrılmalı. Bu hook tarafında değil,
 *     UI tarafında karar verilir.
 */
export async function registerForPushNotificationsAsync(
    userId?: string
): Promise<string | null> {
    if (Constants.appOwnership === 'expo') {
        if (__DEV__) console.log('[notifications] Expo Go: push disabled');
        return null;
    }

    if (!Device.isDevice) {
        if (__DEV__) console.log('[notifications] Not a real device, skipping');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        if (__DEV__) console.log('[notifications] Permission denied');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#007AFF',
            sound: 'default',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        // Yüksek öncelikli kanal — rota değişiklikleri için
        await Notifications.setNotificationChannelAsync('route-updates', {
            name: 'Route Updates',
            description: 'Rota optimizasyon bildirimleri',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#007AFF',
            sound: 'default',
        });
    }

    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        (Constants as any)?.easConfig?.projectId;

    if (!projectId) {
        if (__DEV__) console.warn('[notifications] No EAS projectId configured');
        return null;
    }

    let expoPushToken: string;
    try {
        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        expoPushToken = token.data;
    } catch (e) {
        if (__DEV__) console.warn('[notifications] Failed to get push token', e);
        return null;
    }

    if (cachedExpoPushToken === expoPushToken) {
        // Aynı token, tekrar register'a gerek yok
        return expoPushToken;
    }

    if (userId && expoPushToken) {
        try {
            await registerDeviceToken({
                userId,
                expoPushToken,
                platform: Platform.OS,
                deviceName: Device.deviceName ?? undefined,
                appVersion: Constants.expoConfig?.version ?? undefined,
            });
            cachedExpoPushToken = expoPushToken;
        } catch (e) {
            if (__DEV__) console.warn('[notifications] Backend register failed', e);
            // Token yine de döndür — kullanıcının cihazında token var
        }
    }

    return expoPushToken;
}

/**
 * Yerel test bildirimi gönder — backend'siz çalışır, push servislerinden bağımsız.
 *
 * Kullanım: Ayarlar → "Test Bildirimi Gönder" butonu.
 * Foreground'da bile bildirim handler'ı çalışır.
 */
export async function sendTestNotification() {
    const language = useSettingsStore.getState().language;

    // İzin kontrolü
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
        // Çift dilli uyarı (i18n key olmaması durumunda)
        Alert.alert(
            translate(language, 'notifications.permission.denied'),
            translate(language, 'notifications.permission.deniedHint'),
            [
                {
                    text: translate(language, 'notifications.permission.openSettings'),
                    onPress: () => Linking.openSettings(),
                },
                {
                    text: translate(language, 'common.cancel'),
                    style: 'cancel',
                },
            ]
        );
        return;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: translate(language, 'auth.appName'),
            body: '✓ ' + translate(language, 'notifications.testSent'),
            data: { type: 'TEST' },
            sound: 'default',
        },
        trigger: {
            seconds: 2,
            channelId: 'default',
        } as Notifications.TimeIntervalTriggerInput,
    });
}

/**
 * Foreground listener'ları kur. App._layout.tsx içinde bir kez çağrılmalı.
 *
 * @returns cleanup fn
 */
export function setupNotificationListeners(handlers?: {
    onReceived?: (notif: Notifications.Notification) => void;
    onResponded?: (resp: Notifications.NotificationResponse) => void;
}) {
    const recvSub = Notifications.addNotificationReceivedListener((n) => {
        if (__DEV__) console.log('[notifications] received', n.request.content.title);
        handlers?.onReceived?.(n);
    });

    const respSub = Notifications.addNotificationResponseReceivedListener((r) => {
        if (__DEV__) console.log('[notifications] tapped', r.notification.request.content.data);
        handlers?.onResponded?.(r);
    });

    return () => {
        recvSub.remove();
        respSub.remove();
    };
}

/** Cache temizle — logout sırasında çağır. */
export function clearNotificationCache() {
    cachedExpoPushToken = null;
}