import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../constants/api";
import * as SecureStore from "expo-secure-store";
import { useAppContext } from "../contexts/AppContext";

type Canteen = {
  id: number;
  name: string;
  location: string;
  opening_time: string;
  closing_time: string;
  rating: number;
  total_items: number;
  image_url: string | null;
};

type Banner = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  serial_number: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const [fullName, setFullName] = useState("User");
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = React.useRef<any>(null);

  // Global unread count lives in AppContext
  const { unreadNotifCount } = useAppContext();

  useEffect(() => {
    fetchCanteens();
    fetchUserName();
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        let nextSlide = (activeSlide + 1) % banners.length;
        setActiveSlide(nextSlide);
        flatListRef.current?.scrollToIndex({ index: nextSlide, animated: true });
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [activeSlide, banners]);

  const fetchUserName = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.full_name) setFullName(data.full_name);
    } catch (error) {
      console.log("Failed to fetch user name", error);
    }
  };

  const fetchCanteens = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/canteens/`);
      const data = await response.json();
      setCanteens(data);
    } catch (error) {
      console.log("Failed to load canteens", error);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/banners/`);
      const data = await response.json();
      setBanners(data);
    } catch (error) {
      console.log("Failed to load banners", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.fixedContent}>
        <View style={styles.header}>
          <Image
            source={require("../assets/images/UniBites.png")}
            style={styles.logo}
          />
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={26} color="#333" />
            {unreadNotifCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.welcomeText}>
          Welcome, {fullName.toUpperCase()}
        </Text>
        <Text style={styles.subText}>
          Fuel Your Campus, One Bite at a Time
        </Text>

        <View style={styles.carouselContainer}>
          {banners.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={banners}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e: any) => {
                  const contentOffset = e.nativeEvent.contentOffset.x;
                  const viewSize = e.nativeEvent.layoutMeasurement.width;
                  const index = Math.floor(contentOffset / viewSize);
                  setActiveSlide(index);
                }}
                keyExtractor={(item: Banner) => item.id.toString()}
                renderItem={({ item }: { item: Banner }) => (
                  <View style={[styles.bannerWrapper, { width: screenWidth - 50 }]}>
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.bannerImage}
                    />
                    <View style={styles.bannerOverlay} />
                    <View style={styles.bannerTextContainer}>
                      <Text style={styles.bannerText}>{item.title}</Text>
                      {item.description ? (
                        <Text style={styles.bannerSubText}>{item.description}</Text>
                      ) : null}
                    </View>
                  </View>
                )}
              />
              <View style={styles.pagination}>
                {banners.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      activeSlide === index ? styles.activeDot : null,
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={[styles.bannerWrapper, { width: screenWidth - 50 }]}>
              <Image
                source={require("../assets/images/islingtoncanteen.jpg")}
                style={styles.bannerImage}
              />
              <View style={styles.bannerOverlay} />
              <Text style={styles.bannerText}>
                Enjoy Best Khana set{"\n"}at Islington Canteen
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Canteens</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {canteens.map((canteen) => (
          <TouchableOpacity
            key={canteen.id}
            activeOpacity={0.9}
            onPress={() => router.push({
              pathname: "/menu/[canteenId]",
              params: {
                canteenId: canteen.id,
                canteenName: canteen.name,
                canteenImage: canteen.image_url || '',
                canteenRating: canteen.rating,
                canteenLocation: canteen.location,
                canteenOpeningTime: canteen.opening_time,
                canteenClosingTime: canteen.closing_time,
              }
            })}
          >
            <View style={styles.canteenCard}>
              <Image
                source={
                  canteen.image_url
                    ? { uri: canteen.image_url }
                    : require("../assets/images/UniBites.png")
                }
                style={styles.canteenThumb}
              />
              <View style={styles.canteenInfo}>
                <Text style={styles.canteenName}>{canteen.name}</Text>
                <Text style={styles.canteenSub}>{canteen.location}</Text>
                <Text style={styles.canteenTime}>
                  {canteen.opening_time} - {canteen.closing_time}
                </Text>
              </View>

              <View style={styles.rightInfo}>
                <View style={styles.ratingRow}>
                  <FontAwesome name="star" size={14} color="#F5A623" />
                  <Text style={styles.ratingText}>{Number(canteen.rating || 0).toFixed(1)}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  fixedContent: {
    paddingHorizontal: 25,
    paddingBottom: 10,
  },

  scrollContainer: {
    flex: 1,
    paddingHorizontal: 25,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
  },

  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },

  bellBtn: {
    padding: 8,
    position: "relative",
  },

  badge: {
    position: "absolute",
    right: 6,
    top: 6,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
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

  carouselContainer: {
    marginTop: 20,
    height: 180,
  },

  bannerWrapper: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
  },

  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  bannerTextContainer: {
    padding: 16,
  },

  bannerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  bannerSubText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 4,
  },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
  },

  activeDot: {
    width: 14,
    backgroundColor: "#4f46e5",
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
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#f2f2f2ff",
  },

  canteenThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },

  canteenInfo: {
    flex: 1,
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
    gap: 5,
    marginBottom: 10,
  },

  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  itemBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },

  itemText: {
    fontSize: 13,
  },
});

