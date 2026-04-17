import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing, typography } from '../theme';

type Props = {
    title: string;
    value?: string;
    children?: React.ReactNode;
};

export default function SettingRow({ title, value, children }: Props) {
    const { colors } = useAppTheme();

    return (
        <View style={styles.wrapper}>
            <View style={styles.topRow}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                {value ? (
                    <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text>
                ) : null}
            </View>
            {children ? <View style={styles.content}>{children}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: spacing.md,
    },
    topRow: {
        minHeight: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    title: {
        ...typography.body,
        fontWeight: '700',
    },
    value: {
        ...typography.bodySmall,
        fontWeight: '600',
    },
    content: {
        marginTop: 2,
    },
});