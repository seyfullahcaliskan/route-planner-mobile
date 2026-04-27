import { create } from 'zustand';
import { ImportStopItem } from '../api/importService';

type RouteImportState = {
    title: string;
    description: string;
    stops: ImportStopItem[];
    startAddress: string;
    endAddress: string;

    setTitle: (value: string) => void;
    setDescription: (value: string) => void;
    setStops: (value: ImportStopItem[]) => void;

    addStop: (value: ImportStopItem) => void;
    updateStop: (index: number, value: ImportStopItem) => void;
    removeStop: (index: number) => void;
    appendStops: (value: ImportStopItem[]) => void;

    setStartAddress: (value: string) => void;
    setEndAddress: (value: string) => void;

    clearAll: () => void;
};

export const useRouteImportStore = create<RouteImportState>((set, get) => ({
    title: '',
    description: '',
    stops: [],
    startAddress: '',
    endAddress: '',

    setTitle: (value) => set({ title: value.trimStart() }),

    setDescription: (value) => set({ description: value }),

    setStops: (value) =>
        set({
            stops: (value || []).filter((s) => s?.rawAddress?.trim().length > 0),
        }),

    addStop: (value) => {
        if (!value?.rawAddress?.trim()) return;

        set((state) => ({
            stops: [
                ...state.stops,
                {
                    ...value,
                    rawAddress: value.rawAddress.trim(),
                },
            ],
        }));
    },

    updateStop: (index, value) => {
        if (!value?.rawAddress?.trim()) return;

        set((state) => ({
            stops: state.stops.map((item, i) =>
                i === index
                    ? {
                        ...value,
                        rawAddress: value.rawAddress.trim(),
                    }
                    : item
            ),
        }));
    },

    removeStop: (index) =>
        set((state) => ({
            stops: state.stops.filter((_, i) => i !== index),
        })),

    appendStops: (value) => {
        const cleaned = (value || []).filter((s) => s?.rawAddress?.trim());

        set((state) => ({
            stops: [
                ...state.stops,
                ...cleaned.map((s) => ({
                    ...s,
                    rawAddress: s.rawAddress.trim(),
                })),
            ],
        }));
    },

    setStartAddress: (value) =>
        set({
            startAddress: value.trimStart(),
        }),

    setEndAddress: (value) =>
        set({
            endAddress: value.trimStart(),
        }),

    clearAll: () =>
        set({
            title: '',
            description: '',
            stops: [],
            startAddress: '',
            endAddress: '',
        }),
}));