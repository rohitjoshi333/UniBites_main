// app/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
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
        console.log("Register error:", data);
        Alert.alert("Register failed", data.detail || "Please try again.");
        return;
      }

      Alert.alert(
        "Registered",
        "Account created. Please check your email for OTP verification."
      );

      // go back to login
      router.replace("/");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName}
      />

      <TextInput
        style={styles.input} placeholder="College Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone (optional)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

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
        onChangeText={setConfirmPassword}/>

      <Button title={"Register"} onPress={handleRegister}/>

      <View style={{ height: 16 }} />

      <Link href="/" style={styles.linkText}>
        Already have an account? Login
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  linkText: {
    textAlign: "center",
    color: "black",
    textDecorationLine: "underline",
  },
});
