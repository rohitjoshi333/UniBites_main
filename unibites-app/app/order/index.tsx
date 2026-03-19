import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getMyOrders, cancelOrder } from '../../services/orderService';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
    PENDING: { color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
    ACCEPTED: { color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
    PREPARING: { color: '#7C3AED', bg: '#EDE9FE', icon: 'restaurant-outline' },
    READY: { color: '#1D4ED8', bg: '#DBEAFE', icon: 'bag-check-outline' },
    COMPLETED: { color: '#059669', bg: '#D1FAE5', icon: 'star-outline' },
    REJECTED: { color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
    CANCELLED: { color: '#6B7280', bg: '#F3F4F6', icon: 'ban-outline' },
};

const OrderCard = ({ order, onCancel }: { order: any; onCancel: (id: number) => void }) => {
    const [expanded, setExpanded] = useState(false);
    const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
    const date = new Date(order.created_at);
    const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const firstItemName = order.items && order.items.length > 0 ? order.items[0].menu_item_name : 'Order';
    const extraCount = order.items ? order.items.length - 1 : 0;
    const orderTitle = extraCount > 0 ? `${firstItemName} +${extraCount}` : firstItemName;

    return (
        <View style={styles.card}>

            <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.orderId} numberOfLines={1}>{orderTitle}</Text>
                    <Text style={styles.orderCanteen}>{order.canteen_name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                    <Ionicons name={statusCfg.icon} size={14} color={statusCfg.color} />
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>{order.status}</Text>
                </View>
            </View>


            <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                    <Text style={styles.metaText}>{dateStr} · {timeStr}</Text>
                </View>
                <Text style={styles.totalText}>Rs. {order.total_price}</Text>
            </View>


            <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded(!expanded)}>
                <Text style={styles.expandText}>{expanded ? 'Hide items' : `Show ${order.items.length} item(s)`}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.itemsList}>
                    {order.items.map((item: any) => (
                        <View key={item.id} style={styles.itemRow}>
                            <Text style={styles.itemQty}>{item.quantity}×</Text>
                            <Text style={styles.itemName} numberOfLines={1}>{item.menu_item_name}</Text>
                            <Text style={styles.itemPrice}>Rs. {item.subtotal}</Text>
                        </View>
                    ))}
                </View>
            )}

            {order.status === 'PENDING' && (
                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                        Alert.alert(
                            'Cancel Order',
                            'Are you sure you want to cancel this order?',
                            [
                                { text: 'No', style: 'cancel' },
                                { text: 'Yes, Cancel', style: 'destructive', onPress: () => onCancel(order.id) },
                            ]
                        );
                    }}
                >
                    <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                    <Text style={styles.cancelBtnText}>Cancel Order</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default function OrdersScreen() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [ratingOrder, setRatingOrder] = useState<any>(null);
    const [hasRated, setHasRated] = useState(false);
    const [dismissedRatings, setDismissedRatings] = useState<Set<number>>(new Set());

    const fetchOrders = async () => {
        try {
            const data = await getMyOrders();
            setOrders(data);

            // Show popup automatically for the first COMPLETED order that hasn't been dismissed yet
            let storedDismissed = new Set<number>();
            try {
                const stored = await SecureStore.getItemAsync('dismissedRatings');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    storedDismissed = new Set(parsed);
                    setDismissedRatings(storedDismissed);
                }
            } catch (e) { console.log('Error reading secure store'); }

            const unrated = data.find((o: any) => o.status === 'COMPLETED' && !storedDismissed.has(o.id));
            if (unrated && !ratingOrder) {
                setRatingOrder(unrated);
                setHasRated(false);
            }
        } catch (e) {
            console.error('Failed to fetch orders', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchOrders(); }, []));

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    const handleCancel = async (orderId: number) => {
        try {
            await cancelOrder(orderId);
            fetchOrders();
        } catch (e) {
            console.error('Failed to cancel order', e);
            Alert.alert('Error', 'Failed to cancel order. Please try again.');
        }
    };

    const handleCloseModal = async () => {
        if (ratingOrder) {
            const newDismissed = new Set(dismissedRatings).add(ratingOrder.id);
            setDismissedRatings(newDismissed);
            try {
                await SecureStore.setItemAsync('dismissedRatings', JSON.stringify(Array.from(newDismissed)));
            } catch (e) { }
        }
        setRatingOrder(null);
        setHasRated(false);
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
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <OrderCard order={item} onCancel={handleCancel} />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>My Orders</Text>
                        <Text style={styles.headerSubtitle}>Track your order history</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No orders yet</Text>
                        <Text style={styles.emptySubtitle}>Your past orders will appear here.</Text>
                    </View>
                }
            />

            <Modal visible={!!ratingOrder} transparent animationType="fade">
                <View style={[styles.center, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={styles.premiumModalContent}>
                        {!hasRated ? (
                            <View style={styles.modalBody}>
                                <Text style={styles.premiumTitle}>Enjoyed your meal?</Text>
                                <Text style={styles.premiumDesc}>
                                    Take a moment to rate your experience at{"\n"}
                                    <Text style={styles.canteenHighlight}>{ratingOrder?.canteen_name}</Text>
                                </Text>

                                <View style={styles.dummyStarsContainer}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Ionicons key={i} name="star-outline" size={32} color="#CBD5E1" style={styles.dummyStar} />
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={styles.premiumRateBtn}
                                    activeOpacity={0.8}
                                    onPress={() => setHasRated(true)}
                                >
                                    <Text style={styles.premiumRateBtnText}>Rate Experience</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.premiumCloseBtn}
                                    onPress={handleCloseModal}
                                >
                                    <Text style={styles.premiumCloseBtnText}>Maybe Later</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.modalBody}>
                                <Text style={styles.premiumTitle}>Thank You!</Text>
                                <Text style={styles.premiumDesc}>
                                    Thank you for your rating. Your feedback helps us serve you better.
                                </Text>
                                <TouchableOpacity
                                    style={styles.premiumRateBtn}
                                    activeOpacity={0.8}
                                    onPress={handleCloseModal}
                                >
                                    <Text style={styles.premiumRateBtnText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
    },

    headerContainer: {
        paddingTop: 70,
        paddingBottom: 30,
        paddingHorizontal: 24,
        backgroundColor: "#1E293B",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 8,
    },

    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
    },

    headerSubtitle: {
        fontSize: 14,
        color: "#94A3B8",
        marginTop: 4,
    },

    listContent: {
        paddingBottom: 40,
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },

    orderId: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1E293B",
    },

    orderCanteen: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 2,
    },

    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },

    statusText: {
        fontSize: 12,
        fontWeight: "700",
    },

    cardMeta: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },

    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },

    metaText: {
        fontSize: 12,
        color: "#94A3B8",
    },

    totalText: {
        fontSize: 16,
        fontWeight: "800",
        color: "#1E293B",
    },

    expandBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },

    expandText: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
    },

    itemsList: {
        marginTop: 10,
        gap: 6,
    },

    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    itemQty: {
        fontSize: 14,
        fontWeight: "700",
        color: "#E85D3A",
        width: 28,
    },

    itemName: {
        flex: 1,
        fontSize: 14,
        color: "#334155",
    },

    itemPrice: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1E293B",
    },

    emptyState: {
        alignItems: "center",
        marginTop: 80,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#94A3B8",
        marginTop: 16,
    },

    emptySubtitle: {
        fontSize: 14,
        color: "#CBD5E1",
        marginTop: 6,
    },

    cancelBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 12,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#FEE2E2",
    },

    cancelBtnText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#DC2626",
    },
    premiumModalContent: {
        width: '85%',
        maxWidth: 340,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 15,
    },

    modalBody: {
        paddingTop: 40,
        paddingHorizontal: 24,
        paddingBottom: 24,
        alignItems: 'center',
    },

    premiumTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 12,
    },

    premiumDesc: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },

    canteenHighlight: {
        fontWeight: '700',
        color: '#1E293B',
        fontSize: 15,
    },

    dummyStarsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
        width: '100%',
    },

    dummyStar: {
        marginHorizontal: 6,
    },

    premiumRateBtn: {
        backgroundColor: '#F5A623',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#F5A623',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },

    premiumRateBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.5,
    },

    premiumCloseBtn: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
    },

    premiumCloseBtnText: {
        color: '#94A3B8',
        fontWeight: '600',
        fontSize: 15,
    },
});
