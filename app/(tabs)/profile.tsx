import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { Pet } from "../../types/index";

export default function ProfileScreen() {
    const router = useRouter();
    const { isDark, toggleTheme } = useTheme();
    const [pets, setPets] = useState<Pet[]>([]);
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

    async function fetchData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserName(user.user_metadata?.full_name || "Pet Owner");
            setUserEmail(user.email || "");

            const { data: petsData } = await supabase
                .from("pets")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });

            setPets(petsData || []);
            if (petsData && petsData.length > 0) {
                setSelectedPet(petsData[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    async function handleLogout() {
        await supabase.auth.signOut();
    }

    const bgClass = isDark ? "bg-dark-bg" : "bg-white";
    const cardBgClass = isDark ? "bg-dark-card" : "bg-white";
    const textClass = isDark ? "text-dark-text" : "text-black";
    const textSecondaryClass = isDark ? "text-dark-text-secondary" : "text-gray-400";

    if (loading) {
        return (
            <SafeAreaView className={`flex-1 ${bgClass} items-center justify-center`}>
                <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className={`flex-1 ${bgClass}`}>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-5 pt-4 pb-24">

                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className={`text-2xl font-bold ${textClass}`}>Profile</Text>
                    </View>

                    {/* User Info */}
                    <View className={`rounded-2xl p-4 mb-6 ${cardBgClass}`} style={{ borderWidth: 1, borderColor: isDark ? "#2c2c2e" : "#f3f4f6" }}>
                        <View className="flex-row items-center gap-4">
                            <View className={`w-14 h-14 rounded-full items-center justify-center ${isDark ? "bg-dark-border" : "bg-gray-100"}`}>
                                <Ionicons name="person-outline" size={24} color="#9ca3af" />
                            </View>
                            <View className="flex-1">
                                <Text className={`text-lg font-bold ${textClass}`}>{userName}</Text>
                                <Text className={`text-sm ${textSecondaryClass}`}>{userEmail}</Text>
                            </View>
                        </View>
                    </View>

                    {/* My Pets Section */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className={`text-base font-semibold ${textClass}`}>My Pets</Text>
                        <TouchableOpacity
                            className="flex-row items-center gap-1"
                            onPress={() => router.push("/add-pet")}
                        >
                            <Ionicons name="add" size={16} color={isDark ? "#f5f5f7" : "#000"} />
                            <Text className={`text-sm font-medium ${textClass}`}>Add Pet</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Pet Grid */}
                    {pets.length === 0 ? (
                        <TouchableOpacity
                            className={`border border-dashed rounded-2xl p-8 items-center mb-6 ${isDark ? "border-dark-border" : "border-gray-200"}`}
                            onPress={() => router.push("/add-pet")}
                        >
                            <Ionicons name="paw-outline" size={32} color="#9ca3af" />
                            <Text className="text-gray-400 mt-2 text-sm">No pets yet</Text>
                            <Text className={`font-semibold mt-1 ${textClass}`}>+ Add your first pet</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            {/* Pet Cards Grid */}
                            <View className="flex-row flex-wrap mb-4" style={{ gap: 12 }}>
                                {pets.map((pet) => (
                                    <TouchableOpacity
                                        key={pet.id}
                                        className={`rounded-2xl p-4 items-center ${cardBgClass}`}
                                        style={{
                                            flexBasis: "47%",
                                            flexGrow: 0,
                                            borderWidth: 1,
                                            borderColor: isDark ? "#2c2c2e" : "#f3f4f6",
                                        }}
                                        onPress={() => setSelectedPet(pet)}
                                    >
                                        <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${isDark ? "bg-dark-border" : "bg-gray-100"}`}>
                                            <MaterialCommunityIcons name="dog" size={32} color="#9ca3af" />
                                        </View>
                                        <Text className={`font-bold ${textClass} text-base`}>{pet.name}</Text>
                                        <Text className={`${textSecondaryClass} text-xs mt-0.5`}>{pet.breed}</Text>
                                        <Text className={`${textSecondaryClass} text-xs mt-0.5`}>
                                            {pet.age_years} yrs · {pet.weight_kg} kg
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Selected Pet Detail Card */}
                            {selectedPet && (
                                <View
                                    className={`rounded-2xl p-4 mb-6 ${cardBgClass}`}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: isDark ? "#2c2c2e" : "#f3f4f6",
                                    }}
                                >
                                    <View className="flex-row items-center gap-4 mb-3">
                                        <View className={`w-16 h-16 rounded-full items-center justify-center ${isDark ? "bg-dark-border" : "bg-gray-100"}`}>
                                            <MaterialCommunityIcons name="dog" size={32} color="#9ca3af" />
                                        </View>
                                        <View>
                                            <Text className={`font-bold ${textClass} text-lg`}>{selectedPet.name}</Text>
                                            <Text className={`${textSecondaryClass} text-sm`}>{selectedPet.breed}</Text>
                                            <Text className={`${textSecondaryClass} text-xs`}>{selectedPet.age_years} yrs · {selectedPet.weight_kg} kg</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row gap-2">
                                        <View className={`flex-row items-center gap-1 ${isDark ? "bg-dark-border" : "bg-gray-100"} px-3 py-1.5 rounded-full`}>
                                            <Ionicons name="cash-outline" size={12} color="#6b7280" />
                                            <Text className="text-xs text-gray-500">Monthly Cost: --</Text>
                                        </View>
                                        <View className={`flex-row items-center gap-1 ${isDark ? "bg-dark-border" : "bg-gray-100"} px-3 py-1.5 rounded-full`}>
                                            <Ionicons name="heart-outline" size={12} color="#6b7280" />
                                            <Text className="text-xs text-gray-500">Status: {selectedPet.status}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </>
                    )}

                    {/* Settings Section */}
                    <Text className={`text-base font-semibold ${textClass} mb-3`}>Settings</Text>
                    <View className={`rounded-2xl overflow-hidden ${cardBgClass}`} style={{ borderWidth: 1, borderColor: isDark ? "#2c2c2e" : "#f3f4f6" }}>
                        {[
                            { icon: "notifications-outline", label: "Notifications" },
                            { icon: "server-outline", label: "Data & Backup" },
                            { icon: "options-outline", label: "Units & Preferences" },
                            { icon: "information-circle-outline", label: "About" },
                        ].map((item, index, arr) => (
                            <TouchableOpacity
                                key={item.label}
                                className="flex-row items-center px-4 py-4"
                                style={{
                                    borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                                    borderBottomColor: isDark ? "#2c2c2e" : "#f3f4f6",
                                }}
                            >
                                <Ionicons name={item.icon as any} size={20} color="#6b7280" />
                                <Text className={`flex-1 ml-3 ${textClass} text-sm`}>{item.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                            </TouchableOpacity>
                        ))}

                        {/* Dark Mode Toggle */}
                        <View
                            className="flex-row items-center px-4 py-0"
                            style={{ borderTopWidth: 1, borderTopColor: isDark ? "#2c2c2e" : "#f3f4f6" }}
                        >
                            <Ionicons
                                name={isDark ? "moon-outline" : "sunny-outline"}
                                size={20}
                                color="#6b7280"
                            />
                            <Text className={`flex-1 ml-3 ${textClass} text-sm`}>
                                Dark Mode
                            </Text>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: "#f3f4f6", true: "#636366" }}
                                thumbColor={isDark ? "#f5f5f7" : "#fff"}
                            />
                        </View>

                        {/* Log Out */}
                        <TouchableOpacity
                            className="flex-row items-center px-4 py-4"
                            style={{ borderTopWidth: 1, borderTopColor: isDark ? "#2c2c2e" : "#f3f4f6" }}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                            <Text className="flex-1 ml-3 text-red-500 text-sm">Log Out</Text>
                            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}