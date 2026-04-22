import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Link, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../constants/api";
import { getErrorMessage, safeJsonParse } from "../utils/errorHandler";

import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setEmail("");
      setPassword("");
      setShowPassword(false);
    }, [])
  );

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        const msg = data?.message || data?.detail || data?.error || data?.non_field_errors?.[0] || "Invalid credentials.";

        // If the backend mentions verifying the email, redirect them to the verify OTP page.
        if (msg.toLowerCase().includes("verify") || msg.toLowerCase().includes("verified") || msg.toLowerCase().includes("active")) {
          Alert.alert(
            "Account Not Verified",
            "Your account is not verified yet. Would you like to verify it now?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Verify OTP", onPress: () => router.push({ pathname: "/verify-otp", params: { email } }) }
            ]
          );
          return;
        }

        Alert.alert("Login Failed", msg);
        return;
      }

      // Save tokens securely
      if (data.access) {
        await SecureStore.setItemAsync("accessToken", data.access);
      }
      if (data.refresh) {
        await SecureStore.setItemAsync("refreshToken", data.refresh);
      }

      // Backend bata full name ley mero vai
      const fullName =
        data.full_name ||
        data.user?.full_name ||
        "User";

      // Hard code garnu hudaina - Dynamic data pathaune
      router.replace({
        pathname: "/home",
        params: { fullName },
      });

    } catch (error: any) {
      console.log('Login error:', error?.message);
      Alert.alert("Error", getErrorMessage(error, "Network error. Check your connection."));
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.screen}>
      {/* Logo */}
      <Image
        source={require("../assets/images/UniBites.png")}
        style={styles.logo}
      />

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.heading}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="College Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <Text 
          style={[styles.forgot, loading && { opacity: 0.5 }]} 
          onPress={() => !loading && router.push("/forgot-password")}
        >
          Forgot password?
        </Text>

        {/* IMAGE SECTION */}
        <View style={styles.imageWrapper}>
          <Image
            source={require("../assets/images/Coffee_station.png")}
            style={styles.bgImage}
          />

          <TouchableOpacity
            style={[styles.signInBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createBtn, loading && { opacity: 0.5 }]}
            onPress={() => router.push("/register")}
            disabled={loading}
          >
            <Text style={styles.createText}>Create new account</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footer}>
        By continuing, you agree to our Terms & Privacy Policy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f7ff",
    alignItems: "center",
    paddingTop: 50,
  },

  logo: {
    width: 160,
    height: 150,
    resizeMode: "contain",
    marginBottom: 1,
  },

  card: {
    width: "90%",
    backgroundColor: "#ffffffff",
    borderRadius: 16,
    padding: 1,
    elevation: 6,
    overflow: "hidden",
  },

  heading: {
    fontSize: 18,
    fontWeight: "600",
    padding: 20,
  },

  input: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    color: "#333",
    backgroundColor: "#fff",
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
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

  forgot: {
    textAlign: "right",
    marginRight: 20,
    marginBottom: 10,
    color: "#2e3566ff",
    fontSize: 12,
  },

  /* IMAGE CONTAINER */
  imageWrapper: {
    width: "100%",
    height: 350,
    position: "relative",
  },

  bgImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 12,
  },

  signInBtn: {
    backgroundColor: "#2e3566ea",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },

  signInText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },

  createBtn: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2E3566",
  },

  createText: {
    color: "#2E3566",
    textAlign: "center",
    fontWeight: "600",
  },

  footer: {
    marginTop: 20,
    fontSize: 12,
    color: "#999",
  },
});
