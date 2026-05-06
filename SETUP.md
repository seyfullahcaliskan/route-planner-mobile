# Kurulum notları (bu turda eklenenler için)

## 1) Yüklenecek paketler

```bash
# Map picker için (ZORUNLU — yoksa map-picker ekranı çöker)
npx expo install react-native-maps expo-location

# Reanimated zaten varsa atla
# npx expo install react-native-reanimated react-native-gesture-handler
```

## 2) `app.json` eklemeleri

Aşağıdaki alanları `expo` objesine ekle (varsa üzerine yaz):

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Adres seçimi için harita üzerinde mevcut konumunuza erişmek istiyoruz."
      }
    },
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Adres seçimi için konumunuza erişmek istiyoruz."
        }
      ]
    ]
  }
}
```

### Google Maps API key (Android) ALMAK ZORUNDA MIYIM?

- **iOS**: HAYIR — Apple Maps native kullanılıyor, key gerekmez (`PROVIDER_DEFAULT` kullandık)
- **Android**: EVET — Android'de map view render etmek için Google Maps API key şart
  - https://console.cloud.google.com → "Maps SDK for Android" enable et
  - API key oluştur (paket adı + SHA1 ile kısıtla)
  - Yukarıdaki `apiKey` alanına yapıştır
  - Bu key sadece tile rendering için kullanılır — **reverse geocoding cihazda yapılıyor, ekstra ücret yok**

## 3) Test sırası

```bash
# Önce Metro cache'i temizle
npx expo start -c
```

1. **Login** ekranı açılmalı (DB boş olduğu için kayıt ol gerekiyor)
2. **Kayıt Ol** → form doldur → tabs'a yönlendir
3. **Ayarlar** → kullanıcı kartı + "Çıkış Yap" görünmeli
4. **Yeni Rota** → **Tek Tek Adres Ekle** → **📍 Haritadan Seç** → modal açılır
5. Haritada bir yere dokun → pin oturur, adres çözülür → **Bu Konumu Kullan**
6. Manual ekrana dönünce adres + lat/lng ile dolu form

## 4) Backend — application.yml zorunlu eklemeler

```yaml
app:
  jwt:
    secret: ${JWT_SECRET:change-me-with-32-bytes-minimum-secret-key-for-dev-only-please}
    access-token-validity-minutes: 15
    refresh-token-validity-days: 30
    issuer: route-planner
  oauth:
    google:
      client-ids: []   # OAuth aktifleşince doldur
    apple:
      client-ids: []
  cors:
    allowed-origin-patterns:
      - "http://localhost:*"
      - "http://10.0.2.2:*"
      - "http://192.168.*:*"
      - "exp://*"
```

**Üretimde** `JWT_SECRET` env var'ı 32+ byte güçlü random olmalı:

```bash
# Linux/macOS
openssl rand -base64 48

# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```