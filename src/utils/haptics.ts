import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Premium haptic feedback utilities
 * iOS: Native haptic engine
 * Android: Vibration fallback
 */

export const haptics = {
    /**
     * Light tap - UI interactions (button press, toggle)
     */
    light: async () => {
        if (Platform.OS === 'ios') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    },

    /**
     * Medium tap - Important actions (save, delete)
     */
    medium: async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    /**
     * Heavy tap - Critical actions (confirm delivery, fail)
     */
    heavy: async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },

    /**
     * Success feedback - Green checkmark moments
     */
    success: async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    /**
     * Warning feedback - Yellow alert moments
     */
    warning: async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },

    /**
     * Error feedback - Red error moments
     */
    error: async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },

    /**
     * Selection feedback - Picker/Slider interactions
     */
    selection: async () => {
        await Haptics.selectionAsync();
    },
};

/**
 * Usage:
 * 
 * // Button press
 * onPress={() => {
 *   haptics.light();
 *   handleAction();
 * }}
 * 
 * // Deliver stop
 * onPress={() => {
 *   haptics.success();
 *   deliverStop(id);
 * }}
 * 
 * // Fail stop
 * onPress={() => {
 *   haptics.error();
 *   failStop(id);
 * }}
 */