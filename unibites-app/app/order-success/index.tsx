import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const OrderSuccessScreen = () => {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                damping: 12,
                stiffness: 120,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Animated checkmark */}
                <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <Ionicons name="checkmark-circle" size={100} color="#10B981" />
                </Animated.View>

                <Animated.View style={{ opacity: opacityAnim }}>
                    <Text style={styles.title}>Order Placed!</Text>
                    <Text style={styles.subtitle}>Your order has been received.{'\n'}Head to the canteen to pick it up.</Text>

                    {orderId && (
                        <View style={styles.orderIdBadge}>
                            <Text style={styles.orderIdLabel}>Order ID</Text>
                            <Text style={styles.orderIdValue}>#{orderId}</Text>
                        </View>
                    )}

                    <View style={styles.infoCard}>
                        <Ionicons name="cash-outline" size={20} color="#E85D3A" />
                        <Text style={styles.infoText}>Payment: Cash on Arrival</Text>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.actions, { opacity: opacityAnim }]}>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => router.replace('/order')}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="receipt-outline" size={20} color="#fff" />
                        <Text style={styles.primaryBtnText}>View My Orders</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => router.replace('/home')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.secondaryBtnText}>Back to Home</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 32,
        width: '100%',
    },
    iconContainer: {
        marginBottom: 24,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 28,
    },
    orderIdBadge: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 10,
        alignSelf: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    orderIdLabel: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "600",
    },

    orderIdValue: {
        fontSize: 16,
        fontWeight: "800",
        color: "#1E40AF",
    },

    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        alignSelf: "center",
        marginBottom: 40,
    },

    infoText: {
        fontSize: 14,
        color: "#64748B",
        fontWeight: "500",
    },

    actions: {
        width: "100%",
        gap: 12,
    },

    primaryBtn: {
        backgroundColor: "#E85D3A",
        borderRadius: 14,
        paddingVertical: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        shadowColor: "#E85D3A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },

    primaryBtnText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "bold",
    },

    secondaryBtn: {
        backgroundColor: "#fff",
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    secondaryBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748B",
    },
});

export default OrderSuccessScreen;
