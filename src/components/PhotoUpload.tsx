// src/components/PhotoUpload.tsx
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, shadows, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';

type PhotoUploadProps = {
    onPhotoSelected?: (uri: string, base64?: string) => void;
    maxPhotos?: number;
    placeholder?: string;
};

export default function PhotoUpload({
    onPhotoSelected,
    maxPhotos = 3,
    placeholder = 'Teslimat Fotoğrafı Ekle',
}: PhotoUploadProps) {
    const { colors } = useAppTheme();
    const [photos, setPhotos] = useState<string[]>([]);

    const compressImage = async (uri: string) => {
        const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1200 } }], // Max 1200px width
            {
                compress: 0.7, // 70% quality
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true, // Get base64 for API upload
            }
        );
        return manipResult;
    };

    const pickImage = async () => {
        haptics.light();

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert(
                'İzin Gerekli',
                'Fotoğraf seçmek için galeri erişimi gereklidir.',
                [{ text: 'Tamam' }]
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const compressed = await compressImage(result.assets[0].uri);

            setPhotos((prev) => [...prev, compressed.uri]);

            if (onPhotoSelected) {
                onPhotoSelected(compressed.uri, compressed.base64);
            }

            haptics.success();
        }
    };

    const takePhoto = async () => {
        haptics.light();

        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert(
                'İzin Gerekli',
                'Fotoğraf çekmek için kamera erişimi gereklidir.',
                [{ text: 'Tamam' }]
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const compressed = await compressImage(result.assets[0].uri);

            setPhotos((prev) => [...prev, compressed.uri]);

            if (onPhotoSelected) {
                onPhotoSelected(compressed.uri, compressed.base64);
            }

            haptics.success();
        }
    };

    const removePhoto = (index: number) => {
        haptics.light();
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const showOptions = () => {
        Alert.alert('Fotoğraf Ekle', 'Nereden eklemek istersiniz?', [
            { text: 'Kamera', onPress: takePhoto },
            { text: 'Galeri', onPress: pickImage },
            { text: 'İptal', style: 'cancel' },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Photo Grid */}
            <View style={styles.photoGrid}>
                {photos.map((uri, index) => (
                    <View key={index} style={styles.photoCard}>
                        <Image source={{ uri }} style={styles.photoImage} />
                        <Pressable
                            style={styles.removeButton}
                            onPress={() => removePhoto(index)}
                        >
                            <Text style={styles.removeButtonText}>×</Text>
                        </Pressable>
                    </View>
                ))}

                {/* Add Photo Button */}
                {photos.length < maxPhotos && (
                    <Pressable
                        style={[styles.addPhotoCard, { borderColor: colors.border }]}
                        onPress={showOptions}
                    >
                        <Text style={styles.addPhotoIcon}>📷</Text>
                        <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>
                            {placeholder}
                        </Text>
                    </Pressable>
                )}
            </View>

            {/* Helper Text */}
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
                En fazla {maxPhotos} fotoğraf ekleyebilirsiniz
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: spacing.md,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    photoCard: {
        width: 100,
        height: 100,
        borderRadius: radius.lg,
        position: 'relative',
        ...shadows.card,
    },
    photoImage: {
        width: '100%',
        height: '100%',
        borderRadius: radius.lg,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.card,
    },
    removeButtonText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 20,
    },
    addPhotoCard: {
        width: 100,
        height: 100,
        borderRadius: radius.lg,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    addPhotoIcon: {
        fontSize: 32,
        marginBottom: spacing.xs,
    },
    addPhotoText: {
        ...typography.caption,
        fontSize: 10,
        textAlign: 'center',
        paddingHorizontal: spacing.xs,
    },
    helperText: {
        ...typography.caption,
        marginTop: spacing.sm,
    },
});