import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const params = useLocalSearchParams<{ fullName?: string }>();
  const fullName = params.fullName || "User";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/UniBites.png")}
          style={styles.logo}
        />
        <Ionicons name="notifications-outline" size={24} color="#333" />
      </View>

      {/* Welcome */}
      <Text style={styles.welcomeText}>Welcome, {fullName.toUpperCase()}</Text>
      <Text style={styles.subText}>
        Fuel Your Campus, One Bite at a Time
      </Text>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput
          placeholder="Search for your favorite food"
          style={styles.searchInput}
        />
        <Ionicons name="mic-outline" size={20} color="#888" />
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Enjoy Best Khana set{"\n"}at Islington Canteen
        </Text>
      </View>

      {/* Featured */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Today</Text>
        <Text style={styles.seeAll}>See All</Text>
      </View>

      <View style={styles.featuredRow}>
        <View style={styles.featuredCard}>
          <Text style={styles.foodTitle}>MOMO</Text>
          <Text style={styles.foodSub}>One More Bite</Text>
        </View>

        <View style={styles.featuredCard}>
          <Text style={styles.foodTitle}>Pizza</Text>
          <Text style={styles.foodSub}>Brit cafe</Text>
        </View>
      </View>

      {/* All Canteens */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Canteens</Text>
      </View>

      <View style={styles.canteenCard}>
        <View>
          <Text style={styles.canteenName}>Brit cafe</Text>
          <Text style={styles.canteenSub}>Near Alumni Block</Text>
          <Text style={styles.canteenTime}>7:00 - 20:00</Text>
        </View>

        <View style={styles.rightInfo}>
          <Text style={styles.rating}>⭐ 4.3</Text>
          <View style={styles.itemBadge}>
            <Text style={styles.itemText}>6 items</Text>
          </View>
        </View>
      </View>

      {/* Bottom Spacer */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 25,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },

  welcomeText: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    color: "#1E2A5A",
    textAlign: "center",
  },

  subText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 5,
    textAlign: "center",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 20,
  },

  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
  },

  banner: {
    height: 140,
    backgroundColor: "#111827",
    borderRadius: 16,
    marginTop: 20,
    padding: 16,
    justifyContent: "flex-end",
  },

  bannerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E2A5A",
  },

  seeAll: {
    fontSize: 13,
    color: "#4F46E5",
  },

  featuredRow: {
    flexDirection: "row",
    marginTop: 12,
  },

  featuredCard: {
    width: 140,
    height: 100,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    justifyContent: "flex-end",
  },

  foodTitle: {
    fontWeight: "700",
  },

  foodSub: {
    fontSize: 12,
    color: "#6B7280",
  },

  canteenCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },

  canteenName: {
    fontWeight: "700",
  },

  canteenSub: {
    fontSize: 12,
    color: "#6B7280",
  },

  canteenTime: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  rightInfo: {
    alignItems: "flex-end",
  },

  rating: {
    fontSize: 12,
    marginBottom: 6,
  },

  itemBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  itemText: {
    fontSize: 12,
  },
});
