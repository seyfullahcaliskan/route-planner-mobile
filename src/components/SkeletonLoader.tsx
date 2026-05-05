import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius } from '../theme';

type SkeletonProps = {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
};

export function Skeleton({ width = '100%', height = 20, borderRadius = radius.md, style }: SkeletonProps) {
    const { colors, isDark } = useAppTheme();
    const shimmer = useSharedValue(0);

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1, // infinite
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(shimmer.value, [0, 1], [-200, 200]);

        return {
            transform: [{ translateX }],
        };
    });

    return (
        <View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: isDark ? colors.cardSoft : '#E5E7EB',
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmer,
                    animatedStyle,
                    {
                        backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 0.8)',
                    },
                ]}
            />
        </View>
    );
}

// Preset skeleton layouts
export function RouteCardSkeleton() {
    return (
        <View style={styles.cardSkeleton}>
            <View style={styles.cardHeader}>
                <Skeleton width={120} height={16} />
                <Skeleton width={60} height={24} borderRadius={radius.pill} />
            </View>

            <Skeleton width="100%" height={14} style={{ marginTop: 8 }} />
            <Skeleton width="70%" height={14} style={{ marginTop: 6 }} />

            <View style={styles.statsRow}>
                <Skeleton width={60} height={32} />
                <Skeleton width={60} height={32} />
                <Skeleton width={60} height={32} />
            </View>
        </View>
    );
}

export function StopCardSkeleton() {
    return (
        <View style={styles.cardSkeleton}>
            <View style={styles.stopHeader}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
                </View>
            </View>

            <Skeleton width="100%" height={60} style={{ marginTop: 12 }} />
            <Skeleton width="100%" height={48} style={{ marginTop: 8 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
    shimmer: {
        width: 200,
        height: '100%',
        opacity: 0.5,
    },
    cardSkeleton: {
        padding: 16,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    stopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});