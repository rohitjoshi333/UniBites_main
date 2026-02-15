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
