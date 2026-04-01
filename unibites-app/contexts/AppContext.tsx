import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Audio } from 'expo-av';
import { API_BASE_URL } from '../constants/api';
import { getNotifications } from '../services/notificationService';
import { getMyOrders } from '../services/orderService';

interface AppContextType {
    unreadNotifCount: number;
    activeOrderCount: number;
    setUnreadNotifCount: React.Dispatch<React.SetStateAction<number>>;
    refreshCounts: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
    unreadNotifCount: 0,
    activeOrderCount: 0,
    setUnreadNotifCount: () => { },
    refreshCounts: async () => { },
});

export const useAppContext = () => useContext(AppContext);

const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'];

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [activeOrderCount, setActiveOrderCount] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isConnectingRef = useRef(false);
    // Use a ref for refreshCounts so the WS onmessage closure always calls the latest version
    const refreshCountsRef = useRef<() => Promise<void>>(async () => { });

    const playNotificationSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../assets/sounds/notification_sound.mp3')
            );
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
        } catch (e) {
            console.log('AppContext: playback error', e);
        }
    };

    const refreshCounts = useCallback(async () => {
        try {
            const [notifs, orders] = await Promise.all([
                getNotifications().catch(() => []),
                getMyOrders().catch(() => []),
            ]);
            setUnreadNotifCount(notifs.filter((n: any) => !n.is_read).length);
            setActiveOrderCount(
                orders.filter((o: any) => ACTIVE_STATUSES.includes(o.status)).length
            );
        } catch (e) {
            console.log('AppContext: refreshCounts error', e);
        }
    }, []);

    // Keep the ref in sync so WS onmessage always has the latest function
    useEffect(() => {
        refreshCountsRef.current = refreshCounts;
    }, [refreshCounts]);

    const connect = useCallback(async () => {
        if (isConnectingRef.current) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const token = await SecureStore.getItemAsync('accessToken');
        if (!token) return;

        isConnectingRef.current = true;
        const wsBase = API_BASE_URL.replace(/^http/, 'ws');
        const ws = new WebSocket(`${wsBase}/ws/orders/?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
            isConnectingRef.current = false;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            console.log('AppContext WS: connected');
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'notification') {
                    // New notification add numnering in bell icon
                    setUnreadNotifCount((prev) => prev + 1);
                    playNotificationSound();
                } else if (
                    msg.type === 'order_status_update' ||
                    msg.type === 'new_order'
                ) {
                    // Orders changed refresh the active order count for the tab badge
                    refreshCountsRef.current();
                    playNotificationSound();
                }
            } catch (e) {
                console.warn('AppContext WS parse error', e);
            }
        };

        ws.onerror = () => {
            isConnectingRef.current = false;
        };

        ws.onclose = () => {
            isConnectingRef.current = false;
            console.log('AppContext WS: closed, reconnecting in 4s...');
            reconnectTimerRef.current = setTimeout(() => connect(), 4000);
        };
    }, []);

    useEffect(() => {
        refreshCounts();
        connect();

        return () => {
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, []);

    return (
        <AppContext.Provider
            value={{ unreadNotifCount, activeOrderCount, setUnreadNotifCount, refreshCounts }}
        >
            {children}
        </AppContext.Provider>
    );
}
