import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerDeviceToken } from '../api/deviceTokenService';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync(userId?: string) {
    if (Constants.appOwnership === 'expo') {
        console.log('Expo Go detected, push registration skipped.');
        return null;
    }

    if (!Device.isDevice) {
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#007AFF',
            sound: 'default',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
    }

    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

    if (!projectId) {
        return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = token.data;

    if (userId && expoPushToken) {
        await registerDeviceToken({
            userId,
            expoPushToken,
            platform: Platform.OS,
            deviceName: Device.deviceName ?? undefined,
            appVersion: Constants.expoConfig?.version ?? undefined,
        });
    }

    return expoPushToken;
}