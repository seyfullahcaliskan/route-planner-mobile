import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,

    name: 'route-planner-mobile',
    slug: 'route-planner-mobile',
    version: '1.0.0',
    scheme: 'routeplannermobile',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    // ─────────────────────────────────────────────────────────────
    // iOS
    // ─────────────────────────────────────────────────────────────
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.soparTg.routeplannermobile',
        infoPlist: {
            NSLocationWhenInUseUsageDescription:
                'Adres seçimi için harita üzerinde mevcut konumunuza erişmek istiyoruz.',
        },
        // Apple Sign-In ileride aktif edilecekse:
        // usesAppleSignIn: true,
    },

    // ─────────────────────────────────────────────────────────────
    // Android
    // ─────────────────────────────────────────────────────────────
    android: {
        package: 'com.soparTg.routeplannermobile',
        adaptiveIcon: {
            backgroundColor: '#E6F4FE',
            foregroundImage: './assets/images/android-icon-foreground.png',
            backgroundImage: './assets/images/android-icon-background.png',
            monochromeImage: './assets/images/android-icon-monochrome.png',
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        permissions: [
            'ACCESS_COARSE_LOCATION',
            'ACCESS_FINE_LOCATION',
        ],
        config: {
            googleMaps: {
                apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '',
            },
        },
    },

    // web bloğu kasıtlı kaldırıldı — kurye uygulaması mobile-only.
    // Expo'nun web bundle'ı denememesi için web outputu tanımlanmıyor.

    // ─────────────────────────────────────────────────────────────
    // Plugins
    // ─────────────────────────────────────────────────────────────
    plugins: [
        'expo-router',

        [
            'expo-splash-screen',
            {
                image: './assets/images/splash-icon.png',
                imageWidth: 200,
                resizeMode: 'contain',
                backgroundColor: '#ffffff',
                dark: { backgroundColor: '#000000' },
            },
        ],

        [
            'expo-location',
            {
                locationAlwaysAndWhenInUsePermission:
                    'Adres seçimi için konumunuza erişmek istiyoruz.',
            },
        ],

        [
            '@sentry/react-native/expo',
            {
                url: 'https://sentry.io/',
                project: 'react-native',
                organization: 'sopar-tg',
            },
        ],

        'expo-web-browser',
    ],

    // ─────────────────────────────────────────────────────────────
    // Experiments
    // ─────────────────────────────────────────────────────────────
    experiments: {
        typedRoutes: true,
        reactCompiler: true,
    },

    // ─────────────────────────────────────────────────────────────
    // Eas
    // ─────────────────────────────────────────────────────────────
    extra: {
        eas: {
            projectId: "e76f70d1-8ce5-4a3e-9c79-703149bbf4b8"
        }
    }
});