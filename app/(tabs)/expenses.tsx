import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import type { PetEvent, Pet } from "../../types/index";

const CATEGORY_COLORS: Record<string, string> = {
    food: "#dcfce7",
    vet: "#dbeafe",
    grooming: "#f3e8ff",
    medicine: "#ffedd5",
    other: "#f3f4f6",
};

const CATEGORY_ICONS: Record<string, any> = {
    food: "fast-food-outline",
    vet: "medical-outline",
    grooming: "cut-outline",
    medicine: "fitness-outline",
    other: "ellipsis-horizontal-outline",
};

function getMonthName(date: Date) {
    return date.toLocaleDateString([], { month: "long", year: "numeric" });
}

function formatDate(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function ExpensesScreen() {
    const { isDark } = useTheme();
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [expenses, setExpenses] = useState<PetEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    async function fetchData(pet?: Pet | null, month?: Date) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: petsData } = await supabase
                .from("pets")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });

            if (petsData && petsData.length > 0) {
                setPets(petsData);
                const activePet = pet ?? petsData[0];
                setSelectedPet(activePet);

                const activeMonth = month ?? currentMonth;
                const startOfMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
                const endOfMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0);

                const { data: expensesData } = await supabase
                    .from("events")
                    .select("*")
                    .eq("pet_id", activePet.id)
                    .eq("type", "expense")
                    .gte("timestamp", startOfMonth.toISOString())
                    .lte("timestamp", endOfMonth.toISOString())
                    .order("timestamp", { ascending: false });

                setExpenses(expensesData || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(selectedPet, currentMonth);
    }, [selectedPet, currentMonth]);

    function getTotalThisMonth() {
        return expenses.reduce((sum, e) => sum + (e.metadata?.amount || 0), 0);
    }

    function getCategoryBreakdown() {
        const breakdown: Record<string, number> = {};
        expenses.forEach((e) => {
            const cat = (e.metadata?.category || "other").toLowerCase();
            breakdown[cat] = (breakdown[cat] || 0) + (e.metadata?.amount || 0);
        });
        return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    }

    function changeMonth(direction: number) {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + direction);
        setCurrentMonth(newMonth);
        fetchData(selectedPet, newMonth);
    }

    const total = getTotalThisMonth();
    const breakdown = getCategoryBreakdown();

    const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#000"} />
                }
            >
                <View className="px-5 pt-4 pb-24">

                    {/* Header with month navigator */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className={`text-2xl font-bold ${textClass}`}>Expenses</Text>
                        <View className="flex-row items-center gap-2">
                            <TouchableOpacity onPress={() => changeMonth(-1)}>
                                <Ionicons name="chevron-back" size={20} color={isDark ? "#98989d" : "#000"} />
                            </TouchableOpacity>
                            <Text className={`text-sm font-medium ${textClass}`}>
                                {getMonthName(currentMonth)}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth(1)}>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#98989d" : "#000"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Pet Selector */}
                    {pets.length > 1 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-4"
                        >
                            <View className="flex-row gap-2">
                                {pets.map((pet) => (
                                    <TouchableOpacity
                                        key={pet.id}
                                        onPress={() => fetchData(pet, currentMonth)}
                                        className="px-4 py-2 rounded-full"
                                        style={{
                                            backgroundColor: selectedPet?.id === pet.id ? "#000" : (isDark ? "#1c1c1e" : "#f3f4f6"),
                                        }}
                                    >
                                        <Text
                                            className="text-sm font-medium"
                                            style={{ color: selectedPet?.id === pet.id ? "#fff" : (isDark ? "#98989d" : "#6b7280") }}
                                        >
                                            {pet.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    )}

                    {/* Monthly Total Card */}
                    <View className="rounded-2xl p-5 mb-6 bg-black">
                        <Text className="text-white text-sm opacity-70 mb-1">Total This Month</Text>
                        <Text className="text-white text-4xl font-bold mb-1">
                            ₱{total.toLocaleString()}
                        </Text>
                        <Text className="text-white text-xs opacity-50">
                            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} logged
                        </Text>
                    </View>

                    {/* Category Breakdown with progress bars */}
                    {breakdown.length > 0 && (
                        <View
                            className={`rounded-2xl p-4 mb-6 ${cardBgClass}`}
                            style={{ borderWidth: 1, borderColor: isDark ? "#2c2c2e" : "#f3f4f6" }}
                        >
                            <Text className={`text-base font-semibold ${textClass} mb-4`}>By Category</Text>
                            <View className="gap-4">
                                {breakdown.map(([category, amount]) => (
                                    <View key={category}>
                                        <View className="flex-row items-center mb-2">
                                            <Ionicons
                                                name={CATEGORY_ICONS[category] || "ellipsis-horizontal-outline"}
                                                size={16}
                                                color="#6b7280"
                                                style={{ marginRight: 8 }}
                                            />
                                            <Text className={`flex-1 text-sm font-medium ${textClass} capitalize`}>
                                                {category}
                                            </Text>
                                            <Text className={`text-sm font-bold ${textClass}`}>
                                                ₱{amount.toLocaleString()}
                                            </Text>
                                        </View>
                                        {/* Progress Bar */}
                                        <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <View
                                                className="h-full bg-black rounded-full"
                                                style={{ width: `${Math.round((amount / total) * 100)}%` }}
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Expense History */}
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className={`text-base font-semibold ${textClass}`}>Expense History</Text>
                    </View>

                    {/* Category Filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-4"
                    >
                        <View className="flex-row gap-2">
                            {["all", "food", "vet", "grooming", "medicine", "other"].map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setSelectedCategory(cat)}
                                    className="px-4 py-2 rounded-full"
                                    style={{
                                        backgroundColor: selectedCategory === cat ? "#000" : (isDark ? "#1c1c1e" : "#f3f4f6"),
                                    }}
                                >
                                    <Text
                                        className="text-sm font-medium capitalize"
                                        style={{ color: selectedCategory === cat ? "#fff" : (isDark ? "#98989d" : "#6b7280") }}
                                    >
                                        {cat === "all" ? "All" : cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Filtered Expenses */}
                    {expenses.filter((e) =>
                        selectedCategory === "all"
                            ? true
                            : (e.metadata?.category || "other").toLowerCase() === selectedCategory
                    ).length === 0 ? (
                        <View className="items-center py-8">
                            <Ionicons name="receipt-outline" size={40} color={isDark ? "#2c2c2e" : "#e5e7eb"} />
                            <Text className={`${isDark ? "text-dark-text-tertiary" : "text-gray-300"} mt-2 text-sm`}>No expenses this month</Text>
                            <Text className="text-gray-400 text-xs mt-1">
                                Tap + on Home to log an expense
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-3">
                            {expenses
                                .filter((e) =>
                                    selectedCategory === "all"
                                        ? true
                                        : (e.metadata?.category || "other").toLowerCase() === selectedCategory
                                )
                                .map((expense) => (
                                    <TouchableOpacity
                                        key={expense.id}
                                        className={`flex-row items-center p-4 ${cardBgClass} rounded-2xl`}
                                        style={{ borderWidth: 1, borderColor: isDark ? "#2c2c2e" : "#f3f4f6" }}
                                    >
                                        <View
                                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                            style={{
                                                backgroundColor:
                                                    CATEGORY_COLORS[
                                                    (expense.metadata?.category || "other").toLowerCase()
                                                    ] || "#f3f4f6",
                                            }}
                                        >
                                            <Ionicons
                                                name={
                                                    CATEGORY_ICONS[
                                                    (expense.metadata?.category || "other").toLowerCase()
                                                    ] || "ellipsis-horizontal-outline"
                                                }
                                                size={18}
                                                color="#6b7280"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className={`text-sm font-semibold ${textClass} capitalize`}>
                                                {expense.metadata?.category || "Other"}
                                            </Text>
                                            <Text className={`text-xs ${textSecondaryClass} mt-0.5`}>
                                                {selectedPet?.name} · {formatDate(expense.timestamp)}
                                            </Text>
                                        </View>
                                        <Text className={`text-sm font-bold ${textClass}`}>
                                            ₱{(expense.metadata?.amount || 0).toLocaleString()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                        </View>
                    )}

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}