import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert,} from "react-native";
import { Link, router } from "expo-router";
import { API_BASE_URL } from "../constants/api";

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

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
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.log("Login error:", data);
        Alert.alert("Login failed", data.detail || "Invalid credentials.");
        return;
      }

      const fullName =
        data.user?.full_name || data.full_name || "User";

      router.replace({
        pathname: "/home",
        params: { fullName },
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="College Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title={"Login"} onPress={handleLogin}/>

      <View style={{ height: 16 }} />

      <Link href="/register" style={styles.linkText}>
        Don&apos;t have an account? Register
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    marginBottom: 18,
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
