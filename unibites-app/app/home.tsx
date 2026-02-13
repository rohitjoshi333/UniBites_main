import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../constants/api";

type Canteen = {
  id: number;
  name: string;
  location: string;
  opening_time: string;
  closing_time: string;
  rating: number;
  total_items: number;
};

export default function HomeScreen() {
  const params = useLocalSearchParams<{ fullName?: string }>();
  const fullName = params.fullName || "User";
  const router = useRouter();

  const [canteens, setCanteens] = useState<Canteen[]>([]);

  useEffect(() => {
    fetchCanteens();
  }, []);

  const fetchCanteens = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/canteens/`);
      const data = await response.json();
      setCanteens(data);
    } catch (error) {
      console.log("Failed to load canteens", error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image
          source={require("../assets/images/UniBites.png")}
          style={styles.logo}
        />
        <Ionicons name="notifications-outline" size={24} color="#333" />
      </View>

      <Text style={styles.welcomeText}>
        Welcome, {fullName.toUpperCase()}
      </Text>
      <Text style={styles.subText}>
        Fuel Your Campus, One Bite at a Time
      </Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput
          placeholder="Search for your favorite food"
          style={styles.searchInput}
        />
        <Ionicons name="mic-outline" size={20} color="#888" />
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Enjoy Best Khana set{"\n"}at Islington Canteen
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Canteens</Text>
      </View>

      {canteens.map((canteen) => (
        <TouchableOpacity
          key={canteen.id}
          activeOpacity={0.9}
          onPress={() => router.push({
            pathname: "/menu/[canteenId]",
            params: { canteenId: canteen.id, canteenName: canteen.name }
          })}
        >
          <View style={styles.canteenCard}>
            <View>
              <Text style={styles.canteenName}>{canteen.name}</Text>
              <Text style={styles.canteenSub}>{canteen.location}</Text>
              <Text style={styles.canteenTime}>
                {canteen.opening_time} - {canteen.closing_time}
              </Text>
            </View>

            <View style={styles.rightInfo}>
              <View style={styles.ratingRow}>
                <FontAwesome name="star" size={14} color="#F5A623" />
                <Text style={styles.ratingText}>{canteen.rating}</Text>
              </View>

              <View style={styles.itemBadge}>
                <Text style={styles.itemText}>
                  {canteen.total_items} items
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}

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

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
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
