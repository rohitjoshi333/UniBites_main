import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function HomeScreen() {
  const params = useLocalSearchParams<{ fullName?: string }>();
  const fullName = params.fullName || "User";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome {fullName}</Text>
      <Text style={styles.subtitle}>You are now logged in 🎉</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
  },
});
