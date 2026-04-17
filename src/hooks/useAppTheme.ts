import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { darkColors, lightColors } from '../theme';

export const useAppTheme = () => {
    const systemScheme = useColorScheme();
    const { themeMode } = useSettingsStore();

    const isDark =
        themeMode === 'dark' ||
        (themeMode === 'system' && systemScheme === 'dark');

        
    return {
        isDark,
        colors: isDark ? darkColors : lightColors,
    };
};