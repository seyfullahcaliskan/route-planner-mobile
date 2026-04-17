import { create } from 'zustand';
import { ImportStopItem } from '../api/importService';

type RouteImportState = {
    title: string;
    description: string;
    stops: ImportStopItem[];

    setTitle: (value: string) => void;
    setDescription: (value: string) => void;
    setStops: (value: ImportStopItem[]) => void;

    addStop: (value: ImportStopItem) => void;
    updateStop: (index: number, value: ImportStopItem) => void;
    removeStop: (index: number) => void;
    appendStops: (value: ImportStopItem[]) => void;

    clearAll: () => void;
};

export const useRouteImportStore = create<RouteImportState>((set) => ({
    title: '',
    description: '',
    stops: [],

    setTitle: (value) => set({ title: value }),
    setDescription: (value) => set({ description: value }),
    setStops: (value) => set({ stops: value }),

    addStop: (value) =>
        set((state) => ({
            stops: [...state.stops, value],
        })),

    updateStop: (index, value) =>
        set((state) => ({
            stops: state.stops.map((item, i) => (i === index ? value : item)),
        })),

    removeStop: (index) =>
        set((state) => ({
            stops: state.stops.filter((_, i) => i !== index),
        })),

    appendStops: (value) =>
        set((state) => ({
            stops: [...state.stops, ...value],
        })),

    clearAll: () =>
        set({
            title: '',
            description: '',
            stops: [],
        }),
}));