import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, shadows } from '../theme';

type Props = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    style?: ViewStyle;
};

export default function PrimaryButton({ title, onPress, disabled, style }: Props) {
    const { colors } = useAppTheme();

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.button,
                {
                    backgroundColor: colors.primary,
                    opacity: disabled ? 0.55 : pressed ? 0.86 : 1,
                },
                style,
            ]}
        >
            <Text style={styles.text}>{title}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 54,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.button,
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
});