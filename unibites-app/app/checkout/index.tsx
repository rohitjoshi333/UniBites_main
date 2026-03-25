import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCart } from '../../services/cartService';
import { placeOrder, initiateEsewaPayment } from '../../services/orderService';

const CheckoutScreen = () => {
    const router = useRouter();
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_ARRIVAL' | 'ESEWA'>('CASH_ON_ARRIVAL');

    const fetchCart = async () => {
        try {
            const data = await getCart();
            setCart(data);
        } catch (e) {
            console.error('Failed to load cart', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const handleConfirmOrder = async () => {
        if (!cart || !cart.items || cart.items.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
            router.back();
            return;
        }

        setPlacing(true);
        try {
            if (paymentMethod === 'ESEWA') {
                await handleEsewaPayment();
            } else {
                const order = await placeOrder();
                router.replace({ pathname: '/order-success' as any, params: { orderId: order.id } });
            }
        } catch (error: any) {
            const message = error?.response?.data?.error || 'Failed to place order. Please try again.';
            Alert.alert('Order Failed', message);
        } finally {
            setPlacing(false);
        }
    };

    const handleEsewaPayment = async () => {
        // Asks backend to create order & get eSewa form params
        const res = await initiateEsewaPayment();
        const { esewa_url, form_params, order_id } = res;

        // Navigates to our custom WebView screen via exporouter
        router.push({
            pathname: '/esewa-payment',
            params: {
                url: esewa_url,
                form_params: JSON.stringify(form_params),
                order_id: order_id
            }
        });
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#E85D3A" />
            </View>
        );
    }

    const hasItems = cart && cart.items && cart.items.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={styles.mainContent}>
                <View style={[styles.section, { flex: 1 }]}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    {hasItems ? (
                        <>
                            <ScrollView 
                                style={styles.itemListScroll}
                                showsVerticalScrollIndicator={false}
                            >
                                {cart.items.map((item: any) => (
                                    <View key={item.id} style={styles.itemRow}>
                                        <Image
                                            source={{ uri: item.menu_item.image_url || 'https://via.placeholder.com/60' }}
                                            style={styles.itemImage}
                                        />
                                        <View style={styles.itemDetails}>
                                            <Text style={styles.itemName}>{item.menu_item.name}</Text>
                                            <Text style={styles.itemPrice}>Rs. {item.menu_item.price} × {item.quantity}</Text>
                                        </View>
                                        <Text style={styles.itemSubtotal}>Rs. {item.subtotal}</Text>
                                    </View>
                                ))}
                            </ScrollView>

                            <View style={styles.divider} />
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>Rs. {cart.total_price}</Text>
                            </View>
                        </>
                    ) : (
                        <Text style={styles.emptyText}>Your cart is empty.</Text>
                    )}
                </View>

                {cart?.canteen && (
                    <View style={[styles.section, styles.fixedSection]}>
                        <Text style={styles.sectionTitle}>Pickup From</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="storefront-outline" size={20} color="#E85D3A" />
                            <Text style={styles.infoText}>{cart.canteen.name}</Text>
                        </View>
                    </View>
                )}

                <View style={[styles.section, styles.fixedSection]}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>

                    {/* Cash on Arrival Option */}
                    <TouchableOpacity
                        style={[styles.paymentCard, paymentMethod === 'CASH_ON_ARRIVAL' && styles.paymentCardSelected]}
                        onPress={() => setPaymentMethod('CASH_ON_ARRIVAL')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.paymentIcon}>
                            <Ionicons name="cash-outline" size={24} color="#E85D3A" />
                        </View>
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentTitle}>Cash on Arrival</Text>
                            <Text style={styles.paymentDesc}>Pay at the canteen when you pick up</Text>
                        </View>
                        {paymentMethod === 'CASH_ON_ARRIVAL' && (
                            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                        )}
                    </TouchableOpacity>

                    {/* eSewa Option */}
                    <TouchableOpacity
                        style={[styles.paymentCard, styles.esewaCard, paymentMethod === 'ESEWA' && styles.paymentCardSelected, { marginTop: 10 }]}
                        onPress={() => setPaymentMethod('ESEWA')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.paymentIcon, { backgroundColor: '#f0fff4' }]}>
                            <Text style={styles.esewaLogo}>e</Text>
                        </View>
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentTitle}>eSewa</Text>
                            <Text style={styles.paymentDesc}>Pay instantly with your eSewa wallet</Text>
                        </View>
                        {paymentMethod === 'ESEWA' && (
                            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>



            <View style={styles.footer}>
                <View style={styles.footerTotal}>
                    <Text style={styles.footerLabel}>Total</Text>
                    <Text style={styles.footerValue}>Rs. {cart?.total_price || '0'}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.confirmBtn, (!hasItems || placing) && styles.confirmBtnDisabled]}
                    onPress={handleConfirmOrder}
                    disabled={!hasItems || placing}
                    activeOpacity={0.85}
                >
                    {placing ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Text style={styles.confirmText}>
                                {paymentMethod === 'ESEWA' ? 'Pay with eSewa' : 'Confirm Order'}
                            </Text>
                            <Ionicons
                                name={paymentMethod === 'ESEWA' ? 'phone-portrait-outline' : 'checkmark-circle-outline'}
                                size={22}
                                color="#fff"
                                style={{ marginLeft: 8 }}
                            />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

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

    mainContent: {
        flex: 1,
        paddingBottom: 160, // Space for footer
    },

    itemListScroll: {
        flex: 1,
    },

    fixedSection: {
        marginTop: 12,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        backgroundColor: "#1E293B",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },

    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },

    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#fff",
    },

    section: {
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1E293B",
        marginBottom: 14,
    },

    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },

    itemImage: {
        width: 52,
        height: 52,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
    },

    itemDetails: {
        flex: 1,
        marginLeft: 12,
    },

    itemName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1E293B",
    },

    itemPrice: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 2,
    },

    itemSubtotal: {
        fontSize: 15,
        fontWeight: "700",
        color: "#E85D3A",
    },

    divider: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginVertical: 12,
    },

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    totalLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748B",
    },

    totalValue: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1E293B",
    },

    emptyText: {
        color: "#94A3B8",
        fontSize: 15,
        textAlign: "center",
        paddingVertical: 12,
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    infoText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1E293B",
    },

    paymentCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF7F5",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: "#FECACA",
        gap: 12,
    },

    paymentIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#FEF2F2",
        justifyContent: "center",
        alignItems: "center",
    },

    paymentInfo: {
        flex: 1,
    },

    paymentTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1E293B",
    },

    paymentDesc: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },

    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        padding: 20,
        paddingBottom: 38,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 12,
    },

    footerTotal: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 14,
    },

    footerLabel: {
        fontSize: 15,
        color: "#64748B",
    },

    footerValue: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1E293B",
    },

    confirmBtn: {
        backgroundColor: "#E85D3A",
        borderRadius: 14,
        paddingVertical: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#E85D3A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },

    confirmBtnDisabled: {
        backgroundColor: "#CBD5E1",
        shadowOpacity: 0,
    },

    confirmText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },

    paymentCardSelected: {
        borderColor: "#10B981",
        borderWidth: 2,
        backgroundColor: "#F0FDF4",
    },

    esewaCard: {
        borderColor: "#60C271",
    },

    esewaLogo: {
        fontSize: 22,
        fontWeight: '900',
        color: '#60C271',
        fontStyle: 'italic',
    },
});

export default CheckoutScreen;
