import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "../constants/api";

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);

  const handleVerify = async () => {
    if (!otp) {
      Alert.alert("Error", "Enter OTP");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email?.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.non_field_errors?.[0] || data.detail || "Invalid OTP");
        return;
      }

      Alert.alert("Success", "Email verified successfully");
      router.replace("/");
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
    }
  };

  // RESEND OTP
  const handleResendOtp = async () => {
    try {
      setResendDisabled(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email?.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.detail || "Failed to resend OTP");
        setResendDisabled(false);
        return;
      }

      Alert.alert("Success", "New OTP sent to your email");

      // prevent spamming resend
      setTimeout(() => setResendDisabled(false), 30000); // 30 sec cooldown
    } catch {
      Alert.alert("Error", "Network error");
      setResendDisabled(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Image source={require("../assets/images/UniBites.png")} style={styles.logo} />

      <View style={styles.card}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to your email
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
        />

        <TouchableOpacity
          style={styles.verify_btn}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.verify_Text}>
            {loading ? "Verifying..." : "Verify"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.resend_btn,
            resendDisabled && { opacity: 0.5 },
          ]}
          onPress={handleResendOtp}
          disabled={resendDisabled}
        >
          <Text style={styles.resend_Text}>
            {resendDisabled ? "Resend in 30s" : "Resend OTP"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  logo: {
    width: 160,
    height: 150,
    marginBottom: 20,
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginBottom: 18,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E2E5EC",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: "#FAFAFC",
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 18,
  },

  verify_btn: {
    backgroundColor: "#384482ff",
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },

  resend_btn: {
    backgroundColor: "#ffffffff",
    borderColor: "#384482ff",
    borderWidth: 1,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },

  verify_Text: {
    color: "#ffffffff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },

  resend_Text: {
    color: "#384482ff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
});
