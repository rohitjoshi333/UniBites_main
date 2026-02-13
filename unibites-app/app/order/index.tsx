import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OrderScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>My Orders</Text>
            <Text style={styles.subText}>Past orders will appear here.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    subText: {
        color: '#666',
        marginTop: 8,
    }
});
