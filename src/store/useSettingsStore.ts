import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Language = 'tr' | 'en';
export type NavigationProvider = 'GOOGLE_MAPS' | 'YANDEX_MAPS' | 'APPLE_MAPS';

type SettingsState = {
    themeMode: ThemeMode;
    language: Language;
    notificationsEnabled: boolean;
    largeTouchMode: boolean;
    navigationProvider: NavigationProvider;

    setThemeMode: (value: ThemeMode) => void;
    setLanguage: (value: Language) => void;
    setNotificationsEnabled: (value: boolean) => void;
    setLargeTouchMode: (value: boolean) => void;
    setNavigationProvider: (value: NavigationProvider) => void;
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            themeMode: 'system',
            language: 'tr',
            notificationsEnabled: true,
            largeTouchMode: true,
            navigationProvider: 'GOOGLE_MAPS',

            setThemeMode: (value) => set({ themeMode: value }),
            setLanguage: (value) => set({ language: value }),
            setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
            setLargeTouchMode: (value) => set({ largeTouchMode: value }),
            setNavigationProvider: (value) => set({ navigationProvider: value }),
        }),
        {
            name: 'route-mobile-settings',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                themeMode: state.themeMode,
                language: state.language,
                notificationsEnabled: state.notificationsEnabled,
                largeTouchMode: state.largeTouchMode,
                navigationProvider: state.navigationProvider,
            }),
        }
    )
);