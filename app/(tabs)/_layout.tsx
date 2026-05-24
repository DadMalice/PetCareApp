import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: isDark ? "#f5f5f7" : "#000",
                tabBarInactiveTintColor: isDark ? "#636366" : "#9ca3af",
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: isDark ? "#2c2c2e" : "#f3f4f6",
                    backgroundColor: isDark ? "#1c1c1e" : "#fff",
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