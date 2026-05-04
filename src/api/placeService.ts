import axios from 'axios';

const API = axios.create({
    baseURL: 'http://10.0.2.2:8080/api/v1',
});

export type UserSavedPlace = {
    userId: string,
    id: string;
    placeName: string;
    placeType: string;
    address: string;
    latitude: number;
    longitude: number;
    isDefaultStart: boolean;
    isDefaultEnd: boolean;
};

export async function getUserPlaces(userId: string): Promise<UserSavedPlace[]> {
    const res = await API.get(`/places/${userId}`);
    return res.data;
}

export async function createPlace(payload: Partial<UserSavedPlace>) {
    const res = await API.post(`/places`, payload);
    return res.data;
}
