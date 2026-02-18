import { API_BASE_URL } from '../constants/api';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getProfile = async () => {
    const response = await api.get('profile/');
    return response.data;
};

export const updateProfile = async (data: { full_name: string; phone: string }) => {
    const response = await api.patch('profile/update/', data);
    return response.data;
};

export const changePassword = async (data: any) => {
    const response = await api.post('profile/change-password/', data);
    return response.data;
};

export const uploadProfileImage = async (imageUri: string): Promise<string> => {
    const token = await SecureStore.getItemAsync('accessToken');

    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/profile/upload-image/`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
    }

    const data = await response.json();
    return data.profile_image;
};
