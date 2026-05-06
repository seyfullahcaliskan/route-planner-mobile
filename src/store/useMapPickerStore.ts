// src/store/useMapPickerStore.ts
import { create } from 'zustand';

/**
 * Map picker geri dönüş kanalı.
 *
 * Neden router params değil de store?
 *   - Expo Router params string-only, lat/lng için number'a parse gerek
 *   - Çağıran ekrana geri dönerken modal kapanır kapanmaz state lazım
 *   - Birden fazla yerden çağrılınca (start, end, manual stop) hangisi olduğunu işaretleyebiliyoruz
 */

export type MapPickerResult = {
    latitude: number;
    longitude: number;
    address: string;
};

/** Çağıran ekran kim, hangi alana atanmalı? */
export type MapPickerTarget =
    | 'import-start'
    | 'import-end'
    | 'import-manual-stop'
    | 'place-create'
    | 'custom';

type MapPickerState = {
    target: MapPickerTarget | null;
    result: MapPickerResult | null;

    /** Çağırmadan hemen önce target'ı set et. */
    open: (target: MapPickerTarget) => void;

    /** Picker ekranı seçimi tamamladığında çağırır. */
    setResult: (result: MapPickerResult) => void;

    /** Çağıran ekran sonucu okuduktan sonra temizler. */
    consume: () => MapPickerResult | null;

    reset: () => void;
};

export const useMapPickerStore = create<MapPickerState>((set, get) => ({
    target: null,
    result: null,

    open: (target) => set({ target, result: null }),

    setResult: (result) => set({ result }),

    consume: () => {
        const r = get().result;
        if (r) set({ result: null, target: null });
        return r;
    },

    reset: () => set({ target: null, result: null }),
}));