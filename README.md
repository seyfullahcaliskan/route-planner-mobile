# Route Planner Mobile App

React Native + Expo ile geliştirilmiş kurye rota yönetim uygulaması.

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (Android için) veya Xcode (iOS için)

### Kurulum

```bash
npm install
```

### Development Server

```bash
npx expo start
```

Ardından:
- `a` → Android emulator
- `i` → iOS simulator
- **Expo Go** uygulaması ile QR kod tarat

---

## 📐 Proje Yapısı

```
app/
├── (tabs)/              → Ana tab navigation
│   ├── index.tsx        → Ana ekran (rota listesi)
│   └── explore.tsx      → Keşfet ekranı
├── routes/
│   └── [routePlanId].tsx → Rota detay ekranı (harita + duraklar)
├── import/              → Durak import ekranları
│   ├── csv.tsx
│   ├── manual.tsx
│   └── paste.tsx
├── places/              → Kayıtlı yerler
└── _layout.tsx          → Root layout

src/
├── api/                 → API servisleri
├── components/          → Reusable UI bileşenleri
├── config/              → Environment config
├── hooks/               → Custom hooks
├── lib/                 → Utility libraries
├── screens/             → Screen components
├── store/               → Zustand state management
├── theme/               → Design tokens (colors, spacing, typography)
├── types/               → TypeScript types
└── utils/               → Helper functions
```

---

## 🎨 Temel Özellikler

### ✅ Harita & Navigasyon
- **React Native Maps** ile canlı harita
- **Polyline** → Optimize edilmiş rota gösterimi
- **Marker'lar** → Her durak için pin
- **Google Maps Deep Link** → Navigasyon başlatma
- **Auto-fit** → Tüm durakları gösterecek şekilde zoom

### ✅ Durak Yönetimi
- **Teslim** → Durağı tamamla
- **Atla** → Durağı geç
- **Başarısız** → Teslimat başarısız
- **Gerçek zamanlı status** → Her durak için durum badge'i
- **Sticky header** → Seçili durak bilgisi üstte sabit

### ✅ Rota Optimizasyonu
- **"Yeniden Rota Oluştur"** butonu
- Teslim edilmemiş durakları yeniden sıralar
- Backend Nearest Neighbor + 2-Opt algoritması

### ✅ Dark Mode
- Sistem teması otomatik algılar
- Manuel dark/light mode switch
- Tüm renkler theme-aware

### ✅ Accessibility
- **Büyük dokunma modu** (Settings'ten aktif)
- Minimum 44pt touch target
- Semantic HTML labels
- VoiceOver/TalkBack desteği

---

## 🔧 Yapılandırma

### API Base URL

`src/config/environment.ts` içinde:

```typescript
const ENV = {
  dev: {
    apiUrl: 'http://10.0.2.2:8080/api/v1', // Android emulator
  },
  prod: {
    apiUrl: 'https://api.routeplanner.com/api/v1',
  },
};
```

### Demo User

`src/api/routeService.ts` içinde hardcoded:
```typescript
const DEMO_USER_ID = '1c34b887-83a4-4983-9954-12bca2aa2ce1';
```

**Production'da** JWT auth eklenince bu kaldırılacak.

---

## 📱 Ekranlar

### 1. Ana Ekran (Rota Listesi)
- Tüm rota planları
- Status badge'leri (DRAFT, READY, IN_PROGRESS, COMPLETED)
- Tamamlanma yüzdesi
- Durak sayısı

### 2. Rota Detay Ekranı
- **Harita** → Tüm duraklar + polyline
- **Durak listesi** → Scroll edilebilir
- **Aktif durak vurgusu** → Sıradaki durak highlight
- **Quick actions** → Teslim/Atla/Başarısız

### 3. Import Ekranları
- **CSV Import** → Toplu durak ekleme
- **Manuel Girdi** → Tek durak ekleme
- **Paste** → Clipboard'dan adres listesi

---

## 🎯 Backend Entegrasyonu

### Endpoint'ler

```typescript
GET    /api/v1/route-plans/user/{userId}         → Kullanıcının rotaları
GET    /api/v1/route-plans/{id}/stops            → Rota durakları
POST   /api/v1/route-plans/{id}/reoptimize       → Rotayı yeniden optimize et
POST   /api/v1/route-stops/{id}/deliver          → Durağı teslim et
POST   /api/v1/route-stops/{id}/skip             → Durağı atla
POST   /api/v1/route-stops/{id}/fail             → Durağı başarısız işaretle
GET    /api/v1/route-stops/{id}/navigation-url   → Google Maps URL
```

---

## 🚧 TODO (Faz 2)

- [ ] **Push Notifications** → Expo Notifications
- [ ] **JWT Authentication** → Login/Register ekranları
- [ ] **Offline Support** → AsyncStorage cache
- [ ] **Photo Upload** → Teslimat fotoğrafı
- [ ] **Signature Capture** → İmza alma
- [ ] **Analytics** → Mixpanel/Amplitude
- [ ] **Error Tracking** → Sentry
- [ ] **Performance Monitoring** → Firebase Performance

---

## 📦 Dependencies

### Core
- `expo` → Framework
- `react-native` → UI library
- `react-native-maps` → Harita
- `@tanstack/react-query` → API state management
- `zustand` → Global state
- `axios` → HTTP client

### Navigation
- `expo-router` → File-based routing

### UI/UX
- `react-native-safe-area-context` → Notch handling
- `expo-constants` → Device info
- `expo-linking` → Deep links

---

## 🧪 Test

```bash
# Unit tests (Jest)
npm test

# E2E tests (Detox - kurulum gerekli)
npm run e2e
```

---

## 🏗️ Build

### Android APK
```bash
npx expo build:android
```

### iOS IPA
```bash
npx expo build:ios
```

### EAS Build (Production)
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

## 📝 Lisans

Proprietary