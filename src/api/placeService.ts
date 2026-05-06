// src/api/placeService.ts
import { useAuthStore } from '../store/useAuthStore';
import { api } from './client';

export type SavedPlaceType = 'HOME' | 'WORK' | 'WAREHOUSE' | 'STORE' | 'CUSTOM';

export type UserSavedPlace = {
    id: string;
    userId: string;
    placeName: string;
    placeType: SavedPlaceType;
    address: string;
    latitude: number;
    longitude: number;
    isDefaultStart: boolean;
    isDefaultEnd: boolean;
};

const requireUserId = (): string => {
    const id = useAuthStore.getState().user?.id;
    if (!id) throw new Error('Oturum bulunamadı.');
    return id;
};

export async function getMyPlaces(): Promise<UserSavedPlace[]> {
    const userId = requireUserId();
    const res = await api.get<UserSavedPlace[]>(`/places/${userId}`);
    return res.data;
}

export async function createPlace(payload: {
    placeName: string;
    placeType: SavedPlaceType;
    address: string;
    latitude: number;
    longitude: number;
    isDefaultStart?: boolean;
    isDefaultEnd?: boolean;
}): Promise<UserSavedPlace> {
    const userId = requireUserId();
    const res = await api.post<UserSavedPlace>('/places', { userId, ...payload });
    return res.data;
}