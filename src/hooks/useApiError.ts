// src/hooks/useApiError.ts
import { AxiosError } from 'axios';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { I18nKey } from '../i18n';
import { useTranslation } from './useTranslation';

/**
 * Backend'in döndüğü standart hata gövdesi (GlobalExceptionHandler):
 *   {
 *     errorCode: "EMAIL_ALREADY_EXISTS",
 *     message: "Bu e-posta zaten kayıtlı.",
 *     fieldErrors?: { email: "Geçersiz e-posta" }
 *   }
 */
export type ApiErrorBody = {
    errorCode?: string;
    message?: string;
    detail?: string;
    title?: string;
    fieldErrors?: Record<string, string>;
};

export type FriendlyError = {
    /** Kullanıcıya gösterilecek ana mesaj — i18n'den çevrilmiş. */
    message: string;
    /** Backend'in döndüğü kod, varsa. UI bazı durumlarda buna göre özel davranabilir. */
    code?: string;
    /** Form-bazlı hata varsa (örn: { email: "Geçersiz" }). */
    fieldErrors?: Record<string, string>;
    /** HTTP status (varsa). */
    status?: number;
};

/**
 * AxiosError veya benzerinden, kullanıcıya gösterilecek mesaj çıkarır.
 *
 * Stratejisi:
 *   1) errorCode varsa → t(`errors.${errorCode}`); çevirisi yoksa → backend message → fallback.
 *   2) Network/timeout → özel mesaj.
 *   3) HTTP koduna göre genel mesaj.
 */
export const useApiError = () => {
    const { t } = useTranslation();

    /** Hatayı kullanıcı dostu mesaja çevir. */
    const parse = useCallback(
        (error: unknown): FriendlyError => {
            // AxiosError mı?
            const axErr = error as AxiosError<ApiErrorBody>;

            if (axErr?.isAxiosError) {
                // 1) Network / timeout
                if (axErr.code === 'ECONNABORTED') {
                    return { message: t('errors.TIMEOUT'), code: 'TIMEOUT' };
                }
                if (!axErr.response) {
                    return { message: t('errors.NETWORK_ERROR'), code: 'NETWORK_ERROR' };
                }

                const status = axErr.response.status;
                const data = axErr.response.data ?? {};
                const code = data.errorCode;
                const fieldErrors = data.fieldErrors;
                const backendMessage = data.message ?? data.detail;

                // 2) Tanınan errorCode → i18n
                if (code) {
                    const key = `errors.${code}` as I18nKey;
                    const translated = t(key);
                    // translate() bilinmeyen key için path'i string olarak geri döner;
                    // bu durumda backendMessage > fallback
                    if (translated && translated !== key) {
                        return { message: translated, code, fieldErrors, status };
                    }
                }

                // 3) Backend mesajı
                if (backendMessage) {
                    return { message: backendMessage, code, fieldErrors, status };
                }

                // 4) HTTP koduna göre fallback
                if (status >= 500) {
                    return { message: t('errors.INTERNAL_ERROR'), code: 'INTERNAL_ERROR', status };
                }
                if (status === 401) {
                    return { message: t('errors.UNAUTHORIZED'), code: 'UNAUTHORIZED', status };
                }
                if (status === 403) {
                    return { message: t('errors.UNAUTHORIZED'), code: 'UNAUTHORIZED', status };
                }
                return { message: t('errors.UNKNOWN'), code: 'UNKNOWN', status };
            }

            // Native Error → message
            if (error instanceof Error && error.message) {
                return { message: error.message };
            }

            return { message: t('errors.UNKNOWN') };
        },
        [t]
    );

    /** Hatayı parse edip Alert ile göster — kısa kullanım. */
    const show = useCallback(
        (error: unknown, opts?: { title?: string }) => {
            const friendly = parse(error);
            Alert.alert(opts?.title ?? t('common.error'), friendly.message);
            return friendly;
        },
        [parse, t]
    );

    return { parse, show };
};
