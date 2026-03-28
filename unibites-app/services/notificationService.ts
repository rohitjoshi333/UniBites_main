import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

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
    if (!token) throw new Error('No access token');

    const response = await fetch(`${API_BASE_URL}/api/notifications/`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch notifications');
    }

    return response.json();
};

export const markAsRead = async (id?: number): Promise<void> => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token');

    const body = id ? JSON.stringify({ id }) : JSON.stringify({});

    const response = await fetch(`${API_BASE_URL}/api/notifications/mark-read/`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body,
    });

    if (!response.ok) {
        throw new Error('Failed to mark notification(s) as read');
    }
};
