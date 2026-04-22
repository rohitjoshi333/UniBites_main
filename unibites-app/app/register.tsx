import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Link, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../constants/api";
import { getErrorMessage, safeJsonParse } from "../utils/errorHandler";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }, [])
  );

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    if (/^\d/.test(fullName.trim())) {
      Alert.alert("Invalid Name", "Name cannot start with a number.");
      return;
    }

    if (!email.endsWith("@islingtoncollege.edu.np")) {
      Alert.alert(
        "Invalid email",
        "Please use your college email (@islingtoncollege.edu.np)."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone: phone || null,
          password,
          password2: confirmPassword,
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        const msg = data?.message || data?.detail || "Registration failed. Please try again.";
        Alert.alert("Register Failed", msg);
        return;
      }

      Alert.alert(
        "Registered",
        "Account created. Please enter the OTP sent to your email.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace({
                pathname: "/verify-otp",
                params: { email },
              });
            },
          },
        ]
      );

    } catch (error: any) {
      console.log('Register error:', error?.message);
      Alert.alert("Error", getErrorMessage(error, "Something went wrong. Check your network."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Image
        source={require("../assets/images/UniBites.png")}
        style={styles.logo}
      />

      <View style={styles.card}>
        <Text style={styles.heading}>Create a new account</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#999"
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          style={styles.input}
          placeholder="College Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.phoneContainer}>
          <Text style={styles.countryCode}>+977</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="98XXXXXXXX"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

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

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.imageWrapper}>
          <Image
            source={require("../assets/images/Coffee_station.png")}
            style={styles.bgImage}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, loading && { opacity: 0.5 }]}
            onPress={() => router.push("/")}
            disabled={loading}
          >
            <Text style={styles.secondaryText}>Already have an account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingTop: 50,
  },

  logo: {
    width: 150,
    height: 130,
    resizeMode: "contain",
    marginBottom: 6,
  },

  card: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingBottom: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
  },

  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E1E1E",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  input: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E5EC",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E5EC",
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#333",
  },

  eyeIcon: {
    padding: 10,
  },

  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E5EC",
    borderRadius: 10,
    backgroundColor: "#FAFAFC",
  },

  countryCode: {
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    borderRightWidth: 1,
    borderRightColor: "#E2E5EC",
  },

  phoneInput: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
  },

  imageWrapper: {
    width: "100%",
    height: 220,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#ECEEF4",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },

  bgImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    opacity: 0.95,
  },

  primaryBtn: {
    backgroundColor: "#2E3566",
    marginHorizontal: 20,
    marginTop: 22,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: "#2E3566",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },

  primaryText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
  },

  secondaryBtn: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#2E3566",
  },

  secondaryText: {
    color: "#2E3566",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },

  footer: {
    marginTop: 14,
    fontSize: 12,
    color: "#9AA0B4",
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 16,
  },
});
