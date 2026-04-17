import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, spacing, typography } from '../theme';

type Option<T extends string> = {
    label: string;
    value: T;
};

type Props<T extends string> = {
    value: T;
    options: Option<T>[];
    onChange: (value: T) => void;
};

export default function CompactSegment<T extends string>({
    value,
    options,
    onChange,
}: Props<T>) {
    const { colors } = useAppTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.cardSoft }]}>
            {options.map((option) => {
                const active = option.value === value;

                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        style={[
                            styles.item,
                            {
                                backgroundColor: active ? colors.card : 'transparent',
                                borderColor: active ? colors.border : 'transparent',
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.label,
                                { color: active ? colors.text : colors.textSecondary },
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderRadius: radius.md,
        padding: 4,
        gap: 4,
    },
    item: {
        flex: 1,
        minHeight: 36,
        borderRadius: radius.sm,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
    },
    label: {
        ...typography.bodySmall,
        fontWeight: '700',
    },
});