import { API_BASE_URL } from '../constants/api';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: { 'ngrok-skip-browser-warning': 'true' },
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log('Cart API error:', error?.response?.status, error?.response?.data?.message);
        return Promise.reject(error);
    }
);


export const getCart = async () => {
    const response = await api.get('cart/');
    return response.data;
};

export const addToCart = async (menuItemId: number, quantity: number) => {
    const response = await api.post('cart/add/', { menu_item_id: menuItemId, quantity });
    return response.data;
};

export const updateCartItem = async (cartItemId: number, quantity: number) => {
    const response = await api.patch('cart/update/', { cart_item_id: cartItemId, quantity });
    return response.data;
};

export const removeCartItem = async (cartItemId: number) => {
    const response = await api.delete(`cart/remove/${cartItemId}/`);
    return response.data;
};
