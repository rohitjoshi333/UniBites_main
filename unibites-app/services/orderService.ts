import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

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

export const placeOrder = async () => {
    const response = await api.post('orders/place/');
    return response.data;
};

export const getMyOrders = async () => {
    const response = await api.get('orders/my-orders/');
    return response.data;
};

export const cancelOrder = async (orderId: number) => {
    const response = await api.patch(`orders/${orderId}/cancel/`);
    return response.data;
};
