import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';
import { safeJsonParse } from '../utils/errorHandler';

export interface AppNotification {
    id: number;
    title: string;
    message: string;
    notification_type: string;
    related_order_id: number | null;
    is_read: boolean;
    created_at: string;
}

export const getNotifications = async (): Promise<AppNotification[]> => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('Please log in to view notifications.');

    const response = await fetch(`${API_BASE_URL}/api/notifications/`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to load notifications.');
    }

    const data = await safeJsonParse(response);
    return data || [];
};

export const markAsRead = async (id?: number): Promise<void> => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('Please log in.');

    const body = id ? JSON.stringify({ id }) : JSON.stringify({});

    const response = await fetch(`${API_BASE_URL}/api/notifications/mark-read/`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
        },
        body,
    });

    if (!response.ok) {
        throw new Error('Failed to update notification.');
    }
};
