import { create } from 'zustand';
import { UserSavedPlace } from '../api/placeService';

type State = {
    places: UserSavedPlace[];
    selectedPlace: UserSavedPlace | null;

    setPlaces: (p: UserSavedPlace[]) => void;
    setSelectedPlace: (p: UserSavedPlace | null) => void;
};

export const usePlaceStore = create<State>((set) => ({
    places: [],
    selectedPlace: null,

    setPlaces: (places) => set({ places }),
    setSelectedPlace: (p) => set({ selectedPlace: p }),
}));
