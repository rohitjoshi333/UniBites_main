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

const MIN_LEAD_MINUTES = 5;

function getMinPickupDate(): Date {
    const d = new Date();
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + MIN_LEAD_MINUTES);
    return d;
}

function formatTime(h: number, m: number): string {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const displayM = m < 10 ? `0${m}` : `${m}`;
    return `${displayH}:${displayM} ${period}`;
}

const CheckoutScreen = () => {
    const router = useRouter();
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_ARRIVAL' | 'ESEWA'>('CASH_ON_ARRIVAL');

    // Scheduler state
    const [scheduleEnabled, setScheduleEnabled] = useState(false);

    const getDefaultPickerTime = () => {
        const min = getMinPickupDate();
        return { hour: min.getHours(), minute: min.getMinutes() };
    };
    const [pickerHour, setPickerHour] = useState(() => getDefaultPickerTime().hour);
    const [pickerMinute, setPickerMinute] = useState(() => getDefaultPickerTime().minute);

    const getPickerDate = () => {
        const d = new Date();
        d.setHours(pickerHour, pickerMinute, 0, 0);
        return d;
    };

    const isPickerTimeValid = () => {
        return getPickerDate().getTime() >= getMinPickupDate().getTime();
    };

    const adjustHour = (delta: number) => {
        setPickerHour(h => {
            const next = (h + delta + 24) % 24;
            return next;
        });
    };

    const adjustMinute = (delta: number) => {
        setPickerMinute(m => {
            let next = m + delta;
            if (next >= 60) { next = 0; setPickerHour(h => (h + 1) % 24); }
            if (next < 0) { next = 59; setPickerHour(h => (h - 1 + 24) % 24); }
            return next;
        });
    };

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

    const getScheduledTimeISO = (): string | undefined => {
        if (!scheduleEnabled) return undefined;
        if (!isPickerTimeValid()) return undefined;
        return getPickerDate().toISOString();
    };

    const handleConfirmOrder = async () => {
        if (!cart || !cart.items || cart.items.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
            router.back();
            return;
        }

        if (scheduleEnabled && !isPickerTimeValid()) {
            Alert.alert('Invalid Time', `Pickup time must be at least ${MIN_LEAD_MINUTES} minutes from now.`);
            return;
        }

        setPlacing(true);
        try {
            const scheduledTime = getScheduledTimeISO();
            if (paymentMethod === 'ESEWA') {
                await handleEsewaPayment(scheduledTime);
            } else {
                const order = await placeOrder(scheduledTime);
                router.replace({ pathname: '/order-success' as any, params: { orderId: order.id } });
            }
        } catch (error: any) {
            const message = error?.response?.data?.error || 'Failed to place order. Please try again.';
            Alert.alert('Order Failed', message);
        } finally {
            setPlacing(false);
        }
    };

    const handleEsewaPayment = async (scheduledTime?: string) => {
        const res = await initiateEsewaPayment(scheduledTime);
        const { esewa_url, form_params, order_id } = res;
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

    const confirmBtnLabel = () => {
        if (paymentMethod === 'ESEWA') {
            if (scheduleEnabled && isPickerTimeValid()) return `Pay with eSewa \u2022 ${formatTime(pickerHour, pickerMinute)}`;
            return 'Pay with eSewa';
        }
        if (scheduleEnabled && isPickerTimeValid()) return `Schedule for ${formatTime(pickerHour, pickerMinute)}`;
        return 'Confirm Order';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={{ flexShrink: 0, zIndex: 10 }}>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    {hasItems ? (
                        <>
                            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
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

                {/* Pickup From */}
                {cart?.canteen && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Pickup From</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="storefront-outline" size={20} color="#E85D3A" />
                            <Text style={styles.infoText}>{cart.canteen.name}</Text>
                        </View>
                        {cart.canteen.location && (
                            <View style={[styles.infoRow, { marginTop: 8 }]}>
                                <Ionicons name="location-outline" size={20} color="#6B7280" />
                                <Text style={[styles.infoText, { color: '#6B7280', fontSize: 13 }]}>{cart.canteen.location}</Text>
                            </View>
                        )}
                        {cart.canteen.opening_time && cart.canteen.closing_time && (
                            <View style={[styles.infoRow, { marginTop: 8 }]}>
                                <Ionicons name="time-outline" size={20} color="#6B7280" />
                                <Text style={[styles.infoText, { color: '#6B7280', fontSize: 13 }]}>{cart.canteen.opening_time} - {cart.canteen.closing_time}</Text>
                            </View>
                        )}
                    </View>
                )}

            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>

                {/* ── Schedule Order ── */}
                <View style={styles.section}>
                    <View style={styles.scheduleHeader}>
                        <View style={styles.scheduleHeaderLeft}>
                            <View style={styles.scheduleIcon}>
                                <Ionicons name="time-outline" size={20} color="#7C3AED" />
                            </View>
                            <View>
                                <Text style={styles.sectionTitle}>Schedule Order</Text>
                                <Text style={styles.scheduleSubtitle}>Pre-order for a later pickup today</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.toggle, scheduleEnabled && styles.toggleOn]}
                            onPress={() => {
                                setScheduleEnabled(v => !v);
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.toggleThumb, scheduleEnabled && styles.toggleThumbOn]} />
                        </TouchableOpacity>
                    </View>

                    {scheduleEnabled && (
                        <View style={styles.timePicker}>
                            {/* Hour */}
                            <View style={styles.timeCol}>
                                <TouchableOpacity style={styles.timeBtn} onPress={() => adjustHour(1)}>
                                    <Ionicons name="chevron-up" size={20} color="#7C3AED" />
                                </TouchableOpacity>
                                <Text style={styles.timeDigit}>
                                    {pickerHour > 12 ? pickerHour - 12 : pickerHour === 0 ? 12 : pickerHour}
                                </Text>
                                <TouchableOpacity style={styles.timeBtn} onPress={() => adjustHour(-1)}>
                                    <Ionicons name="chevron-down" size={20} color="#7C3AED" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.timeSep}>:</Text>
                            {/* Minute */}
                            <View style={styles.timeCol}>
                                <TouchableOpacity style={styles.timeBtn} onPress={() => adjustMinute(1)}>
                                    <Ionicons name="chevron-up" size={20} color="#7C3AED" />
                                </TouchableOpacity>
                                <Text style={styles.timeDigit}>{pickerMinute < 10 ? `0${pickerMinute}` : pickerMinute}</Text>
                                <TouchableOpacity style={styles.timeBtn} onPress={() => adjustMinute(-1)}>
                                    <Ionicons name="chevron-down" size={20} color="#7C3AED" />
                                </TouchableOpacity>
                            </View>
                            {/* AM/PM */}
                            <Text style={styles.timeAmPm}>{pickerHour >= 12 ? 'PM' : 'AM'}</Text>
                        </View>
                    )}
                    {scheduleEnabled && !isPickerTimeValid() && (
                        <Text style={styles.timeWarning}>
                            Minimum {MIN_LEAD_MINUTES} min lead time required
                        </Text>
                    )}
                    {scheduleEnabled && isPickerTimeValid() && (
                        <View style={styles.selectedSlotBanner}>
                            <Ionicons name="checkmark-circle" size={16} color="#7C3AED" />
                            <Text style={styles.selectedSlotText}>
                                Order will be ready at {formatTime(pickerHour, pickerMinute)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>

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

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Footer */}
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
                            <Text style={styles.confirmText}>{confirmBtnLabel()}</Text>
                            <Ionicons
                                name={
                                    scheduleEnabled && isPickerTimeValid()
                                        ? 'alarm-outline'
                                        : paymentMethod === 'ESEWA'
                                            ? 'phone-portrait-outline'
                                            : 'checkmark-circle-outline'
                                }
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

    scrollContent: {
        paddingBottom: 20
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
        marginBottom: 0,
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
        marginTop: 4
    },

    infoText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1E293B",
    },

    // Scheduler 
    scheduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 0,
    },

    scheduleHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12 },

    scheduleIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
    },

    scheduleSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2
    },

    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#CBD5E1',
        padding: 3,
        justifyContent: 'center',
    },

    toggleOn: {
        backgroundColor: '#7C3AED'
    },

    toggleThumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
        alignSelf: 'flex-start',
    },
    toggleThumbOn: { alignSelf: 'flex-end' },

    slotLabel: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 14,
        marginBottom: 10
    },

    slotScroll: {
        marginHorizontal: -4
    },

    slotRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 4
    },

    slotChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#7C3AED22',
    },

    slotChipSelected: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED'
    },

    slotText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7C3AED'
    },

    slotTextSelected: {
        color: '#fff'
    },

    selectedSlotBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EDE9FE',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginTop: 12,
    },

    selectedSlotText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7C3AED'
    },

    noSlotsText: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 12
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

    paymentCardSelected: {
        borderColor: '#10B981',
        borderWidth: 2,
        backgroundColor: '#F0FDF4'
    },

    esewaCard: {
        borderColor: '#60C271'
    },

    esewaLogo: {
        fontSize: 22,
        fontWeight: '900',
        color: '#60C271',
        fontStyle: 'italic'
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

    // Custom time picker
    timePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        marginBottom: 4,
        paddingVertical: 12,
        backgroundColor: '#F8F7FF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    timeCol: {
        alignItems: 'center',
        gap: 4,
        minWidth: 54,
    },
    timeBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#EDE9FE',
    },
    timeDigit: {
        fontSize: 32,
        fontWeight: '800',
        color: '#4C1D95',
        lineHeight: 38,
        minWidth: 44,
        textAlign: 'center',
    },
    timeSep: {
        fontSize: 32,
        fontWeight: '800',
        color: '#7C3AED',
        marginBottom: 4,
    },
    timeAmPm: {
        fontSize: 18,
        fontWeight: '700',
        color: '#7C3AED',
        marginLeft: 4,
    },
    timeWarning: {
        fontSize: 13,
        color: '#DC2626',
        marginTop: 8,
        textAlign: 'center',
    },
});

export default CheckoutScreen;
