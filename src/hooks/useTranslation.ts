// src/hooks/useTranslation.ts
import { useCallback } from 'react';
import { I18nKey, translate } from '../i18n';
import { useSettingsStore } from '../store/useSettingsStore';

export const useTranslation = () => {
    const language = useSettingsStore((s) => s.language);

    const t = useCallback(
        (key: I18nKey, params?: Record<string, string | number>) => translate(language, key, params),
        [language]
    );

    return { t, language };
};