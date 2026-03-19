import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { Link, router } from "expo-router";
import { API_BASE_URL } from "../constants/api";

import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Login failed",
          data.detail || data.non_field_errors?.[0] || "Invalid credentials"
        );
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

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network error. Check backend connection.");
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
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.forgot} onPress={() => router.push("/forgot-password")}>
          Forgot password?
        </Text>

        {/* IMAGE SECTION */}
        <View style={styles.imageWrapper}>
          <Image
            source={require("../assets/images/Coffee_station.png")}
            style={styles.bgImage}
          />

          {/* Image will be behind the btns as btn is on top of the img */}
          <TouchableOpacity style={styles.signInBtn} onPress={handleLogin}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/register")}
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
