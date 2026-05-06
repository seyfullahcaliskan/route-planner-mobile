// src/i18n/index.ts
import type { Language } from '../store/useSettingsStore';
import { en } from './en';
import { tr } from './tr';

const dictionaries = { tr, en };

export type TranslationDict = typeof tr;

/** Nested key paths: "auth.loginTitle" → string | undefined */
type Path<T, P extends string = ''> = {
    [K in keyof T & string]: T[K] extends object
    ? Path<T[K], `${P}${K}.`>
    : `${P}${K}`;
}[keyof T & string];

export type I18nKey = Path<TranslationDict>;

const get = (obj: any, path: string): string => {
    const parts = path.split('.');
    let cur: any = obj;
    for (const p of parts) {
        if (cur == null) return path;
        cur = cur[p];
    }
    return typeof cur === 'string' ? cur : path;
};

const interpolate = (str: string, params?: Record<string, string | number>) => {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`));
};

export const translate = (
    language: Language,
    key: I18nKey,
    params?: Record<string, string | number>
): string => {
    const dict = dictionaries[language] ?? dictionaries.tr;
    const raw = get(dict, key);
    return interpolate(raw, params);
};

export { en, tr };
