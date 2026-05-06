// src/store/useRouteImportStore.ts
import { create } from 'zustand';
import { ImportStopItem } from '../api/importService';

type StartEndPoint = {
    address: string;
    latitude?: number;
    longitude?: number;
};

type RouteImportState = {
    title: string;
    description: string;
    stops: ImportStopItem[];

    startAddress: string;
    startLatitude?: number;
    startLongitude?: number;

    endAddress: string;
    endLatitude?: number;
    endLongitude?: number;

    setTitle: (value: string) => void;
    setDescription: (value: string) => void;
    setStops: (value: ImportStopItem[]) => void;

    addStop: (value: ImportStopItem) => void;
    updateStop: (index: number, value: ImportStopItem) => void;
    removeStop: (index: number) => void;
    appendStops: (value: ImportStopItem[]) => void;

    setStartAddress: (value: string) => void;
    setEndAddress: (value: string) => void;
    setStartPoint: (value: StartEndPoint) => void;
    setEndPoint: (value: StartEndPoint) => void;

    clearAll: () => void;
};

const cleanStop = (s: ImportStopItem): ImportStopItem => ({
    ...s,
    rawAddress: s.rawAddress.trim(),
    // lat/lng aynen pass through
});

export const useRouteImportStore = create<RouteImportState>((set) => ({
    title: '',
    description: '',
    stops: [],

    startAddress: '',
    startLatitude: undefined,
    startLongitude: undefined,

    endAddress: '',
    endLatitude: undefined,
    endLongitude: undefined,

    setTitle: (value) => set({ title: value.trimStart() }),
    setDescription: (value) => set({ description: value }),

    setStops: (value) =>
        set({
            stops: (value || []).filter((s) => s?.rawAddress?.trim().length > 0).map(cleanStop),
        }),

    addStop: (value) => {
        if (!value?.rawAddress?.trim()) return;
        set((state) => ({ stops: [...state.stops, cleanStop(value)] }));
    },

    updateStop: (index, value) => {
        if (!value?.rawAddress?.trim()) return;
        set((state) => ({
            stops: state.stops.map((item, i) => (i === index ? cleanStop(value) : item)),
        }));
    },

    removeStop: (index) =>
        set((state) => ({ stops: state.stops.filter((_, i) => i !== index) })),

    appendStops: (value) => {
        const cleaned = (value || []).filter((s) => s?.rawAddress?.trim()).map(cleanStop);
        set((state) => ({ stops: [...state.stops, ...cleaned] }));
    },

    setStartAddress: (value) => set({ startAddress: value.trimStart() }),
    setEndAddress: (value) => set({ endAddress: value.trimStart() }),

    setStartPoint: (value) =>
        set({
            startAddress: value.address,
            startLatitude: value.latitude,
            startLongitude: value.longitude,
        }),

    setEndPoint: (value) =>
        set({
            endAddress: value.address,
            endLatitude: value.latitude,
            endLongitude: value.longitude,
        }),

    clearAll: () =>
        set({
            title: '',
            description: '',
            stops: [],
            startAddress: '',
            startLatitude: undefined,
            startLongitude: undefined,
            endAddress: '',
            endLatitude: undefined,
            endLongitude: undefined,
        }),
}));