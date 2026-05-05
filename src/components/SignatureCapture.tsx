import React, { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Signature, { SignatureViewRef } from 'react-native-signature-canvas';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, shadows, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';

type SignatureCaptureProps = {
    onSignatureConfirmed?: (base64: string) => void;
    onCancel?: () => void;
    title?: string;
    showSignerName?: boolean;
};

export default function SignatureCapture({
    onSignatureConfirmed,
    onCancel,
    title = 'Teslimat İmzası',
    showSignerName = true,
}: SignatureCaptureProps) {
    const { colors, isDark } = useAppTheme();
    const signatureRef = useRef<SignatureViewRef>(null);
    const [signerName, setSignerName] = useState('');
    const [hasSignature, setHasSignature] = useState(false);

    const handleOK = (signature: string) => {
        setHasSignature(true);
    };

    const handleEmpty = () => {
        setHasSignature(false);
    };

    const handleClear = () => {
        haptics.light();
        signatureRef.current?.clearSignature();
        setHasSignature(false);
    };

    const handleConfirm = () => {
        if (!hasSignature) {
            haptics.error();
            Alert.alert('İmza Gerekli', 'Lütfen imza alanına imzanızı atın.', [
                { text: 'Tamam' },
            ]);
            return;
        }

        haptics.success();
        signatureRef.current?.readSignature();
    };

    const handleData = (signature: string) => {
        if (onSignatureConfirmed) {
            onSignatureConfirmed(signature);
        }
    };

    const webStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: ${isDark ? '#1F2937' : '#FFFFFF'};
    }
    .m-signature-pad--body {
      border: 2px dashed ${colors.border};
      border-radius: 12px;
      background-color: ${isDark ? '#1F2937' : '#FAFAFA'};
    }
    .m-signature-pad--footer {
      display: none;
    }
    body, html {
      background-color: ${isDark ? '#111827' : '#F3F4F6'};
    }
  `;

    return (
        <View style={[styles.container, { backgroundColor: colors.page }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Pressable
                    onPress={() => {
                        haptics.light();
                        onCancel?.();
                    }}
                    style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                >
                    <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
                        ✕
                    </Text>
                </Pressable>
            </View>

            <View style={styles.content}>
                <View
                    style={[
                        styles.signatureContainer,
                        { backgroundColor: isDark ? colors.card : '#FFFFFF' },
                    ]}
                >
                    <Signature
                        ref={signatureRef}
                        onOK={handleData}
                        onEmpty={handleEmpty}
                        onBegin={() => setHasSignature(true)}
                        descriptionText=""
                        clearText="Temizle"
                        confirmText="Onayla"
                        webStyle={webStyle}
                        autoClear={false}
                        imageType="image/png"
                    />
                </View>

                <View style={styles.hint}>
                    <Text style={[styles.hintText, { color: colors.textMuted }]}>
                        👆 Parmağınızla yukarıdaki alana imzanızı atın
                    </Text>
                </View>

                {showSignerName && (
                    <View style={styles.nameInputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>
                            İmza Sahibi (Opsiyonel)
                        </Text>
                        <View
                            style={[
                                styles.nameInput,
                                {
                                    backgroundColor: isDark ? colors.cardSoft : '#F9FAFB',
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={{ fontSize: 16, color: colors.text }}>
                                {signerName || 'Ad Soyad'}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Pressable
                    style={({ pressed }) => [
                        styles.footerButton,
                        styles.clearButton,
                        { backgroundColor: colors.cardSoft },
                        pressed && styles.pressed,
                    ]}
                    onPress={handleClear}
                >
                    <Text style={[styles.footerButtonText, { color: colors.text }]}>
                        Temizle
                    </Text>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.footerButton,
                        styles.confirmButton,
                        { backgroundColor: hasSignature ? colors.primary : colors.cardSoft },
                        pressed && styles.pressed,
                    ]}
                    onPress={handleConfirm}
                >
                    <Text
                        style={[
                            styles.footerButtonText,
                            { color: hasSignature ? colors.white : colors.textMuted },
                        ]}
                    >
                        Onayla ve Kaydet
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    title: {
        ...typography.heading,
        fontSize: 18,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 24,
        lineHeight: 24,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    signatureContainer: {
        height: 300,
        borderRadius: radius.xl,
        overflow: 'hidden',
        ...shadows.card,
    },
    hint: {
        marginTop: spacing.md,
        alignItems: 'center',
    },
    hintText: {
        ...typography.bodySmall,
    },
    nameInputContainer: {
        marginTop: spacing.xl,
    },
    inputLabel: {
        ...typography.bodySmall,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    nameInput: {
        height: 52,
        borderRadius: radius.lg,
        borderWidth: 1,
        paddingHorizontal: spacing.lg,
        justifyContent: 'center',
    },
    footer: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
    },
    footerButton: {
        flex: 1,
        height: 56,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearButton: {},
    confirmButton: {},
    footerButtonText: {
        ...typography.body,
        fontWeight: '700',
    },
    pressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
});