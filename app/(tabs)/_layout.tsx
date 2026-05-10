import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#000",
                tabBarInactiveTintColor: "#9ca3af",
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: "#f3f4f6",
                    paddingTop: 8,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 12),
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    marginTop: 2,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="health"
                options={{
                    title: "Health",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="heart-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="expenses"
                options={{
                    title: "Expenses",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cash-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="reminders"
                options={{
                    title: "Reminders",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="notifications-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}