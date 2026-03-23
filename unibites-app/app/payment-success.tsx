import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


/** This screen handles the deep link: unibitesapp://payment-success?orderId=<id>

eSewa redirects to our backend /api/orders/esewa/verify/, which verifies the signature and then redirects here. **/


const PaymentSuccessScreen = () => {
    const router = useRouter();
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const isFailed = orderId === 'failed';

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isFailed) {
                router.replace('/checkout' as any);
            } else {
                router.replace({ pathname: '/order-success' as any, params: { orderId } });
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [isFailed]);

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={[styles.iconCircle, isFailed && styles.iconCircleFailed]}>
                    <Ionicons name={isFailed ? "close" : "checkmark"} size={48} color="#fff" />
                </View>
                <Text style={styles.title}>
                    {isFailed ? "Payment Failed" : "Payment Successful!"}
                </Text>
                <Text style={styles.subtitle}>
                    {isFailed
                        ? "Your eSewa payment was cancelled or failed.\nPlease try again."
                        : `Your eSewa payment was completed.\nOrder #${orderId} has been placed.`}
                </Text>
                <View style={styles.loaderRow}>
                    <ActivityIndicator size="small" color={isFailed ? "#EF4444" : "#60C271"} />
                    <Text style={styles.redirectText}>
                        {isFailed ? "Redirecting to checkout..." : "Redirecting to your orders..."}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 36,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        width: '100%',
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#60C271',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircleFailed: {
        backgroundColor: '#EF4444',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    loaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    redirectText: {
        fontSize: 13,
        color: '#94A3B8',
    },
});

export default PaymentSuccessScreen;
