# Push Notifications Setup (Expo)

## 1. Install Dependencies

```bash
npx expo install expo-notifications expo-device
```

## 2. Configure `app.json`

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#4F46E5",
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#4F46E5",
      "androidMode": "default",
      "androidCollapsedTitle": "#{unread_notifications} yeni bildirim"
    }
  }
}
```

## 3. Request Permissions (App Başlangıcında)

```typescript
// app/_layout.tsx içinde
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

useEffect(() => {
  registerForPushNotifications();
}, []);

const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.log('Push notifications sadece fiziksel cihazda çalışır');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification izni reddedildi');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Expo Push Token:', token);

  // Backend'e gönder
  await api.post('/device-tokens/register', {
    expoPushToken: token,
    platform: Device.osName,
    deviceName: Device.deviceName,
    appVersion: '1.0.0',
  });
};
```

## 4. Notification Handler

```typescript
// src/lib/notifications.ts içinde
import * as Notifications from 'expo-notifications';

// Foreground notification görünümü
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification dinleyicileri
export const setupNotificationListeners = () => {
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification clicked:', response);
    
    // Payload'dan routePlanId al → navigate et
    const routePlanId = response.notification.request.content.data.routePlanId;
    if (routePlanId) {
      // router.push(`/routes/${routePlanId}`);
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(receivedListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};
```

## 5. Backend Notification Tetikleme

Backend'de şu event'ler push notification gönderecek:
- `ROUTE_REOPTIMIZED` → "Rota güncellendi"
- `STOP_DELIVERED` → "Teslimat tamamlandı"
- `STOP_FAILED` → "Teslimat başarısız"
- `STOP_SKIPPED` → "Durak atlandı"

Backend `/notification/send` endpoint'i Expo Push Notification Service'e istek atar.

## 6. Test

```bash
# Development build gerekir (Expo Go'da push notification test edilemez)
npx expo run:android
# veya
npx expo run:ios
```

---

## Backend Entegrasyonu

`NotificationServiceImpl.java` zaten hazır — sadece Expo token'ı kaydet:

```typescript
POST /api/v1/device-tokens/register
{
  "expoPushToken": "ExponentPushToken[xxx]",
  "platform": "android",
  "deviceName": "Pixel 5",
  "appVersion": "1.0.0"
}
```

Backend otomatik push notification gönderecek.