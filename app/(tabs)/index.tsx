import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import PetAvatar from "../components/PetAvatar";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import type { Pet, PetEvent } from "../../types/index";
import { usePet } from "../../context/PetContext";
import { useTheme } from "../../context/ThemeContext";
import EventActionModal from "../components/EventActionModal";

const EVENT_COLORS: Record<string, string> = {
    feeding: "#22c55e",
    expense: "#3b82f6",
    medication: "#a855f7",
    vaccine: "#f97316",
    symptom: "#ef4444",
};

const FILTER_OPTIONS = [
    { key: "all", label: "All", color: "#000", bg: "#f3f4f6" },
    { key: "feeding", label: "Feeding", color: "#16a34a", bg: "#dcfce7" },
    { key: "expense", label: "Expense", color: "#2563eb", bg: "#dbeafe" },
    { key: "medication", label: "Medication", color: "#9333ea", bg: "#f3e8ff" },
    { key: "vaccine", label: "Vaccine", color: "#ea580c", bg: "#ffedd5" },
    { key: "symptom", label: "Symptom", color: "#dc2626", bg: "#fee2e2" },
];

const STATUS_OPTIONS = ["Healthy", "Sick", "Under Medication"];

function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
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
    if (event.type === "expense" && m.date) return m.date;
    if (event.type === "feeding" && m.time) return m.time;
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

function SkeletonBox({ width, height, borderRadius = 8 }: {
    width: number | string;
    height: number;
    borderRadius?: number;
}) {
    const { isDark } = useTheme();
    return (
        <View
            style={{
                width: width as any,
                height,
                borderRadius,
                backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6",
            }}
        />
    );
}

