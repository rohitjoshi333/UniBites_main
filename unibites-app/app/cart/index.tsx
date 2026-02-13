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
                <ActivityIndicator size="large" color="#1a237e" />
            </View>
        );
    }

    // Header Component for FlatList
    const renderHeader = () => (
        <>
            <View style={styles.headerContainer}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>My Cart</Text>
                    <Text style={styles.headerSubtitle}>Review your items</Text>
                </View>
            </View>

            {cart && cart.items && cart.items.length > 0 && (
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{cart.items.length}</Text>
                            <Text style={styles.summaryLabel}>items</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{cart.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}</Text>
                            <Text style={styles.summaryLabel}>Quantity</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>Rs. {cart.total_price}</Text>
                            <Text style={styles.summaryLabel}>Total</Text>
                        </View>
                    </View>
                </View>
            )}

            {cart && cart.items && cart.items.length > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
                    <Ionicons name="trash-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.clearButtonText}>Clear All Items</Text>
                </TouchableOpacity>
            )}
        </>
    );

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.menu_item.image || 'https://via.placeholder.com/100' }} style={styles.image} />
            <View style={styles.details}>
                <View style={styles.titleRow}>
                    <Text style={styles.name}>{item.menu_item.name}</Text>
                    <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                        <Ionicons name="trash-outline" size={20} color="#FF4545" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.desc} numberOfLines={1}>{item.menu_item.description || " Delicious item"}</Text>
                <Text style={styles.price}>NPR. {item.menu_item.price}</Text>

                <View style={styles.controlsRow}>
                    <View style={styles.controls}>
                        <TouchableOpacity
                            disabled={updating}
                            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                            <Ionicons name="remove-circle-outline" size={28} color="#1a237e" />
                        </TouchableOpacity>
                        <View style={styles.qtyBadge}>
                            <Text style={styles.quantity}>{item.quantity}</Text>
                        </View>
                        <TouchableOpacity
                            disabled={updating}
                            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                            <Ionicons name="add-circle-outline" size={28} color="#1a237e" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    const calculateTotal = () => cart ? cart.total_price : 0;

    return (
        <View style={styles.container}>
            <FlatList
                data={cart?.items || []}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="cart-outline" size={64} color="#ccc" />
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
                        <Text style={styles.footerLabel}>Total Amount</Text>
                        <Text style={styles.footerValue}>NPR. {calculateTotal()}</Text>
                    </View>
                    <TouchableOpacity style={styles.checkoutBtn} onPress={() => Alert.alert("Checkout", "Checkout flow coming soon!")}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.checkoutText}>Proceed to checkout</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    headerContainer: {
        backgroundColor: '#1a237e',
        paddingTop: 60,
        paddingBottom: 80,
        paddingHorizontal: 20,
        marginBottom: -50,
    },
    headerContent: {
        flexDirection: 'column',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#e0e0e0',
        marginTop: 4,
    },
    summaryCard: {
        backgroundColor: '#7986cb',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
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
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    summaryLabel: {
        fontSize: 12,
        color: 'white',
    },
    summaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    clearButton: {
        backgroundColor: '#e53935',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 150,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginHorizontal: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#eee',
        resizeMode: 'cover',
    },
    details: {
        flex: 1,
        marginLeft: 12,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a237e',
        flex: 1,
        marginRight: 8,
    },
    desc: {
        fontSize: 12,
        color: '#9e9e9e',
        marginTop: 2,
    },
    price: {
        fontSize: 14,
        color: '#7986cb',
        fontWeight: '600',
        marginTop: 4,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    qtyBadge: {
        backgroundColor: '#1a237e',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginHorizontal: 8,
    },
    quantity: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    footerLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a237e',
    },
    footerValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a237e',
    },
    checkoutBtn: {
        backgroundColor: '#0d47a1',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#888',
        marginTop: 16,
        marginBottom: 24,
    },
    browseButton: {
        backgroundColor: '#1a237e',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    browseButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default CartScreen;
