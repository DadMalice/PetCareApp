import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { usePet } from "../context/PetContext";
import { useTheme } from "../context/ThemeContext";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { StatusBar } from "expo-status-bar";

export default function AddReminderScreen() {
    const router = useRouter();
    const { pets } = usePet();
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrence, setRecurrence] = useState("");
    const [type, setType] = useState("general");
    const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || "");
    const [showPetDropdown, setShowPetDropdown] = useState(false);

    const bgClass = isDark ? "bg-dark-bg" : "bg-white";
    const textClass = isDark ? "text-dark-text" : "text-black";
    const textSecondaryClass = isDark ? "text-dark-text-secondary" : "text-gray-400";
    const inputBgClass = isDark ? "bg-dark-card" : "bg-gray-100";
    const inputTextClass = isDark ? "text-dark-text" : "text-black";
    const cardBgClass = isDark ? "bg-dark-card" : "bg-white";

    async function handleSave() {
        if (!title) {
            setError("Title is required.");
            return;
        }
        if (!selectedPetId) {
            setError("Please select a pet first.");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            const { error } = await supabase.from("reminders").insert({
                user_id: user.id,
                pet_id: selectedPetId,
                title,
                type,
                due_date: dueDate.toISOString(),
                is_recurring: isRecurring,
                recurrence: isRecurring ? recurrence : null,
                is_active: true,
                is_completed: false,
            });

            if (error) throw error;
            router.replace("/(tabs)/reminders");
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    }

    return (
        <SafeAreaView className={`flex-1 ${bgClass}`}>
            <StatusBar style={isDark ? "light" : "dark"} />
            <KeyboardAwareScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={100}
            >
                <View className="px-5 pt-4 pb-24">

                    {/* Header */}
                    <View className="flex-row items-center gap-3 mb-8">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color={isDark ? "#f5f5f7" : "#000"} />
                        </TouchableOpacity>
                        <Text className={`text-2xl font-bold ${textClass}`}>Add Reminder</Text>
                    </View>

                    {/* Pet Selector */}
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>Pet</Text>
                    <View className="flex-row flex-wrap gap-2 mb-4">
                        {pets.map((pet) => (
                            <TouchableOpacity
                                key={pet.id}
                                onPress={() => setSelectedPetId(pet.id)}
                                className="px-4 py-2 rounded-full flex-row items-center gap-2"
                                style={{
                                    backgroundColor: selectedPetId === pet.id ? "#000" : (isDark ? "#1c1c1e" : "#f3f4f6"),
                                }}
                            >
                                <Ionicons
                                    name="paw-outline"
                                    size={14}
                                    color={selectedPetId === pet.id ? "#fff" : "#9ca3af"}
                                />
                                <Text
                                    className="text-sm font-medium"
                                    style={{ color: selectedPetId === pet.id ? "#fff" : (isDark ? "#98989d" : "#6b7280") }}
                                >
                                    {pet.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Title */}
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>Title</Text>
                    <TextInput
                        className={`${inputBgClass} rounded-xl px-4 py-3 ${inputTextClass} text-sm mb-4`}
                        placeholder="e.g. Rabies Vaccine Due"
                        placeholderTextColor="#9ca3af"
                        value={title}
                        onChangeText={setTitle}
                    />

                    {/* Type */}
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>Type</Text>
                    <View className="flex-row flex-wrap gap-2 mb-4">
                        {[
                            { key: "general", label: "General", icon: "notifications-outline" },
                            { key: "medication", label: "Medication", icon: "medical-outline" },
                            { key: "vaccine", label: "Vaccine", icon: "fitness-outline" },
                            { key: "feeding", label: "Feeding", icon: "restaurant-outline" },
                            { key: "grooming", label: "Grooming", icon: "cut-outline" },
                        ].map((t) => (
                            <TouchableOpacity
                                key={t.key}
                                onPress={() => setType(t.key)}
                                className="px-4 py-2 rounded-full flex-row items-center gap-2"
                                style={{
                                    backgroundColor: type === t.key ? "#000" : (isDark ? "#1c1c1e" : "#f3f4f6"),
                                }}
                            >
                                <Ionicons
                                    name={t.icon as any}
                                    size={14}
                                    color={type === t.key ? "#fff" : "#9ca3af"}
                                />
                                <Text
                                    className="text-sm font-medium"
                                    style={{ color: type === t.key ? "#fff" : (isDark ? "#98989d" : "#6b7280") }}
                                >
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Due Date */}
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>Due Date</Text>
                    <TouchableOpacity
                        className={`${inputBgClass} rounded-xl px-4 py-3 flex-row items-center gap-2 mb-4`}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                        <Text className={`text-sm ${textClass}`}>
                            {dueDate.toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={dueDate}
                            mode="date"
                            display="default"
                            onChange={(_event: DateTimePickerEvent, date?: Date) => {
                                setShowDatePicker(false);
                                if (date) setDueDate(date);
                            }}
                        />
                    )}

                    {/* Recurring Toggle */}
                    <View
                        className={`flex-row items-center justify-between p-4 rounded-2xl mb-4 ${cardBgClass}`}
                        style={{ borderWidth: 1, borderColor: isDark ? "#2c2c2e" : "#f3f4f6" }}
                    >
                        <View>
                            <Text className={`text-sm font-medium ${textClass}`}>Recurring</Text>
                            <Text className={`text-xs ${textSecondaryClass}`}>Repeat this reminder</Text>
                        </View>
                        <Switch
                            value={isRecurring}
                            onValueChange={setIsRecurring}
                            trackColor={{ false: "#f3f4f6", true: "#000" }}
                            thumbColor="#fff"
                        />
                    </View>

                    {/* Recurrence Text */}
                    {isRecurring && (
                        <View className="mb-4">
                            <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>
                                Recurrence Description
                            </Text>
                            <TextInput
                                className={`${inputBgClass} rounded-xl px-4 py-3 ${inputTextClass} text-sm`}
                                placeholder="e.g. Every day at 8:00 AM"
                                placeholderTextColor="#9ca3af"
                                value={recurrence}
                                onChangeText={setRecurrence}
                            />
                        </View>
                    )}

                    {/* Error */}
                    {error ? (
                        <Text className="text-red-500 text-sm text-center mt-2">{error}</Text>
                    ) : null}

                </View>
            </KeyboardAwareScrollView>

            {/* Save Button */}
            <View className={`absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 ${bgClass} border-t ${isDark ? "border-dark-border" : "border-gray-100"}`}>
                <TouchableOpacity
                    className="bg-black rounded-xl py-4 items-center"
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-semibold text-base">
                            Save Reminder
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}