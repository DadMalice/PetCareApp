import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import type { Pet, PetEvent } from "../../types/index";
import { usePet } from "../../context/PetContext";
import EventActionModal from "../components/EventActionModal";

const EVENT_COLORS: Record<string, string> = {
    feeding: "#22c55e",
    expense: "#3b82f6",
    medication: "#a855f7",
    vaccine: "#f97316",
    symptom: "#ef4444",
};

function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();

    // Compare dates only (ignore time) to avoid timezone issues
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMs = nowOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getEventTimestamp(event: PetEvent): string {
    const m = event.metadata;
    // Expense events store the actual date in metadata.date
    if (event.type === "expense" && m.date) return m.date;
    // Feeding events store the actual time in metadata.time
    if (event.type === "feeding" && m.time) return m.time;
    // All other events use the database row timestamp
    return event.timestamp;
}

function formatEventTitle(event: PetEvent) {
    const m = event.metadata;
    switch (event.type) {
        case "feeding": return `${m.food_type || "Feeding"} · ${m.quantity || ""} ${m.unit || ""}`;
        case "expense": return `${m.category || "Expense"} · ₱${m.amount || 0}`;
        case "medication": return `${m.name || "Medication"} · ${m.dose || ""}`;
        case "vaccine": return `${m.name || "Vaccine"}`;
        case "symptom": return `${m.name || "Symptom"} · ${m.severity || ""}`;
        default: return event.type;
    }
}

