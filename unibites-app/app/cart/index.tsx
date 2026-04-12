import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCart, updateCartItem, removeCartItem } from '../../services/cartService';

const CartScreen = () => {
    const router = useRouter();
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);

    const fetchCart = async () => {
        try {
            const data = await getCart();
            setCart(data);
        } catch (error) {
            console.error("Failed to fetch cart", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchCart();
    };

    const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        setUpdating(true);
        try {
            await updateCartItem(itemId, newQuantity);
            await fetchCart();
        } catch (error) {
            Alert.alert("Error", "Failed to update quantity");
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveItem = async (itemId: number) => {
        Alert.alert(
            "Remove Item",
            "Are you sure you want to remove this item?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: 'destructive',
                    onPress: async () => {
                        setUpdating(true);
                        try {
                            await removeCartItem(itemId);
                            await fetchCart();
                        } catch (error) {
                            Alert.alert("Error", "Failed to remove item");
                        } finally {
                            setUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    const handleClearCart = async () => {
        if (!cart || !cart.items.length) return;

        Alert.alert(
            "Clear Cart",
            "Are you sure you want to remove all items?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All",
                    style: 'destructive',
                    onPress: async () => {
                        setUpdating(true);
                        try {
                            await Promise.all(cart.items.map((item: any) => removeCartItem(item.id)));
                            await fetchCart();
                        } catch (error) {
                            Alert.alert("Error", "Failed to clear cart");
                        } finally {
                            setUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#E85D3A" />
            </View>
        );
    }


    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.menu_item.image_url || 'https://via.placeholder.com/100' }} style={styles.image} />
            <View style={styles.details}>
                <View style={styles.titleRow}>
                    <Text style={styles.name}>{item.menu_item.name}</Text>
                    <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                        <Ionicons name="trash-outline" size={20} color="#FF5252" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.desc} numberOfLines={1}>{item.menu_item.description || "Delicious item"}</Text>
                <Text style={styles.price}>Rs. {item.menu_item.price}</Text>

                <View style={styles.controlsRow}>
                    <View style={styles.controls}>
                        <TouchableOpacity
                            disabled={updating}
                            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            style={styles.controlBtn}
                        >
                            <Ionicons name="remove" size={18} color="#E85D3A" />
                        </TouchableOpacity>
                        <Text style={styles.quantity}>{item.quantity}</Text>
                        <TouchableOpacity
                            disabled={updating}
                            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            style={styles.controlBtn}
                        >
                            <Ionicons name="add" size={18} color="#E85D3A" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    const calculateTotal = () => cart ? cart.total_price : 0;

    return (
        <View style={styles.container}>
            <View style={styles.fixedHeader}>
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>My Cart</Text>
                    <Text style={styles.headerSubtitle}>Review your items before checkout</Text>
                </View>

                {cart && cart.items && cart.items.length > 0 && (
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{cart.items.length}</Text>
                                <Text style={styles.summaryLabel}>Items</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{cart.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}</Text>
                                <Text style={styles.summaryLabel}>Quantity</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { fontSize: 18 }]}>Rs. {cart.total_price}</Text>
                                <Text style={styles.summaryLabel}>Total</Text>
                            </View>
                        </View>
                    </View>
                )}

                {cart && cart.items && cart.items.length > 0 && (
                    <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
                        <Ionicons name="trash-outline" size={18} color="#E85D3A" style={{ marginRight: 6 }} />
                        <Text style={styles.clearButtonText}>Clear All Items</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={cart?.items || []}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="cart-outline" size={64} color="#ddd" />
                        <Text style={styles.emptyText}>Your cart is empty</Text>
                        <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/home')}>
                            <Text style={styles.browseButtonText}>Browse Menu</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {cart && cart.items && cart.items.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.footerRow}>
                        <Text style={styles.footerLabel}>Total Bill</Text>
                        <Text style={styles.footerValue}>Rs. {calculateTotal()}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.checkoutBtn}
                        onPress={() => router.push('/checkout')}
                    >
                        <Text style={styles.checkoutText}>Checkout Now</Text>
                        <Ionicons name="chevron-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    fixedHeader: {
        backgroundColor: '#F3F4F6',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    headerContainer: {
        paddingTop: 70,
        paddingBottom: 30,
        paddingHorizontal: 24,
        backgroundColor: '#1E293B',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
    },
    summaryCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        marginTop: -20,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    summaryLabel: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#E2E8F0',
    },
    clearButton: {
        marginHorizontal: 20,
        marginBottom: 16,
        paddingVertical: 10,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF1F2',
        borderWidth: 1,
        borderColor: '#FECDD3',
    },
    clearButtonText: {
        color: '#E11D48', // More vibrant red
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        paddingBottom: 160,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginHorizontal: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        resizeMode: 'cover',
    },
    details: {
        flex: 1,
        marginLeft: 14,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        flex: 1,
        marginRight: 8,
    },
    desc: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    price: {
        fontSize: 15,
        color: '#E85D3A',
        fontWeight: 'bold',
        marginTop: 4,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 6,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7F5',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    controlBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    quantity: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
        paddingHorizontal: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 12,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    footerLabel: {
        fontSize: 16,
        color: '#64748B',
    },
    footerValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
    },
    checkoutBtn: {
        backgroundColor: '#E85D3A',
        borderRadius: 14,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#E85D3A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    checkoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 80,
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#94A3AF',
        marginTop: 16,
        marginBottom: 24,
    },
    browseButton: {
        backgroundColor: '#E85D3A',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    browseButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default CartScreen;

