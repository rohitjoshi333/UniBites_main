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

export const placeOrder = async (scheduledTime?: string) => {
    const body: any = {};
    if (scheduledTime) body.scheduled_time = scheduledTime;
    const response = await api.post('orders/place/', body);
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

export const initiateEsewaPayment = async (scheduledTime?: string) => {
    const body: any = {};
    if (scheduledTime) body.scheduled_time = scheduledTime;
    const response = await api.post('orders/esewa/initiate/', body);
    return response.data;
};

export const rateOrder = async (orderId: number, rating: number, message?: string) => {
    const response = await api.post(`orders/${orderId}/rate/`, { rating, message });
    return response.data;
};
