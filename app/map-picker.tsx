// app/map-picker.tsx
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MapView, { MapPressEvent, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';

import PrimaryButton from '@/src/components/PrimaryButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useMapPickerStore } from '@/src/store/useMapPickerStore';
import { radius, shadows, spacing, typography } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';

/** Karabük civarı default — konum izni reddedilirse kullanılır. */
const FALLBACK_REGION: Region = {
    latitude: 41.2,
    longitude: 32.6,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

type Coords = { latitude: number; longitude: number };

export default function MapPickerScreen() {
    const { colors, isDark } = useAppTheme();
    const { t } = useTranslation();
    const setResult = useMapPickerStore((s) => s.setResult);

    const styles = createStyles(colors);

    const mapRef = useRef<MapView>(null);
    const [pin, setPin] = useState<Coords | null>(null);
    const [address, setAddress] = useState<string>('');
    const [isLocating, setIsLocating] = useState(true);
    const [isResolving, setIsResolving] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    /** Cihaz-içi reverse geocoding — TAMAMEN ücretsiz, harici API çağrısı yok. */
    const resolveAddress = async (coords: Coords) => {
        setIsResolving(true);
        try {
            const results = await Location.reverseGeocodeAsync(coords);
            const r = results?.[0];
            if (r) {
                const parts = [
                    r.street,
                    r.streetNumber,
                    r.district,
                    r.subregion,
                    r.city ?? r.region,
                    r.country,
                ].filter((x) => x && x.trim().length > 0);
                setAddress(parts.join(', '));
            } else {
                setAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
            }
        } catch {
            setAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
        } finally {
            setIsResolving(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setPermissionDenied(true);
                    setIsLocating(false);
                    return;
                }
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                const coords: Coords = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                };
                const newRegion: Region = {
                    ...coords,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };
                setPin(coords);
                resolveAddress(coords);
                mapRef.current?.animateToRegion(newRegion, 500);
            } catch {
                setPermissionDenied(true);
            } finally {
                setIsLocating(false);
            }
        })();
    }, []);

    const handleMapPress = (e: MapPressEvent) => {
        const coords = e.nativeEvent.coordinate;
        haptics.light();
        setPin(coords);
        resolveAddress(coords);
    };

    const handleMarkerDragEnd = (e: any) => {
        const coords = e.nativeEvent.coordinate;
        haptics.light();
        setPin(coords);
        resolveAddress(coords);
    };

    const handleUseMyLocation = async () => {
        haptics.light();
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('common.warning'), t('mapPicker.locationPermissionDenied'));
                return;
            }
            setIsLocating(true);
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            const coords: Coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };
            const newRegion: Region = {
                ...coords,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            setPin(coords);
            mapRef.current?.animateToRegion(newRegion, 500);
            resolveAddress(coords);
        } catch {
            // sessizce yut
        } finally {
            setIsLocating(false);
        }
    };

    const handleConfirm = () => {
        if (!pin) return;
        haptics.success();
        setResult({
            latitude: pin.latitude,
            longitude: pin.longitude,
            address: address || `${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`,
        });
        router.back();
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={FALLBACK_REGION}
                onPress={handleMapPress}
                showsUserLocation={!permissionDenied}
                showsMyLocationButton={false}
                userInterfaceStyle={isDark ? 'dark' : 'light'}
            >
                {pin && (
                    <Marker
                        coordinate={pin}
                        draggable
                        onDragEnd={handleMarkerDragEnd}
                        pinColor={colors.primary}
                    />
                )}
            </MapView>

            <View style={styles.hintCard} pointerEvents="none">
                <Text style={styles.hintText}>{t('mapPicker.searchHint')}</Text>
            </View>

            <View style={styles.bottomPanel}>
                <View style={styles.addressBox}>
                    {isLocating ? (
                        <View style={styles.locatingRow}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.locatingText}>{t('mapPicker.gettingLocation')}</Text>
                        </View>
                    ) : pin ? (
                        <>
                            <Text style={styles.addressLabel}>
                                {isResolving ? '...' : t('mapPicker.title')}
                            </Text>
                            <Text style={styles.addressText} numberOfLines={2}>
                                {address || `${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`}
                            </Text>
                        </>
                    ) : (
                        <Text style={styles.addressText}>{t('mapPicker.searchHint')}</Text>
                    )}
                </View>

                <Pressable onPress={handleUseMyLocation} style={styles.myLocationButton}>
                    <Text style={styles.myLocationText}>📍 {t('mapPicker.useCurrentLocation')}</Text>
                </Pressable>

                <PrimaryButton
                    title={t('mapPicker.confirmLocation')}
                    onPress={handleConfirm}
                    disabled={!pin || isResolving}
                />
            </View>
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.page },
        map: { flex: 1 },
        hintCard: {
            position: 'absolute',
            top: spacing.md,
            left: spacing.md,
            right: spacing.md,
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
            ...shadows.card,
        },
        hintText: { ...typography.bodySmall, color: colors.text, textAlign: 'center' },
        bottomPanel: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.card,
            borderTopLeftRadius: radius.xxl,
            borderTopRightRadius: radius.xxl,
            padding: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            ...shadows.card,
        },
        addressBox: {
            backgroundColor: colors.cardSoft,
            borderRadius: radius.lg,
            padding: spacing.md,
            minHeight: 60,
            justifyContent: 'center',
        },
        locatingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        locatingText: { ...typography.bodySmall, color: colors.textSecondary },
        addressLabel: {
            ...typography.caption,
            color: colors.textMuted,
            fontWeight: '600',
            marginBottom: 4,
        },
        addressText: { ...typography.body, color: colors.text, fontWeight: '500' },
        myLocationButton: {
            minHeight: 44,
            borderRadius: radius.lg,
            backgroundColor: colors.cardSoft,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        myLocationText: { ...typography.body, color: colors.primary, fontWeight: '600' },
    });