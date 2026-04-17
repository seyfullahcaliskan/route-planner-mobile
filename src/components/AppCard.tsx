import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, shadows, spacing } from '../theme';

type Props = ViewProps & {
    soft?: boolean;
};

export default function AppCard({ children, style, soft = false, ...rest }: Props) {
    const { colors } = useAppTheme();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: soft ? colors.cardSoft : colors.card,
                    borderColor: colors.border,
                },
                style,
            ]}
            {...rest}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        ...shadows.card,
    },
});