import React, { useState } from "react";
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
} from "react-native";
import { Link, router } from "expo-router";
import { API_BASE_URL } from "../constants/api";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all required fields.");
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
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone: phone || null,
          password,
          password2: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Register failed", data.detail || "Please try again.");
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

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong. Check your network.");
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
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          style={styles.input}
          placeholder="College Email"
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
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <View style={styles.imageWrapper}>
          <Image
            source={require("../assets/images/Coffee_station.png")}
            style={styles.bgImage}
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleRegister}
          >
            <Text style={styles.primaryText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push("/")}
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
    paddingTop: 14,
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
    backgroundColor: "#FAFAFC",
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
