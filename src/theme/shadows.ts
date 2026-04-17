import { Platform } from 'react-native';

export const shadows = {
    card: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
        },
        android: {
            elevation: 2,
        },
        default: {},
    }),
    button: Platform.select({
        ios: {
            shadowColor: '#007AFF',
            shadowOpacity: 0.18,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
        },
        android: {
            elevation: 3,
        },
        default: {},
    }),
};