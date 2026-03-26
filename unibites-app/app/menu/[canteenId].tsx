import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Image,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../../constants/api";
import { addToCart, getCart, updateCartItem, removeCartItem } from "../../services/cartService";

type MenuItem = {
    id: number;
    name: string;
    description: string;
    price: string;
    image_url: string | null;
    is_available: boolean;
};

type CartItem = {
    id: number; // cart_item_id
    menu_item: {
        id: number;
    };
    quantity: number;
};

export default function MenuScreen() {
    const { canteenId, canteenName, canteenImage, canteenRating } = useLocalSearchParams<{ canteenId: string; canteenName: string; canteenImage?: string; canteenRating?: string }>();
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const [cartItems, setCartItems] = useState<{ [menuItemId: number]: number }>({});
    const [cartTotal, setCartTotal] = useState({ count: 0, price: 0 });
    const [cartIdMap, setCartIdMap] = useState<{ [menuItemId: number]: number }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    const fetchMenu = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/vendor/public/menu/${canteenId}/`);
            if (!response.ok) throw new Error("Failed to fetch menu");
            const data = await response.json();
            setItems(data);
        } catch (error) {
            console.error("Error fetching menu:", error);
        }
    };

    const fetchCartData = async () => {
        try {
            const cartData = await getCart();
            const qtyMap: { [key: number]: number } = {};
            const idMap: { [key: number]: number } = {};

            cartData.items.forEach((item: CartItem) => {
                qtyMap[item.menu_item.id] = item.quantity;
                idMap[item.menu_item.id] = item.id;
            });

            setCartItems(qtyMap);
            setCartIdMap(idMap);
            setCartTotal({
                count: cartData.items.length,
                price: cartData.total_price
            });
        } catch (error) {
            console.log("Cart fetch error (likely empty)", error);
            setCartItems({});
            setCartTotal({ count: 0, price: 0 });
        }
    };

    const fetchReviews = async () => {
        setReviewsLoading(true);
        const url = `${API_BASE_URL}/api/canteens/${canteenId}/reviews/`;
        console.log("Fetching reviews from:", url);
        try {
            const response = await fetch(url);
            console.log("Fetch reviews response status:", response.status);
            if (!response.ok) throw new Error(`Failed to fetch reviews: ${response.status}`);
            const data = await response.json();
            setReviews(data);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setReviewsLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchMenu(), fetchCartData(), fetchReviews()]);
        setLoading(false);
    };

    useEffect(() => {
        if (canteenId) {
            loadData();
        }
    }, [canteenId]);

    useFocusEffect(
        useCallback(() => {
            fetchCartData();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchMenu(), fetchCartData(), fetchReviews()]);
        setRefreshing(false);
    };

    const handleInitialAdd = async (item: MenuItem) => {
        try {
            setCartItems(prev => ({ ...prev, [item.id]: 1 }));
            await addToCart(item.id, 1);
            await fetchCartData();
        } catch (error: any) {
            Alert.alert("Error", "Failed to add item. " + (error.response?.data?.error || ""));
            fetchCartData();
        }
    };

    const handleUpdateQty = async (item: MenuItem, delta: number) => {
        const currentQty = cartItems[item.id] || 0;
        const newQty = currentQty + delta;
        const cartItemId = cartIdMap[item.id];

        if (!cartItemId && delta < 0) return;

        try {
            const newMap = { ...cartItems };
            if (newQty <= 0) delete newMap[item.id];
            else newMap[item.id] = newQty;
            setCartItems(newMap);

            if (newQty <= 0) {
                await removeCartItem(cartItemId);
            } else {
                if (cartItemId) {
                    await updateCartItem(cartItemId, newQty);
                }
            }
            await fetchCartData();
        } catch (error) {
            console.error("Update error", error);
            fetchCartData();
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <View style={styles.container}>
                <View style={styles.fixedHeader}>
                    <View style={styles.bannerContainer}>
                        <Image
                            source={
                                canteenImage
                                    ? { uri: canteenImage }
                                    : require("../../assets/images/Coffee_station.png")
                            }
                            style={styles.bannerImage}
                        />
                        <View style={styles.overlay} />
                        <View style={styles.bannerContent}>
                            <Text style={styles.bannerTitle}>{canteenName || "Canteen"}</Text>
                            {canteenRating && (
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={14} color="#F5A623" />
                                    <Text style={styles.ratingBadgeText}>{Number(canteenRating || 0).toFixed(1)}</Text>
                                    <View style={styles.ratingDivider} />
                                    <Text style={styles.reviewCountText}>{reviews.length} reviews</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
                            onPress={() => setActiveTab('menu')}
                        >
                            <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>Menu</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
                            onPress={() => setActiveTab('reviews')}
                        >
                            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'menu' && (
                        <View style={styles.searchBox}>
                            <Ionicons name="search" size={20} color="#9CA3AF" />

                            <TextInput
                                placeholder="Search for your favorite food"
                                placeholderTextColor="#9CA3AF"
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    )}
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {activeTab === 'menu' ? (
                        <View style={styles.listContainer}>
                            {(() => {
                                const filteredItems = items.filter((item) => {
                                    const q = searchQuery.toLowerCase().trim();
                                    if (!q) return true;
                                    return (
                                        item.name.toLowerCase().includes(q) ||
                                        (item.description && item.description.toLowerCase().includes(q))
                                    );
                                });

                                if (items.length === 0) return (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="fast-food-outline" size={48} color="#ccc" />
                                        <Text style={styles.emptyText}>No items available at the moment.</Text>
                                    </View>
                                );

                                if (filteredItems.length === 0) return (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="search-outline" size={48} color="#ccc" />
                                        <Text style={styles.emptyText}>No results for "{searchQuery}"</Text>
                                    </View>
                                );

                                return filteredItems.map((item) => {
                                    const qty = cartItems[item.id] || 0;
                                    return (
                                        <View key={item.id} style={styles.card}>
                                            <View style={styles.cardContent}>
                                                <View style={styles.itemDetails}>
                                                    <Text style={styles.itemName}>{item.name}</Text>
                                                    <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                                                    <Text style={styles.itemPrice}>Rs. {item.price}</Text>
                                                </View>
                                                <View style={styles.imageContainer}>
                                                    <Image
                                                        source={
                                                            item.image_url
                                                                ? { uri: item.image_url }
                                                                : require("../../assets/images/UniBites.png")
                                                        }
                                                        style={styles.itemImage}
                                                    />
                                                    <View style={styles.actionContainer}>
                                                        {!item.is_available ? (
                                                            <View style={styles.unavailableBadge}>
                                                                <Text style={styles.unavailableText}>SOLD</Text>
                                                            </View>
                                                        ) : qty === 0 ? (
                                                            <TouchableOpacity
                                                                style={styles.addButton}
                                                                onPress={() => handleInitialAdd(item)}
                                                            >
                                                                <Text style={styles.addButtonText}>ADD</Text>
                                                            </TouchableOpacity>
                                                        ) : (
                                                            <View style={styles.qtyControl}>
                                                                <TouchableOpacity onPress={() => handleUpdateQty(item, -1)} style={styles.qtyBtn}>
                                                                    <Ionicons name="remove" size={16} color="#4f46e5" />
                                                                </TouchableOpacity>
                                                                <Text style={styles.qtyText}>{qty}</Text>
                                                                <TouchableOpacity onPress={() => handleUpdateQty(item, 1)} style={styles.qtyBtn}>
                                                                    <Ionicons name="add" size={16} color="#4f46e5" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    )
                                });
                            })()}
                        </View>
                    ) : (
                        <View style={styles.reviewsContainer}>
                            {reviewsLoading ? (
                                <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 20 }} />
                            ) : reviews.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                                    <Text style={styles.emptyText}>No reviews yet.</Text>
                                </View>
                            ) : (
                                reviews.map((review) => (
                                    <View key={review.id} style={styles.reviewCard}>
                                        <View style={styles.reviewHeader}>
                                            <View style={styles.userAvatar}>
                                                <Text style={styles.avatarText}>{review.user_name?.charAt(0) || 'U'}</Text>
                                            </View>
                                            <View style={styles.reviewMainInfo}>
                                                <Text style={styles.reviewUser}>{review.user_name}</Text>
                                                <View style={styles.starsRow}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Ionicons
                                                            key={star}
                                                            name={star <= review.rating ? "star" : "star-outline"}
                                                            size={14}
                                                            color="#F5A623"
                                                        />
                                                    ))}
                                                    <Text style={styles.reviewDate}>
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        {review.message && (
                                            <Text style={styles.reviewMessage}>{review.message}</Text>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>

                {cartTotal.count > 0 && (
                    <View style={styles.bottomBarContainer}>
                        <TouchableOpacity style={styles.bottomBar} onPress={() => router.push('/cart')}>
                            <View style={styles.bottomBarLeft}>
                                <Text style={styles.bottomBarCount}>{cartTotal.count} Items</Text>
                                <Text style={styles.bottomBarDivider}>|</Text>
                                <Text style={styles.bottomBarPrice}>Rs. {cartTotal.price}</Text>
                            </View>
                            <View style={styles.bottomBarRight}>
                                <Text style={styles.bottomBarCheckout}>Checkout</Text>
                                <Ionicons name="cart" size={20} color="white" style={{ marginLeft: 8 }} />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    fixedHeader: {
        backgroundColor: "#F9FAFB",
    },
    scrollContent: {
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    bannerContainer: {
        height: 250,
        position: 'relative',
        marginBottom: 20,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    bannerContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 20,
    },
    bannerSubtitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    canteenLogo: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    bannerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8,
        gap: 6,
    },
    ratingBadgeText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    listContainer: {
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        padding: 16,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        width: "90%",
        alignSelf: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    searchInput: {
        flex: 1,
        fontSize: 15,
        color: "#111827",
        backgroundColor: "#fff",
        marginHorizontal: 8,
        paddingVertical: 0,
    },

    itemDetails: {
        flex: 1,
        marginRight: 16,
    },
    imageContainer: {
        alignItems: 'center',
        width: 100,
    },
    itemImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        resizeMode: 'cover',
        marginBottom: -15,
    },
    actionContainer: {
        marginTop: -10,
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    itemDesc: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 8,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    addButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#4f46e5',
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    addButtonText: {
        color: '#4f46e5',
        fontWeight: 'bold',
        fontSize: 14,
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#4f46e5',
        borderRadius: 8,
        overflow: 'hidden',
    },
    qtyBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f3f4f6',
    },
    qtyText: {
        paddingHorizontal: 12,
        fontWeight: 'bold',
        color: '#4f46e5',
    },
    unavailableBadge: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        marginTop: 10,
    },
    unavailableText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
        gap: 12
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 16
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    bottomBar: {
        backgroundColor: '#ef4444',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    bottomBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bottomBarCount: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    bottomBarDivider: {
        color: 'rgba(255,255,255,0.6)',
        marginHorizontal: 8,
    },
    bottomBarPrice: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    bottomBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bottomBarCheckout: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    },
    ratingDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.4)',
        marginHorizontal: 4,
    },
    reviewCountText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 20,
    },
    tab: {
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#4f46e5',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    activeTabText: {
        color: '#4f46e5',
    },
    reviewsContainer: {
        paddingHorizontal: 16,
    },
    reviewCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4f46e5',
    },
    reviewMainInfo: {
        flex: 1,
    },
    reviewUser: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    reviewDate: {
        fontSize: 12,
        color: '#9ca3af',
        marginLeft: 8,
    },
    reviewMessage: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
    },
});
