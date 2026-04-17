import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius } from '../theme';

type Props = {
    label: string;
    color?: string;
    backgroundColor?: string;
};

export default function StatusPill({ label, color, backgroundColor }: Props) {
    const { colors } = useAppTheme();

    return (
        <View
            style={[
                styles.pill,
                { backgroundColor: backgroundColor || colors.cardSoft },
            ]}
        >
            <Text style={[styles.text, { color: color || colors.textSecondary }]}>
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: radius.pill,
    },
    text: {
        fontSize: 12,
        fontWeight: '700',
    },
});