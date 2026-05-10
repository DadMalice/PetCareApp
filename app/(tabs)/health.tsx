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
import { supabase } from "../../lib/supabase";
import { usePet } from "../../context/PetContext";
import type { PetEvent } from "../../types/index";
import { useFocusEffect } from "expo-router";

const HEALTH_TYPES = ["vaccine", "medication", "symptom"];

const EVENT_COLORS: Record<string, string> = {
    medication: "#a855f7",
    vaccine: "#f97316",
    symptom: "#ef4444",
};

const EVENT_ICONS: Record<string, any> = {
    vaccine: "fitness-outline",
    medication: "medical-outline",
    symptom: "alert-circle-outline",
};

function formatDate(timestamp: string) {
    return new Date(timestamp).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatShortDate(timestamp: string) {
    return new Date(timestamp).toLocaleDateString([], {
        month: "short",
        day: "numeric",
    });
}

export default function HealthScreen() {
    const { selectedPet } = usePet();
    const [events, setEvents] = useState<PetEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");

    async function fetchHealthEvents() {
        try {
            if (!selectedPet) return;

            const { data } = await supabase
                .from("events")
                .select("*")
                .eq("pet_id", selectedPet.id)
                .in("type", HEALTH_TYPES)
                .order("timestamp", { ascending: false });

            setEvents(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        fetchHealthEvents();
    }, [selectedPet]);

    useFocusEffect(
        useCallback(() => {
            fetchHealthEvents();
        }, [selectedPet?.id])
    );

    // Summary computations
    function getNextVaccine() {
        return events
            .filter((e) => e.type === "vaccine" && e.metadata?.next_due)
            .sort((a, b) =>
                new Date(a.metadata.next_due).getTime() -
                new Date(b.metadata.next_due).getTime()
            )[0];
    }

    function getActiveMedications() {
        return events.filter((e) => e.type === "medication");
    }

    function getLastVetVisit() {
        return events
            .filter((e) => e.type === "vaccine")
            .sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )[0];
    }

    function getUpcomingSchedule() {
        return events
            .filter((e) => e.type === "vaccine" && e.metadata?.next_due)
            .filter((e) => new Date(e.metadata.next_due) > new Date())
            .sort((a, b) =>
                new Date(a.metadata.next_due).getTime() -
                new Date(b.metadata.next_due).getTime()
            )
            .slice(0, 3);
    }

    function getFilteredEvents() {
        if (activeFilter === "all") return events;
        if (activeFilter === "vaccines") return events.filter((e) => e.type === "vaccine");
        if (activeFilter === "medications") return events.filter((e) => e.type === "medication");
        if (activeFilter === "symptoms") return events.filter((e) => e.type === "symptom");
        return events;
    }

    function formatEventTitle(event: PetEvent) {
        const m = event.metadata;
        switch (event.type) {
            case "vaccine": return `Vaccine — ${m.name || "Unknown"}`;
            case "medication": return `Medication — ${m.name || "Unknown"}`;
            case "symptom": return `Symptom — ${m.name || "Unknown"}`;
            default: return event.type;
        }
    }

    function formatEventSubtitle(event: PetEvent) {
        const m = event.metadata;
        switch (event.type) {
            case "vaccine": return m.notes || (m.next_due ? `Next due: ${formatDate(m.next_due)}` : "");
            case "medication": return m.notes || (m.dose ? `Dose: ${m.dose}` : "");
            case "symptom": return m.notes || (m.severity ? `Severity: ${m.severity}` : "");
            default: return "";
        }
    }

    const nextVaccine = getNextVaccine();
    const activeMeds = getActiveMedications();
    const lastVisit = getLastVetVisit();
    const upcomingSchedule = getUpcomingSchedule();
    const filteredEvents = getFilteredEvents();

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
                    <RefreshControl refreshing={refreshing} onRefresh={fetchHealthEvents} />
                }
            >
                <View className="px-5 pt-4 pb-24">

                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-2xl font-bold text-black">Health</Text>
                        <View
                            className="w-9 h-9 rounded-full items-center justify-center"
                            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                        >
                            <Ionicons name="options-outline" size={18} color="#000" />
                        </View>
                    </View>

                    {/* Summary Cards */}
                    <View className="flex-row gap-3 mb-6">
                        {/* Next Vaccine */}
                        <View
                            className="flex-1 p-3 rounded-2xl bg-white"
                            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                        >
                            <Ionicons name="fitness-outline" size={18} color="#9ca3af" />
                            <Text className="text-xs text-gray-400 mt-2">Next Vaccine</Text>
                            <Text className="text-sm font-bold text-black mt-0.5">
                                {nextVaccine ? nextVaccine.metadata.name : "--"}
                            </Text>
                            <Text className="text-xs text-gray-400">
                                {nextVaccine ? formatShortDate(nextVaccine.metadata.next_due) : "None scheduled"}
                            </Text>
                        </View>

                        {/* Active Meds */}
                        <View
                            className="flex-1 p-3 rounded-2xl bg-white"
                            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                        >
                            <Ionicons name="medical-outline" size={18} color="#9ca3af" />
                            <Text className="text-xs text-gray-400 mt-2">Active Meds</Text>
                            <Text className="text-sm font-bold text-black mt-0.5">
                                {activeMeds.length > 0 ? `${activeMeds.length} active` : "None"}
                            </Text>
                            <Text className="text-xs text-gray-400">
                                {activeMeds[0]?.metadata?.name || "No medications"}
                            </Text>
                        </View>

                        {/* Last Visit */}
                        <View
                            className="flex-1 p-3 rounded-2xl bg-white"
                            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                        >
                            <Ionicons name="medkit-outline" size={18} color="#9ca3af" />
                            <Text className="text-xs text-gray-400 mt-2">Last Visit</Text>
                            <Text className="text-sm font-bold text-black mt-0.5">
                                {lastVisit ? formatShortDate(lastVisit.timestamp) : "--"}
                            </Text>
                            <Text className="text-xs text-gray-400">
                                {lastVisit ? "Checkup" : "No visits yet"}
                            </Text>
                        </View>
                    </View>

                    {/* Upcoming Schedule */}
                    {upcomingSchedule.length > 0 && (
                        <View className="mb-6">
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-base font-semibold text-black">
                                    Upcoming Schedule
                                </Text>
                                <TouchableOpacity>
                                    <Text className="text-sm text-gray-400">See All</Text>
                                </TouchableOpacity>
                            </View>

                            <View
                                className="rounded-2xl overflow-hidden bg-white"
                                style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                            >
                                {upcomingSchedule.map((event, index) => (
                                    <View
                                        key={event.id}
                                        className="flex-row items-center px-4 py-3"
                                        style={{
                                            borderBottomWidth: index < upcomingSchedule.length - 1 ? 1 : 0,
                                            borderBottomColor: "#f3f4f6",
                                        }}
                                    >
                                        <View
                                            className="w-9 h-9 rounded-full items-center justify-center mr-3"
                                            style={{ backgroundColor: "#f3f4f6" }}
                                        >
                                            <Ionicons
                                                name={EVENT_ICONS[event.type]}
                                                size={16}
                                                color="#6b7280"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-sm font-semibold text-black">
                                                {event.metadata?.name || event.type}
                                            </Text>
                                            <Text className="text-xs text-gray-400">
                                                {selectedPet?.name}
                                            </Text>
                                        </View>
                                        <Text className="text-xs text-gray-400">
                                            {formatShortDate(event.metadata.next_due)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Health Timeline */}
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-base font-semibold text-black">
                            Health Timeline
                        </Text>
                    </View>

                    {/* Filter Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-4"
                    >
                        <View className="flex-row gap-2">
                            {[
                                { key: "all", label: "All" },
                                { key: "vaccines", label: "Vaccines" },
                                { key: "medications", label: "Medications" },
                                { key: "symptoms", label: "Symptoms" },
                            ].map((filter) => (
                                <TouchableOpacity
                                    key={filter.key}
                                    onPress={() => setActiveFilter(filter.key)}
                                    className="px-4 py-2 rounded-full"
                                    style={{
                                        backgroundColor: activeFilter === filter.key ? "#000" : "#f3f4f6",
                                    }}
                                >
                                    <Text
                                        className="text-sm font-medium"
                                        style={{
                                            color: activeFilter === filter.key ? "#fff" : "#6b7280",
                                        }}
                                    >
                                        {filter.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Timeline Events */}
                    {filteredEvents.length === 0 ? (
                        <View className="items-center py-8">
                            <Ionicons name="heart-outline" size={40} color="#e5e7eb" />
                            <Text className="text-gray-300 mt-2 text-sm">No health events yet</Text>
                            <Text className="text-gray-400 text-xs mt-1">
                                Log vaccines, medications or symptoms
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-3">
                            {filteredEvents.map((event) => (
                                <View
                                    key={event.id}
                                    className="bg-white rounded-2xl p-4"
                                    style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                                >
                                    <View className="flex-row items-start gap-3">
                                        <View
                                            className="w-2.5 h-2.5 rounded-full mt-1.5"
                                            style={{ backgroundColor: EVENT_COLORS[event.type] }}
                                        />
                                        <View className="flex-1">
                                            <View className="flex-row justify-between items-start">
                                                <Text className="text-sm font-bold text-black">
                                                    {formatEventTitle(event)}
                                                </Text>
                                                <Text className="text-xs text-gray-400">
                                                    {formatShortDate(event.timestamp)}
                                                </Text>
                                            </View>
                                            <Text className="text-xs text-gray-400 mt-1">
                                                {formatEventSubtitle(event)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}