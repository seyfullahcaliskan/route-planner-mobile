// src/lib/oauth.ts
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';

/**
 * GOOGLE SIGN-IN — opsiyonel
 *
 * Env var'lar set edilmediyse Google butonu hiç render edilmez (hook da çağrılmaz).
 * Bu sayede client ID henüz tanımlanmadıysa uygulama hata vermeden açılır.
 *
 * Kurulum:
 * 1. https://console.cloud.google.com → Credentials → OAuth 2.0 Client ID üret
 *    - iOS Client (bundle: com.yourcompany.routeplanner)
 *    - Android Client (package + SHA1 — Expo: `eas credentials` ile alabilirsin)
 *    - Web Client (Expo Go testi + yedek)
 * 2. .env dosyasına ekle (Expo otomatik yükler):
 *      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
 *      EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
 *      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
 * 3. Backend application.yml → app.oauth.google.client-ids: bu üçünü de listele
 */
const GOOGLE_IOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const isGoogleAuthConfigured = (): boolean => {
    if (Platform.OS === 'ios') return !!GOOGLE_IOS || !!GOOGLE_WEB;
    if (Platform.OS === 'android') return !!GOOGLE_ANDROID || !!GOOGLE_WEB;
    return !!GOOGLE_WEB;
};

/**
 * DİKKAT: Bu hook'u SADECE isGoogleAuthConfigured()===true ise render edilen
 * bir komponent içinde çağır. Aksi halde "Client Id must be defined" hatası alırsın.
 */
export const useGoogleAuthRequest = () => {
    return Google.useAuthRequest({
        iosClientId: GOOGLE_IOS,
        androidClientId: GOOGLE_ANDROID,
        webClientId: GOOGLE_WEB,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: makeRedirectUri(),
    });
};

/**
 * APPLE SIGN-IN — sadece iOS 13+
 *
 * Android'de Apple, web-based "Sign in with Apple JS" gerektirir; bu projede ATLIYORUZ
 * (kurye uygulaması, Android tarafı Google ile yeter).
 *
 * app.json → ios.usesAppleSignIn: true
 * Apple Developer → bundle ID için "Sign In with Apple" capability açık
 *
 * Backend application.yml → app.oauth.apple.client-ids:
 *   - "com.yourcompany.routeplanner"   ← bundle ID'n
 */
export const isAppleAuthAvailable = async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') return false;
    try {
        return await AppleAuthentication.isAvailableAsync();
    } catch {
        return false;
    }
};

export type AppleSignInResult = {
    idToken: string;
    fallbackEmail?: string;
    fallbackName?: string;
};

export const signInWithApple = async (): Promise<AppleSignInResult | null> => {
    try {
        const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
        });
        if (!credential.identityToken) return null;

        const fullName = credential.fullName;
        const fallbackName = fullName
            ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ').trim()
            : undefined;

        return {
            idToken: credential.identityToken,
            fallbackEmail: credential.email ?? undefined,
            fallbackName: fallbackName || undefined,
        };
    } catch (e: any) {
        if (e?.code === 'ERR_REQUEST_CANCELED') return null;
        throw e;
    }
};