function formatEventSubtitle(event: PetEvent, petName: string) {
    const m = event.metadata;
    if (m.notes) return m.notes;
    switch (event.type) {
        case "feeding": return `Meal for ${petName}`;
        case "expense": return `${m.category || ""} expense`;
        case "medication": return `Given to ${petName}`;
        case "vaccine": return m.next_due ? `Next due: ${m.next_due}` : `Administered to ${petName}`;
        case "symptom": return `Observed in ${petName}`;
        default: return "";
    }
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

function SkeletonBox({ width, height, borderRadius = 8 }: { width: number | string, height: number, borderRadius?: number }) {
    return (
        <View
            style={{
                width: width as any,
                height,
                borderRadius,
                backgroundColor: "#f3f4f6",
            }}
        />
    );
}

function HomeSkeleton() {
    return (
        <View className="px-5 pt-4 pb-24">

            {/* Header Skeleton */}
            <View className="flex-row justify-between items-start mb-6">
                <View className="gap-2">
                    <SkeletonBox width={80} height={12} borderRadius={6} />
                    <SkeletonBox width={140} height={24} borderRadius={8} />
                </View>
                <SkeletonBox width={24} height={24} borderRadius={12} />
            </View>

            {/* Pet Selector Skeleton */}
            <View className="flex-row gap-4 mb-6">
                {[1, 2].map((i) => (
                    <View key={i} className="items-center gap-1">
                        <SkeletonBox width={56} height={56} borderRadius={28} />
                        <SkeletonBox width={36} height={10} borderRadius={5} />
                    </View>
                ))}
            </View>

            {/* Pet Summary Card Skeleton */}
            <View
                className="rounded-2xl p-4 mb-6"
                style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
            >
                <View className="flex-row items-center gap-4">
                    <SkeletonBox width={64} height={64} borderRadius={32} />
                    <View className="flex-1 gap-2">
                        <SkeletonBox width={120} height={16} borderRadius={6} />
                        <SkeletonBox width={90} height={12} borderRadius={6} />
                        <View className="flex-row gap-4 mt-1">
                            <SkeletonBox width={40} height={28} borderRadius={6} />
                            <SkeletonBox width={40} height={28} borderRadius={6} />
                            <SkeletonBox width={40} height={28} borderRadius={6} />
                        </View>
                    </View>
                </View>
            </View>

            {/* Quick Actions Skeleton */}
            <View className="flex-row gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} className="flex-1 items-center gap-1">
                        <SkeletonBox width={48} height={48} borderRadius={16} />
                        <SkeletonBox width={36} height={10} borderRadius={5} />
                    </View>
                ))}
            </View>

            {/* Timeline Header Skeleton */}
            <View className="flex-row justify-between items-center mb-4">
                <SkeletonBox width={80} height={18} borderRadius={6} />
                <SkeletonBox width={50} height={12} borderRadius={6} />
            </View>

            {/* Timeline Event Skeletons */}
            {[1, 2, 3].map((i) => (
                <View
                    key={i}
                    className="rounded-2xl p-4 mb-3"
                    style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                >
                    <View className="flex-row items-start gap-3">
                        <SkeletonBox width={10} height={10} borderRadius={5} />
                        <View className="flex-1 gap-2">
                            <View className="flex-row justify-between">
                                <SkeletonBox width={60} height={10} borderRadius={5} />
                                <SkeletonBox width={50} height={10} borderRadius={5} />
                            </View>
                            <SkeletonBox width="80%" height={14} borderRadius={6} />
                            <SkeletonBox width="60%" height={10} borderRadius={5} />
                        </View>
                    </View>
                </View>
            ))}

        </View>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const { pets, selectedPet, setSelectedPet, refreshPets, petsLoading } = usePet();
    const [events, setEvents] = useState<PetEvent[]>([]);
    const [userName, setUserName] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [displayPet, setDisplayPet] = useState<Pet | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<PetEvent | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);

    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            const dateA = new Date(getEventTimestamp(a)).getTime();
            const dateB = new Date(getEventTimestamp(b)).getTime();
            return dateB - dateA; // newest first
        });
    }, [events]);

    async function deleteEvent(eventId: string) {
        try {
            await supabase.from("events").delete().eq("id", eventId);
            setEvents((prev) => prev.filter((e) => e.id !== eventId));
        } catch (err) {
            console.error(err);
        }
    }

    function handleEventPress(event: PetEvent) {
        setSelectedEvent(event);
        setShowActionModal(true);
    }

    async function fetchEvents(pet?: Pet | null) {
        try {
            const activePet = pet ?? selectedPet;
            if (!activePet) {
                setLoading(false);
                return;
            }

            const { data: eventsData } = await supabase
                .from("events")
                .select("*")
                .eq("pet_id", activePet.id)
                .order("timestamp", { ascending: false })
                .limit(10);

            setEvents(eventsData || []);
            setDisplayPet(activePet); // ← only update after events are ready
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    async function fetchUserName() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const name = user.user_metadata?.full_name?.split(" ")[0] || "there";
        setUserName(name);
    }

    useEffect(() => {
        fetchUserName();
    }, []);

    useEffect(() => {
        if (selectedPet) fetchEvents();
        else setLoading(false);
    }, [selectedPet]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        refreshPets();
        fetchEvents();
    }, [selectedPet]);

    function switchPet(pet: Pet) {
        setSelectedPet(pet);
    }

    if (loading || petsLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <HomeSkeleton />
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">

            {/* Fixed Top Section */}
            <View className="px-5 pt-4">

                {/* Header */}
                <View className="flex-row justify-between items-start mb-6">
                    <View>
                        <Text className="text-gray-400 text-sm">{getGreeting()}</Text>
                        <Text className="text-2xl font-bold text-black">Hi, {userName}</Text>
                    </View>
                    <TouchableOpacity className="mt-1">
                        <Ionicons name="search-outline" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Pet Selector */}
                <View className="flex-row items-center gap-4 mb-6">
                    {pets.map((pet) => (
                        <TouchableOpacity
                            key={pet.id}
                            className="items-center"
                            onPress={() => switchPet(pet)}
                        >
                            <View
                                className="w-14 h-14 rounded-full bg-amber-200 items-center justify-center"
                                style={{
                                    borderWidth: selectedPet?.id === pet.id ? 2 : 0,
                                    borderColor: "#000",
                                }}
                            >
                                <MaterialCommunityIcons name="dog" size={28} color="#000" />
                            </View>
                            <Text
                                className="text-xs mt-1"
                                style={{
                                    fontWeight: selectedPet?.id === pet.id ? "600" : "400",
                                    color: selectedPet?.id === pet.id ? "#000" : "#9ca3af",
                                }}
                            >
                                {pet.name}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        className="items-center"
                        onPress={() => router.push("/add-pet")}
                    >
                        <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center">
                            <Ionicons name="add" size={28} color="#9ca3af" />
                        </View>
                        <Text className="text-xs mt-1 text-gray-400">Add</Text>
                    </TouchableOpacity>
                </View>

                {/* Pet Summary Card */}
                {selectedPet ? (
                    <View
                        className="rounded-2xl p-4 mb-6"
                        style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                    >
                        <View className="flex-row items-center gap-4">
                            <View className="w-16 h-16 rounded-full bg-amber-200 items-center justify-center">
                                <MaterialCommunityIcons name="dog" size={32} color="#000" />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center gap-2 mb-1">
                                    <Text className="text-lg font-bold text-black">{selectedPet.name}</Text>
                                    <View className="bg-green-100 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                                        <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        <Text className="text-green-700 text-xs font-medium">{selectedPet.status}</Text>
                                    </View>
                                </View>
                                <Text className="text-gray-400 text-sm mb-2">{selectedPet.breed}</Text>
                                <View className="flex-row gap-4">
                                    <View>
                                        <Text className="text-xs text-gray-400">Age</Text>
                                        <Text className="text-sm font-semibold text-black">{selectedPet.age_years}y</Text>
                                    </View>
                                    <View>
                                        <Text className="text-xs text-gray-400">Weight</Text>
                                        <Text className="text-sm font-semibold text-black">{selectedPet.weight_kg}kg</Text>
                                    </View>
                                    <View>
                                        <Text className="text-xs text-gray-400">Gender</Text>
                                        <Text className="text-sm font-semibold text-black">{selectedPet.gender}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        className="border-2 border-dashed border-gray-200 rounded-2xl p-6 mb-6 items-center"
                        onPress={() => router.push("/add-pet")}
                    >
                        <Ionicons name="paw-outline" size={32} color="#9ca3af" />
                        <Text className="text-gray-400 mt-2 text-sm">No pets yet</Text>
                        <Text className="text-black font-semibold mt-1">+ Add your first pet</Text>
                    </TouchableOpacity>
                )}

                {/* Quick Actions */}
                <View className="flex-row gap-3 mb-6">
                    {[
                        { label: "Expense", icon: "cash-outline", color: "#dbeafe", type: "expense" },
                        { label: "Feeding", icon: "restaurant-outline", color: "#dcfce7", type: "feeding" },
                        { label: "Medication", icon: "medical-outline", color: "#f3e8ff", type: "medication" },
                        { label: "Vaccine", icon: "fitness-outline", color: "#ffedd5", type: "vaccine" },
                        { label: "Symptom", icon: "alert-circle-outline", color: "#fee2e2", type: "symptom" },
                    ].map((action) => (
                        <TouchableOpacity
                            key={action.label}
                            className="flex-1 items-center"
                            onPress={() => router.push(`/add-event?type=${action.type}`)}
                        >
                            <View
                                className="w-12 h-12 rounded-2xl items-center justify-center mb-1"
                                style={{ backgroundColor: action.color }}
                            >
                                <Ionicons name={action.icon as any} size={22} color="#555" />
                            </View>
                            <Text className="text-xs text-gray-500 text-center">{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Timeline Header */}
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-lg font-bold text-black">Timeline</Text>
                    <TouchableOpacity>
                        <Text className="text-sm text-gray-400">View all</Text>
                    </TouchableOpacity>
                </View>

            </View>

            {/* Scrollable Timeline Only */}
            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View className="gap-3 pb-24">
                    {sortedEvents.length === 0 ? (
                        <View className="items-center py-8">
                            <Ionicons name="time-outline" size={40} color="#e5e7eb" />
                            <Text className="text-gray-300 mt-2 text-sm">No events yet</Text>
                            <Text className="text-gray-400 text-xs mt-1">Tap + to log your first event</Text>
                        </View>
                    ) : (
                        sortedEvents.map((event) => (
                            <TouchableOpacity
                                key={event.id}
                                className="bg-white rounded-2xl p-4"
                                style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                                onPress={() => handleEventPress(event)}
                            >
                                <View className="flex-row items-start gap-3">
                                    <View
                                        className="w-2.5 h-2.5 rounded-full mt-1.5"
                                        style={{ backgroundColor: EVENT_COLORS[event.type] }}
                                    />
                                    <View className="flex-1">
                                        <View className="flex-row justify-between items-start">
                                            <Text className="text-xs text-gray-400 capitalize">{event.type}</Text>
                                            <Text className="text-xs text-gray-400">{formatTime(getEventTimestamp(event))}</Text>
                                        </View>
                                        <Text className="text-sm font-semibold text-black mt-0.5">
                                            {formatEventTitle(event)}
                                        </Text>
                                        <Text className="text-xs text-gray-400 mt-0.5">
                                            {formatEventSubtitle(event, displayPet?.name || "")}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                className="absolute bottom-6 right-5 w-14 h-14 bg-black rounded-full items-center justify-center shadow-lg"
                onPress={() => router.push("/add-event")}
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>

            {/* Event Action Modal */}
            <EventActionModal
                visible={showActionModal}
                event={selectedEvent}
                onClose={() => {
                    setShowActionModal(false);
                    setSelectedEvent(null);
                }}
                onDelete={deleteEvent}
            />

        </SafeAreaView>
    );
}