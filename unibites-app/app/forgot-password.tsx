import React, { useState, useCallback } from "react";
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { API_BASE_URL } from "../constants/api";
import { getErrorMessage, safeJsonParse } from "../utils/errorHandler";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setEmail("");
      setLoading(false);
    }, [])
  );

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Enter email");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ email }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        const msg = data?.message || data?.detail || data?.error || "Failed to send OTP.";

        if (msg.toLowerCase().includes("verify") || msg.toLowerCase().includes("verified") || msg.toLowerCase().includes("active")) {
          Alert.alert(
            "Account Not Verified",
            "Your account is not verified yet. Do you want to verify it now?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Verify Now", onPress: () => router.push({ pathname: "/verify-otp", params: { email } }) }
            ]
          );
        } else {
          Alert.alert("Error", msg);
        }
        return;
      }

      Alert.alert("OTP Sent", "Check your college Outlook inbox for the OTP.");
      router.push({ pathname: "/reset-password", params: { email } });
    } catch (error: any) {
      console.log('Forgot password error:', error?.message);
      Alert.alert("Error", getErrorMessage(error, "Failed to send OTP. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/")}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>Forgot Password</Text>

      <TextInput
        style={styles.input}
        placeholder="College Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.7 }]}
        onPress={handleSendOtp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1,
  },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 16, textAlign: "center", color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  btn: { backgroundColor: "#2E3566", padding: 14, borderRadius: 10 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
