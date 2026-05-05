import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing, typography } from '../theme';
import PrimaryButton from './PrimaryButton';

type EmptyStateProps = {
    icon?: string; // emoji or icon name
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    illustration?: 'noRoutes' | 'noStops' | 'allDone' | 'error';
};

const illustrations = {
    noRoutes: {
        emoji: '🗺️',
        gradient: ['#EEF2FF', '#E0E7FF'],
    },
    noStops: {
        emoji: '📍',
        gradient: ['#FEF3C7', '#FDE68A'],
    },
    allDone: {
        emoji: '✅',
        gradient: ['#D1FAE5', '#A7F3D0'],
    },
    error: {
        emoji: '⚠️',
        gradient: ['#FEE2E2', '#FECACA'],
    },
};

export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    illustration = 'noRoutes',
}: EmptyStateProps) {
    const { colors } = useAppTheme();
    const preset = illustrations[illustration];

    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.iconCircle,
                    {
                        backgroundColor: preset.gradient[0],
                    },
                ]}
            >
                <Text style={styles.emoji}>{icon || preset.emoji}</Text>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
                {description}
            </Text>

            {actionLabel && onAction ? (
                <PrimaryButton
                    title={actionLabel}
                    onPress={onAction}
                    style={styles.actionButton}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxxl,
        paddingHorizontal: spacing.xl,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    emoji: {
        fontSize: 56,
    },
    title: {
        ...typography.title,
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    description: {
        ...typography.body,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 320,
        marginBottom: spacing.xl,
    },
    actionButton: {
        minWidth: 200,
    },
});