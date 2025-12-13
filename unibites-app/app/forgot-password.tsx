import React, { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { API_BASE_URL } from "../constants/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Enter email");
      return;
    }

    await fetch(`${API_BASE_URL}/api/auth/forgot-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    Alert.alert("OTP Sent", "Check console (backend)");
    router.push({ pathname: "/reset-password", params: { email } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      <TextInput
        style={styles.input}
        placeholder="College Email"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.btn} onPress={handleSendOtp}>
        <Text style={styles.btnText}>Send OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 16, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 16 },
  btn: { backgroundColor: "#2E3566", padding: 14, borderRadius: 10 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
