import React, { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { API_BASE_URL } from "../constants/api";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const handleReset = async () => {
    if (!otp || !password || password !== password2) {
      Alert.alert("Error", "Invalid inputs");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        otp,
        new_password: password,
        new_password2: password2,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      Alert.alert("Error", data.error || "Reset failed");
      return;
    }

    Alert.alert("Success", "Password reset");
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>

      <TextInput style={styles.input} placeholder="OTP" value={otp} onChangeText={setOtp} />
      <TextInput style={styles.input} placeholder="New Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={password2} onChangeText={setPassword2} />

      <TouchableOpacity style={styles.btn} onPress={handleReset}>
        <Text style={styles.btnText}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 24 
},

  title: { 
    fontSize: 22, 
    fontWeight: "600", 
    marginBottom: 16, 
    textAlign: "center" 
},

  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12 

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
