import { Easing } from 'react-native-reanimated';

export const animations = {
    // Smooth easing curves
    spring: {
        damping: 20,
        mass: 0.5,
        stiffness: 100,
    },

    timing: {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // ease-in-out
    },

    timingFast: {
        duration: 200,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1), // ease-out
    },

    timingSlow: {
        duration: 500,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    },

    // Preset animations
    fadeIn: {
        from: { opacity: 0 },
        to: { opacity: 1 },
    },

    slideInUp: {
        from: { opacity: 0, transform: [{ translateY: 50 }] },
        to: { opacity: 1, transform: [{ translateY: 0 }] },
    },

    slideInDown: {
        from: { opacity: 0, transform: [{ translateY: -50 }] },
        to: { opacity: 1, transform: [{ translateY: 0 }] },
    },

    scaleIn: {
        from: { opacity: 0, transform: [{ scale: 0.9 }] },
        to: { opacity: 1, transform: [{ scale: 1 }] },
    },
};

// Stagger animation helper
export const staggerConfig = {
    delayBetween: 50, // ms between each item
};