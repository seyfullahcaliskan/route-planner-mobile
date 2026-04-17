import { api } from './client';

export type RegisterDeviceTokenPayload = {
    userId: string;
    expoPushToken: string;
    platform: string;
    deviceName?: string;
    appVersion?: string;
};

export const registerDeviceToken = async (payload: RegisterDeviceTokenPayload) => {
    const response = await api.post('/device-tokens', payload);
    return response.data;
};