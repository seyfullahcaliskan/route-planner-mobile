// src/api/userService.ts
import { AuthUser } from '../store/useAuthStore';
import { api } from './client';

export type UpdateProfilePayload = {
    name?: string;
    surname?: string;
    phoneNumber?: string;
    companyName?: string;
    avatarUrl?: string;
};

export type ChangePasswordPayload = {
    oldPassword: string;
    newPassword: string;
};

/** Mevcut kullanıcının güncel profilini al. */
export async function getMe(): Promise<AuthUser> {
    const res = await api.get<AuthUser>('/users/me');
    return res.data;
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    const res = await api.put<AuthUser>('/users/me', payload);
    return res.data;
}

/** 204 döner — onSuccess çağıranda Alert / toast göster. */
export async function changeMyPassword(payload: ChangePasswordPayload): Promise<void> {
    await api.put('/users/me/password', payload);
}
