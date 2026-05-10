import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { usePet } from "../../context/PetContext";
import type { Reminder } from "../../types/index";

function formatDate(timestamp: string) {
    return new Date(timestamp).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

const RECURRENCE_ICONS: Record<string, any> = {
    medication: "medical-outline",
    feeding: "restaurant-outline",
    grooming: "cut-outline",
    vaccine: "fitness-outline",
    general: "notifications-outline",
};

export default function RemindersScreen() {
    const router = useRouter();
    const { selectedPet, pets } = usePet();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    function getPetName(petId: string) {
        return pets.find((p) => p.id === petId)?.name || "";
    }

    async function fetchReminders() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("reminders")
                .select("*")
                .eq("user_id", user.id)
                .order("due_date", { ascending: true });

            setReminders(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchReminders();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchReminders();
    }, []);

    async function markDone(reminder: Reminder) {
        await supabase
            .from("reminders")
            .update({
                is_completed: true,
                completed_at: new Date().toISOString(),
            })
            .eq("id", reminder.id);
        fetchReminders();
    }

    async function toggleRecurring(reminder: Reminder) {
        await supabase
            .from("reminders")
            .update({ is_active: !reminder.is_active })
            .eq("id", reminder.id);
        fetchReminders();
    }

    const upcoming = reminders.filter((r) => !r.is_completed && !r.is_recurring);
    const recurring = reminders.filter((r) => r.is_recurring);
    const completed = reminders.filter((r) => r.is_completed);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#000" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View className="px-5 pt-4 pb-24">

                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-2xl font-bold text-black">Reminders</Text>
                        <TouchableOpacity
                            className="w-9 h-9 rounded-full bg-black items-center justify-center"
                            onPress={() => router.push("/add-reminder")}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Upcoming */}
                    <View className="flex-row items-center gap-2 mb-3">
                        <Text className="text-base font-semibold text-black">Upcoming</Text>
                        {upcoming.length > 0 && (
                            <View className="bg-black rounded-full w-6 h-6 items-center justify-center">
                                <Text className="text-white text-xs font-bold">
                                    {upcoming.length}
                                </Text>
                            </View>
                        )}
                    </View>

                    {upcoming.length === 0 ? (
                        <View
                            className="rounded-2xl p-6 items-center mb-6"
                            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                        >
                            <Ionicons name="checkmark-circle-outline" size={32} color="#9ca3af" />
                            <Text className="text-gray-400 text-sm mt-2">No upcoming reminders</Text>
                        </View>
                    ) : (
                        <View className="gap-3 mb-6">
                            {upcoming.map((reminder) => (
                                <View
                                    key={reminder.id}
                                    className="bg-white rounded-2xl p-4"
                                    style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                                >
                                    <View className="flex-row items-start">
                                        <View
                                            className="w-2.5 h-2.5 rounded-full mt-1.5 mr-3"
                                            style={{ backgroundColor: "#000" }}
                                        />
                                        <View className="flex-1">
                                            <Text className="text-sm font-semibold text-black">
                                                {reminder.title}
                                            </Text>
                                            <View className="flex-row items-center gap-2 mt-1">
                                                <Ionicons name="paw-outline" size={12} color="#9ca3af" />
                                                <Text className="text-xs text-gray-400">
                                                    {getPetName(reminder.pet_id)}
                                                </Text>
                                                <Text className="text-xs text-gray-400">·</Text>
                                                <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                                                <Text className="text-xs text-gray-400">
                                                    {formatDate(reminder.due_date)}
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            className="bg-gray-100 rounded-xl px-3 py-1.5 ml-2"
                                            onPress={() => markDone(reminder)}
                                        >
                                            <Text className="text-xs font-medium text-black">
                                                Mark Done
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Recurring Schedules */}
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-base font-semibold text-black">
                            Recurring Schedules
                        </Text>
                        <TouchableOpacity>
                            <Text className="text-sm text-gray-400">Manage</Text>
                        </TouchableOpacity>
                    </View>

                    {recurring.length === 0 ? (
                        <View
                            className="rounded-2xl p-6 items-center mb-6"
                            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                        >
                            <Ionicons name="repeat-outline" size={32} color="#9ca3af" />
                            <Text className="text-gray-400 text-sm mt-2">
                                No recurring schedules
                            </Text>
                        </View>
                    ) : (
                        <View
                            className="rounded-2xl overflow-hidden bg-white mb-6"
                            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                        >
                            {recurring.map((reminder, index) => (
                                <View
                                    key={reminder.id}
                                    className="flex-row items-center px-4 py-3"
                                    style={{
                                        borderBottomWidth: index < recurring.length - 1 ? 1 : 0,
                                        borderBottomColor: "#f3f4f6",
                                    }}
                                >
                                    <View
                                        className="w-9 h-9 rounded-full items-center justify-center mr-3"
                                        style={{ backgroundColor: "#f3f4f6" }}
                                    >
                                        <Ionicons
                                            name={RECURRENCE_ICONS[reminder.type] || "notifications-outline"}
                                            size={16}
                                            color="#6b7280"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-black">
                                            {reminder.title} — {getPetName(reminder.pet_id)}
                                        </Text>
                                        <Text className="text-xs text-gray-400 mt-0.5">
                                            {reminder.recurrence || "Recurring"}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={reminder.is_active}
                                        onValueChange={() => toggleRecurring(reminder)}
                                        trackColor={{ false: "#f3f4f6", true: "#000" }}
                                        thumbColor="#fff"
                                    />
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Completed */}
                    {completed.length > 0 && (
                        <View>
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-base font-semibold text-black">
                                    Completed
                                </Text>
                                <TouchableOpacity>
                                    <Text className="text-sm text-gray-400">See All</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="gap-3">
                                {completed.slice(0, 2).map((reminder) => (
                                    <View
                                        key={reminder.id}
                                        className="flex-row items-center gap-3 px-4 py-3 bg-white rounded-2xl"
                                        style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                                    >
                                        <View
                                            className="w-7 h-7 rounded-full items-center justify-center"
                                            style={{ backgroundColor: "#f3f4f6" }}
                                        >
                                            <Ionicons name="checkmark" size={14} color="#6b7280" />
                                        </View>
                                        <View className="flex-1">
                                            <Text
                                                className="text-sm text-gray-400"
                                                style={{ textDecorationLine: "line-through" }}
                                            >
                                                {reminder.title} — {getPetName(reminder.pet_id)}
                                            </Text>
                                            <Text className="text-xs text-gray-300 mt-0.5">
                                                Completed{" "}
                                                {reminder.completed_at
                                                    ? formatDate(reminder.completed_at)
                                                    : ""}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Full Empty State */}
                    {reminders.length === 0 && (
                        <View className="items-center py-12">
                            <Ionicons name="notifications-outline" size={48} color="#e5e7eb" />
                            <Text className="text-gray-300 mt-3 text-base font-medium">
                                No reminders yet
                            </Text>
                            <Text className="text-gray-400 text-xs mt-1 text-center">
                                Tap + to add your first reminder
                            </Text>
                        </View>
                    )}

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}