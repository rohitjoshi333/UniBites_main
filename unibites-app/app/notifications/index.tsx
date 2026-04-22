import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markAsRead, AppNotification } from '../../services/notificationService';
import { useAppContext } from '../../contexts/AppContext';

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { unreadNotifCount, setUnreadNotifCount } = useAppContext();
    const prevCountRef = React.useRef(unreadNotifCount);

    const fetchNotifications = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (e: any) {
            console.log('Notification fetch error:', e?.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        fetchNotifications(true);
    }, []);

    useFocusEffect(useCallback(() => {
        fetchNotifications();
    }, []));

    useEffect(() => {
        if (unreadNotifCount > prevCountRef.current) {
            fetchNotifications(true);
        }
        prevCountRef.current = unreadNotifCount;
    }, [unreadNotifCount]);

    const handleMarkAllRead = async () => {
        try {
            await markAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            // Reset the bell badge in home via shared context
            setUnreadNotifCount(0);
        } catch (e: any) {
            console.log('Mark read error:', e?.message);
        }
    };

    const handleNotificationPress = async (notification: AppNotification) => {
        if (!notification.is_read) {
            try {
                await markAsRead(notification.id);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
                // Decrement the global bell badge by 1
                setUnreadNotifCount(prev => Math.max(0, prev - 1));
            } catch (e: any) {
                console.log('Mark read error:', e?.message);
            }
        }

        if (notification.related_order_id) {
            router.push('/order');
        }
    };

    const renderItem = ({ item }: { item: AppNotification }) => {
        return (
            <TouchableOpacity
                style={[styles.card, !item.is_read && styles.unreadCard]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, !item.is_read && styles.unreadIconContainer]}>
                    <Ionicons
                        name={item.notification_type === 'PAYMENT' ? 'card-outline' : 'fast-food-outline'}
                        size={22}
                        color={item.is_read ? '#64748B' : '#4F46E5'}
                    />
                </View>
                <View style={styles.content}>
                    <Text style={[styles.title, !item.is_read && styles.unreadText]}>{item.title}</Text>
                    <Text style={styles.message}>{item.message}</Text>
                    <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
                {!item.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#E85D3A" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
                    <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={notifications}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                        <Text style={styles.emptySubtext}>You will see your updates here.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginLeft: -10,
    },
    markAllBtn: {
        paddingVertical: 5,
        paddingHorizontal: 8,
    },
    markAllText: {
        color: '#4F46E5',
        fontSize: 13,
        fontWeight: '600',
    },
    list: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    unreadCard: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E2E8F0',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    unreadIconContainer: {
        backgroundColor: '#EEF2FF',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    unreadText: {
        color: '#0F172A',
        fontWeight: '700',
    },
    message: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 6,
    },
    time: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4F46E5',
        marginLeft: 12,
    },
    empty: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 6,
    }
});
