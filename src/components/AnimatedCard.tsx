import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

type AnimatedCardProps = {
    children: React.ReactNode;
    index?: number;
    style?: any;
    delay?: number;
    animationType?: 'fade' | 'slideUp' | 'scale';
};

export default function AnimatedCard({
    children,
    index = 0,
    style,
    delay = 0,
    animationType = 'slideUp',
}: AnimatedCardProps) {
    const progress = useSharedValue(0);

    useEffect(() => {
        const animationDelay = delay + index * 50; // 50ms stagger

        setTimeout(() => {
            progress.value = withSpring(1, {
                damping: 20,
                mass: 0.5,
                stiffness: 100,
            });
        }, animationDelay);
    }, [index, delay]);

    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(progress.value, [0, 1], [0, 1]);

        if (animationType === 'fade') {
            return { opacity };
        }

        if (animationType === 'scale') {
            const scale = interpolate(progress.value, [0, 1], [0.95, 1], Extrapolate.CLAMP);
            return {
                opacity,
                transform: [{ scale }],
            };
        }

        // Default: slideUp
        const translateY = interpolate(progress.value, [0, 1], [20, 0], Extrapolate.CLAMP);
        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    return (
        <Animated.View style={[styles.container, animatedStyle, style]}>
            {children}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        // Base styles
    },
});