import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#4f46e5",
                tabBarInactiveTintColor: "gray",
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    href: "/home",
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cart/index"
                options={{
                    href: "/cart",
                    title: "Cart",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cart-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="order/index"
                options={{
                    href: "/order",
                    title: "Orders",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile/index"
                options={{
                    href: "/profile",
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen name="index" options={{ href: null, tabBarStyle: { display: "none" } }} />
            <Tabs.Screen name="register" options={{ href: null, tabBarStyle: { display: "none" } }} />
            <Tabs.Screen name="forgot-password" options={{ href: null, tabBarStyle: { display: "none" } }} />
            <Tabs.Screen name="verify-otp" options={{ href: null, tabBarStyle: { display: "none" } }} />
            <Tabs.Screen name="reset-password" options={{ href: null, tabBarStyle: { display: "none" } }} />
            <Tabs.Screen name="menu/[canteenId]" options={{ href: null, tabBarStyle: { display: "none" } }} />
        </Tabs>
    );
}
