// src/api/placeService.ts
import { api } from './client';

export type SavedPlaceType = 'HOME' | 'WORK' | 'WAREHOUSE' | 'STORE' | 'CUSTOM';

export type UserSavedPlace = {
    id: string;
    placeName: string;
    placeType: SavedPlaceType;
    address: string;
    latitude: number;
    longitude: number;
    isDefaultStart: boolean;
    isDefaultEnd: boolean;
};

export type CreatePlacePayload = {
    placeName: string;
    placeType: SavedPlaceType;
    address: string;
    latitude: number;
    longitude: number;
    isDefaultStart?: boolean;
    isDefaultEnd?: boolean;
};

export type UpdatePlacePayload = Partial<CreatePlacePayload>;

/** Kayıtlı yerleri getir (current user — JWT'den). */
export async function getMyPlaces(): Promise<UserSavedPlace[]> {
    const res = await api.get<UserSavedPlace[]>('/places/me');
    return res.data;
}

/** Tek kaydı getir. */
export async function getPlace(id: string): Promise<UserSavedPlace> {
    const res = await api.get<UserSavedPlace>(`/places/me/${id}`);
    return res.data;
}

export async function createPlace(payload: CreatePlacePayload): Promise<UserSavedPlace> {
    const res = await api.post<UserSavedPlace>('/places/me', payload);
    return res.data;
}

export async function updatePlace(id: string, payload: UpdatePlacePayload): Promise<UserSavedPlace> {
    const res = await api.put<UserSavedPlace>(`/places/me/${id}`, payload);
    return res.data;
}

export async function deletePlace(id: string): Promise<void> {
    await api.delete(`/places/me/${id}`);
}
