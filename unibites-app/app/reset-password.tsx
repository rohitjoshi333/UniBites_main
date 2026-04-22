import React, { useState, useCallback } from "react";
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { API_BASE_URL } from "../constants/api";
import { getErrorMessage, safeJsonParse } from "../utils/errorHandler";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setOtp("");
      setPassword("");
      setPassword2("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }, [])
  );

  const handleReset = async () => {
    if (!otp || !password || password !== password2) {
      Alert.alert("Error", "Invalid inputs");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({
          email,
          otp,
          new_password: password,
          new_password2: password2,
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        const msg = data?.message || data?.error || "Reset failed. Please try again.";
        Alert.alert("Error", msg);
        return;
      }

      Alert.alert("Success", "Password reset successfully.");
      router.replace("/");
    } catch (error: any) {
      console.log('Reset password error:', error?.message);
      Alert.alert("Error", getErrorMessage(error, "Network error. Check your connection."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/")}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.title}>Reset Password</Text>

      <TextInput style={styles.input} placeholder="OTP" placeholderTextColor="#999" value={otp} onChangeText={setOtp} />
      
      <View style={styles.passwordContainer}>
        <TextInput style={styles.passwordInput} placeholder="New Password" placeholderTextColor="#999" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput style={styles.passwordInput} placeholder="Confirm Password" placeholderTextColor="#999" secureTextEntry={!showConfirmPassword} value={password2} onChangeText={setPassword2} />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={[styles.btn, loading && { opacity: 0.7 }]} 
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff"
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1,
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: "#333"
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    color: "#333",
    backgroundColor: "#fff",
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  passwordInput: {
    flex: 1,
    padding: 12,
    color: "#333",
  },

  eyeIcon: {
    padding: 10,
  },

  btn: {
    backgroundColor: "#2E3566",
    padding: 14,
    borderRadius: 10
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600"
  },
});