function HomeSkeleton() {
    const { isDark } = useTheme();
    const borderColor = isDark ? "#2c2c2e" : "#f3f4f6";
    return (
        <View className="px-5 pt-4 pb-24">
            <View className="flex-row justify-between items-start mb-6">
                <View className="gap-2">
                    <SkeletonBox width={80} height={12} borderRadius={6} />
                    <SkeletonBox width={140} height={24} borderRadius={8} />
                </View>
                <SkeletonBox width={24} height={24} borderRadius={12} />
            </View>
            <View className="flex-row gap-4 mb-6">
                {[1, 2].map((i) => (
                    <View key={i} className="items-center gap-1">
                        <SkeletonBox width={56} height={56} borderRadius={28} />
                        <SkeletonBox width={36} height={10} borderRadius={5} />
                    </View>
                ))}
            </View>
            <View
                className="rounded-2xl p-4 mb-6"
                style={{ borderWidth: 1, borderColor }}
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
            <View className="flex-row gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} className="flex-1 items-center gap-1">
                        <SkeletonBox width={48} height={48} borderRadius={16} />
                        <SkeletonBox width={36} height={10} borderRadius={5} />
                    </View>
                ))}
            </View>
            <View className="flex-row justify-between items-center mb-4">
                <SkeletonBox width={80} height={18} borderRadius={6} />
                <SkeletonBox width={50} height={12} borderRadius={6} />
            </View>
            {[1, 2, 3].map((i) => (
                <View
                    key={i}
                    className="rounded-2xl p-4 mb-3"
                    style={{ borderWidth: 1, borderColor }}
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
    const { isDark } = useTheme();
    const [events, setEvents] = useState<PetEvent[]>([]);
    const [userName, setUserName] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [displayPet, setDisplayPet] = useState<Pet | null>(null);
    const [activeFilter, setActiveFilter] = useState("all");
    const [viewAll, setViewAll] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<PetEvent | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);

    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            const dateA = new Date(getEventTimestamp(a)).getTime();
            const dateB = new Date(getEventTimestamp(b)).getTime();
            return dateB - dateA;
        });
    }, [events]);

    const filteredEvents = useMemo(() => {
        if (activeFilter === "all") return sortedEvents;
        return sortedEvents.filter((e) => e.type === activeFilter);
    }, [sortedEvents, activeFilter]);

    const displayEvents = useMemo(() => {
        return viewAll ? filteredEvents.slice(0, 50) : filteredEvents.slice(0, 10);
    }, [filteredEvents, viewAll]);

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
                .limit(50);

            setEvents(eventsData || []);
            setDisplayPet(activePet);
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

    async function updatePetStatus(status: string) {
        if (!selectedPet) return;
        setUpdatingStatus(true);
        try {
            await supabase.from("pets").update({ status }).eq("id", selectedPet.id);
            await refreshPets();
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingStatus(false);
            setShowStatusModal(false);
        }
    }

    useEffect(() => {
        fetchUserName();
    }, []);

    useEffect(() => {
        if (selectedPet) fetchEvents();
        else setLoading(false);
    }, [selectedPet?.id]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        refreshPets();
        fetchEvents();
    }, [selectedPet]);

    function switchPet(pet: Pet) {
        setViewAll(false);
        setActiveFilter("all");
        setSelectedPet(pet);
    }

    function getStatusColor(status: string) {
        switch (status) {
            case "Healthy": return { bg: "#dcfce7", dot: "#22c55e", text: "#16a34a" };
            case "Sick": return { bg: "#fee2e2", dot: "#ef4444", text: "#dc2626" };
            case "Under Medication": return { bg: "#ffedd5", dot: "#f97316", text: "#ea580c" };
            default: return { bg: "#dcfce7", dot: "#22c55e", text: "#16a34a" };
        }
    }

    if (loading || petsLoading) {
        return (
            <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-white"}`}>
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <HomeSkeleton />
                </ScrollView>
            </SafeAreaView>
        );
    }

    const statusColors = getStatusColor(selectedPet?.status || "Healthy");

    const bgClass = isDark ? "bg-dark-bg" : "bg-white";
    const cardBgClass = isDark ? "bg-dark-card" : "bg-white";
    const borderClass = isDark ? "border-dark-border" : "border-gray-100";
    const textClass = isDark ? "text-dark-text" : "text-black";
    const textSecondaryClass = isDark ? "text-dark-text-secondary" : "text-gray-400";
    const textTertiaryClass = isDark ? "text-dark-text-tertiary" : "text-gray-300";
    const pillBgClass = isDark ? "bg-dark-card" : "bg-gray-50";
    const pillBorderClass = isDark ? "border-dark-border" : "border-gray-100";

    return (
        <SafeAreaView className={`flex-1 ${bgClass}`}>

            {/* Fixed Top Section */}
            <View className="px-5 pt-4">

                {/* Header */}
                <View className="flex-row justify-between items-start mb-6">
                    <View>
                        <Text className={`${textSecondaryClass} text-sm`}>{getGreeting()}</Text>
                        <Text className={`text-2xl font-bold ${textClass}`}>Hi, {userName}</Text>
                    </View>
                    <TouchableOpacity className="mt-1">
                        <Ionicons name="search-outline" size={24} color={isDark ? "#98989d" : "#000"} />
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
                                style={{
                                    borderWidth: selectedPet?.id === pet.id ? 2 : 0,
                                    borderColor: isDark ? "#fff" : "#000",
                                    borderRadius: 28,
                                }}
                            >
                                <PetAvatar photoUrl={pet.photo_url} size={56} />
                            </View>
                            <Text
                                className="text-xs mt-1"
                                style={{
                                    fontWeight: selectedPet?.id === pet.id ? "600" : "400",
                                    color: selectedPet?.id === pet.id
                                        ? (isDark ? "#f5f5f7" : "#000")
                                        : "#9ca3af",
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
                        <View className={`w-14 h-14 rounded-full items-center justify-center ${isDark ? "bg-dark-card" : "bg-gray-100"}`}>
                            <Ionicons name="add" size={28} color="#9ca3af" />
                        </View>
                        <Text className="text-xs mt-1 text-gray-400">Add</Text>
                    </TouchableOpacity>
                </View>

                {/* Pet Summary Card */}
                {selectedPet ? (
                    <View
                        className={`rounded-2xl p-4 mb-6 ${cardBgClass}`}
                        style={{ borderWidth: 1, borderColor: isDark ? "#2c2c2e" : "#f3f4f6" }}
                    >
                        <View className="flex-row items-center gap-4">
                            <PetAvatar photoUrl={selectedPet.photo_url} size={64} />
                            <View className="flex-1">
                                <View className="flex-row items-center gap-2 mb-1">
                                    <Text className={`text-lg font-bold ${textClass}`}>{selectedPet.name}</Text>

                                    {/* Interactive Status Badge */}
                                    <TouchableOpacity
                                        onPress={() => setShowStatusModal(true)}
                                        className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: statusColors.bg }}
                                    >
                                        <View
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: statusColors.dot }}
                                        />
                                        <Text
                                            className="text-xs font-medium"
                                            style={{ color: statusColors.text }}
                                        >
                                            {selectedPet.status}
                                        </Text>
                                        <Ionicons name="chevron-down" size={10} color={statusColors.text} />
                                    </TouchableOpacity>
                                </View>
                                <Text className={`${textSecondaryClass} text-sm mb-2`}>{selectedPet.breed}</Text>
                                <View className="flex-row gap-4">
                                    <View>
                                        <Text className={`text-xs ${textSecondaryClass}`}>Age</Text>
                                        <Text className={`text-sm font-semibold ${textClass}`}>{selectedPet.age_years}y</Text>
                                    </View>
                                    <View>
                                        <Text className={`text-xs ${textSecondaryClass}`}>Weight</Text>
                                        <Text className={`text-sm font-semibold ${textClass}`}>{selectedPet.weight_kg}kg</Text>
                                    </View>
                                    <View>
                                        <Text className={`text-xs ${textSecondaryClass}`}>Gender</Text>
                                        <Text className={`text-sm font-semibold ${textClass}`}>{selectedPet.gender}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        className={`border-2 border-dashed rounded-2xl p-6 mb-6 items-center ${isDark ? "border-dark-border" : "border-gray-200"}`}
                        onPress={() => router.push("/add-pet")}
                    >
                        <Ionicons name="paw-outline" size={32} color="#9ca3af" />
                        <Text className="text-gray-400 mt-2 text-sm">No pets yet</Text>
                        <Text className={`font-semibold mt-1 ${textClass}`}>+ Add your first pet</Text>
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
                    <Text className={`text-lg font-bold ${textClass}`}>Timeline</Text>
                    {filteredEvents.length > 10 && (
                        <TouchableOpacity onPress={() => setViewAll(!viewAll)}>
                            <Text className="text-sm text-gray-400">
                                {viewAll ? "Show Less" : "View All"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-3"
                >
                    <View className="flex-row gap-2 pb-1">
                        {FILTER_OPTIONS.map((filter) => {
                            const isActive = activeFilter === filter.key;
                            return (
                                <TouchableOpacity
                                    key={filter.key}
                                    onPress={() => {
                                        setActiveFilter(filter.key);
                                        setViewAll(false);
                                    }}
                                    className="px-4 py-2 rounded-full"
                                    style={{
                                        backgroundColor: isActive ? filter.bg : (isDark ? "#1c1c1e" : "#f9fafb"),
                                        borderWidth: 1,
                                        borderColor: isActive ? filter.color : (isDark ? "#2c2c2e" : "#f3f4f6"),
                                    }}
                                >
                                    <Text
                                        className="text-sm font-medium"
                                        style={{
                                            color: isActive ? filter.color : (isDark ? "#98989d" : "#9ca3af"),
                                        }}
                                    >
                                        {filter.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

            </View>

            {/* Scrollable Timeline */}
            <ScrollView
                className={`flex-1 px-5`}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#000"} />
                }
            >
                <View className="gap-3 pb-24">
                    {displayEvents.length === 0 ? (
                        <View className="items-center py-8">
                            <Ionicons name="time-outline" size={40} color={isDark ? "#2c2c2e" : "#e5e7eb"} />
                            <Text className={`${textTertiaryClass} mt-2 text-sm`}>
                                {activeFilter === "all" ? "No events yet" : `No ${activeFilter} events`}
                            </Text>
                            <Text className="text-gray-400 text-xs mt-1">
                                Tap + to log your first event
                            </Text>
                        </View>
                    ) : (
                        <>
                            {displayEvents.map((event) => (
                                <TouchableOpacity
                                    key={event.id}
                                    className={`${cardBgClass} rounded-2xl p-4`}
                                    style={{ borderWidth: 1, borderColor: isDark ? "#2c2c2e" : "#f3f4f6" }}
                                    onPress={() => handleEventPress(event)}
                                >
                                    <View className="flex-row items-start gap-3">
                                        <View
                                            className="w-2.5 h-2.5 rounded-full mt-1.5"
                                            style={{ backgroundColor: EVENT_COLORS[event.type] }}
                                        />
                                        <View className="flex-1">
                                            <View className="flex-row justify-between items-start">
                                                <Text className={`text-xs ${textSecondaryClass} capitalize`}>{event.type}</Text>
                                                <Text className={`text-xs ${textSecondaryClass}`}>
                                                    {formatTime(getEventTimestamp(event))}
                                                </Text>
                                            </View>
                                            <Text className={`text-sm font-semibold ${textClass} mt-0.5`}>
                                                {formatEventTitle(event)}
                                            </Text>
                                            <Text className={`text-xs ${textSecondaryClass} mt-0.5`}>
                                                {formatEventSubtitle(event, displayPet?.name || "")}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}

                            {/* Show Less at bottom when expanded */}
                            {viewAll && filteredEvents.length > 10 && (
                                <TouchableOpacity
                                    className="items-center py-3"
                                    onPress={() => setViewAll(false)}
                                >
                                    <Text className="text-sm text-gray-400">Show Less</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                className={`absolute bottom-6 right-5 w-14 h-14 rounded-full items-center justify-center shadow-lg ${isDark ? "bg-dark-text" : "bg-black"}`}
                onPress={() => router.push("/add-event")}
            >
                <Ionicons name="add" size={28} color={isDark ? "#000" : "white"} />
            </TouchableOpacity>

            {/* Status Update Modal */}
            <Modal
                visible={showStatusModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowStatusModal(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/30"
                    activeOpacity={1}
                    onPress={() => setShowStatusModal(false)}
                >
                    <View
                        className={`mx-5 mt-64 rounded-2xl overflow-hidden ${cardBgClass}`}
                        style={{ elevation: 10 }}
                    >
                        <Text className={`text-sm font-semibold ${textSecondaryClass} px-4 pt-4 pb-2`}>
                            Update Status
                        </Text>
                        {STATUS_OPTIONS.map((status, index) => {
                            const colors = getStatusColor(status);
                            const isSelected = selectedPet?.status === status;
                            return (
                                <TouchableOpacity
                                    key={status}
                                    className="px-4 py-3 flex-row items-center justify-between"
                                    style={{
                                        borderBottomWidth: index < STATUS_OPTIONS.length - 1 ? 1 : 0,
                                        borderBottomColor: isDark ? "#2c2c2e" : "#f3f4f6",
                                        backgroundColor: isSelected ? (isDark ? "#2c2c2e" : "#f9fafb") : "transparent",
                                    }}
                                    onPress={() => updatePetStatus(status)}
                                    disabled={updatingStatus}
                                >
                                    <View className="flex-row items-center gap-2">
                                        <View
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: colors.dot }}
                                        />
                                        <Text className={`text-sm ${textClass}`}>{status}</Text>
                                    </View>
                                    {isSelected && (
                                        <Ionicons name="checkmark" size={16} color={isDark ? "#f5f5f7" : "#000"} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>

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