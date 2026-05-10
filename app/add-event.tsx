import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLocalSearchParams } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { usePet } from "../context/PetContext";


const EVENT_TYPES = [
    { type: "feeding", label: "Feeding", icon: "restaurant-outline", color: "#dcfce7", iconColor: "#16a34a" },
    { type: "expense", label: "Expense", icon: "cash-outline", color: "#dbeafe", iconColor: "#2563eb" },
    { type: "medication", label: "Medication", icon: "medical-outline", color: "#f3e8ff", iconColor: "#9333ea" },
    { type: "vaccine", label: "Vaccine", icon: "fitness-outline", color: "#ffedd5", iconColor: "#ea580c" },
    { type: "symptom", label: "Symptom", icon: "alert-circle-outline", color: "#fee2e2", iconColor: "#dc2626" },
];

export default function AddEventScreen() {
    const router = useRouter();
    const { type } = useLocalSearchParams<{ type: string }>();
    const [selectedType, setSelectedType] = useState<string | null>(type || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form fields
    const [notes, setNotes] = useState("");
    // Feeding
    const [foodType, setFoodType] = useState("");
    const [feedingQuantity, setFeedingQuantity] = useState("");
    const [feedingUnit, setFeedingUnit] = useState("cup");
    const [feedingTime, setFeedingTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);
    // Expense
    const [expenseCategory, setExpenseCategory] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseDescription, setExpenseDescription] = useState("");
    const [expenseDate, setExpenseDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    // Medication
    const [medName, setMedName] = useState("");
    const [medDose, setMedDose] = useState("");
    // Vaccine
    const [vaccineName, setVaccineName] = useState("");
    const [nextDue, setNextDue] = useState("");
    // Symptom
    const [symptomName, setSymptomName] = useState("");
    const [severity, setSeverity] = useState("");

    function buildMetadata() {
        switch (selectedType) {
            case "feeding":
                return {
                    food_type: foodType,
                    quantity: feedingQuantity,
                    unit: feedingUnit,
                    time: feedingTime.toISOString(),
                    notes,
                };
            case "expense":
                return {
                    category: expenseCategory,
                    amount: parseFloat(expenseAmount),
                    description: expenseDescription,
                    notes,
                    date: expenseDate.toISOString(),
                };
            case "medication":
                return { name: medName, dose: medDose, notes };
            case "vaccine":
                return { name: vaccineName, next_due: nextDue, notes };
            case "symptom":
                return { name: symptomName, severity, notes };
            default:
                return {};
        }
    }

    async function handleSave() {
        if (!selectedType) return;
        setLoading(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            if (!selectedPet) {
                setError("Please add a pet first before logging events.");
                setLoading(false);
                return;
            }

            const { error } = await supabase.from("events").insert({
                pet_id: selectedPet.id,  // ← uses context selected pet
                user_id: user.id,
                type: selectedType,
                metadata: buildMetadata(),
            });

            if (error) throw error;
            router.replace("/(tabs)");
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    }

    const { selectedPet } = usePet();

    return (
        <SafeAreaView className="flex-1 bg-white">
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
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-black">Add Event</Text>
                    </View>

                    {/* Event Type Selector */}
                    <Text className="text-base font-semibold text-black mb-3">Event Type</Text>
                    <View className="flex-row flex-wrap gap-3 mb-8">
                        {EVENT_TYPES.map((et) => (
                            <TouchableOpacity
                                key={et.type}
                                onPress={() => setSelectedType(et.type)}
                                className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl border"
                                style={{
                                    backgroundColor: selectedType === et.type ? et.color : "#f9fafb",
                                    borderColor: selectedType === et.type ? et.iconColor : "#f3f4f6",
                                }}
                            >
                                <Ionicons
                                    name={et.icon as any}
                                    size={16}
                                    color={selectedType === et.type ? et.iconColor : "#9ca3af"}
                                />
                                <Text
                                    className="text-sm font-medium"
                                    style={{ color: selectedType === et.type ? et.iconColor : "#6b7280" }}
                                >
                                    {et.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Dynamic Form */}
                    {selectedType === "feeding" && (
                        <View className="gap-4">
                            <Text className="text-base font-semibold text-black">Feeding Details</Text>

                            {/* Food Type */}
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Food Type</Text>
                                <TextInput
                                    className="bg-gray-100 rounded-xl px-4 py-3 text-black text-sm"
                                    placeholder="e.g. Dry Kibble"
                                    placeholderTextColor="#9ca3af"
                                    value={foodType}
                                    onChangeText={setFoodType}
                                />
                            </View>

                            {/* Quantity + Unit */}
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Quantity</Text>
                                <View className="flex-row gap-3">
                                    {/* Number Input */}
                                    <TextInput
                                        className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-black text-sm"
                                        placeholder="e.g. 1"
                                        placeholderTextColor="#9ca3af"
                                        value={feedingQuantity}
                                        onChangeText={setFeedingQuantity}
                                        keyboardType="numeric"
                                    />

                                    {/* Unit Selector */}
                                    <TouchableOpacity
                                        className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center gap-2"
                                        style={{ minWidth: 100 }}
                                        onPress={() => setShowUnitDropdown(true)}
                                    >
                                        <Text className="text-sm text-black">{feedingUnit}</Text>
                                        <Ionicons name="chevron-down" size={14} color="#9ca3af" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Unit Modal */}
                            <Modal
                                visible={showUnitDropdown}
                                transparent
                                animationType="fade"
                                onRequestClose={() => setShowUnitDropdown(false)}
                            >
                                <TouchableOpacity
                                    className="flex-1 bg-black/30"
                                    activeOpacity={1}
                                    onPress={() => setShowUnitDropdown(false)}
                                >
                                    <View
                                        className="mx-5 mt-64 bg-white rounded-2xl overflow-hidden"
                                        style={{ elevation: 10 }}
                                    >
                                        <Text className="text-sm font-semibold text-gray-400 px-4 pt-4 pb-2">
                                            Select Unit
                                        </Text>
                                        {["cup", "g", "kg", "ml", "l", "piece"].map((unit, index, arr) => (
                                            <TouchableOpacity
                                                key={unit}
                                                className="px-4 py-3 flex-row items-center justify-between"
                                                style={{
                                                    borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                                                    borderBottomColor: "#f3f4f6",
                                                    backgroundColor: feedingUnit === unit ? "#f9fafb" : "#fff",
                                                }}
                                                onPress={() => {
                                                    setFeedingUnit(unit);
                                                    setShowUnitDropdown(false);
                                                }}
                                            >
                                                <Text className="text-sm text-black">{unit}</Text>
                                                {feedingUnit === unit && (
                                                    <Ionicons name="checkmark" size={16} color="#000" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </TouchableOpacity>
                            </Modal>

                            {/* Time */}
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Time</Text>
                                <TouchableOpacity
                                    className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center gap-2"
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Ionicons name="time-outline" size={16} color="#9ca3af" />
                                    <Text className="text-sm text-black">
                                        {feedingTime.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </Text>
                                </TouchableOpacity>
                                {showTimePicker && (
                                    <DateTimePicker
                                        value={feedingTime}
                                        mode="time"
                                        display="default"
                                        onChange={(_event: DateTimePickerEvent, date?: Date) => {
                                            setShowTimePicker(false);
                                            if (date) setFeedingTime(date);
                                        }}
                                    />
                                )}
                            </View>

                        </View>
                    )}

                    {selectedType === "expense" && (
                        <View className="gap-4">
                            <Text className="text-base font-semibold text-black">Expense Details</Text>

                            {/* Category */}
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Category</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {[
                                        { label: "Food", color: "#dcfce7", activeColor: "#16a34a", icon: "fast-food-outline" },
                                        { label: "Vet", color: "#dbeafe", activeColor: "#2563eb", icon: "medical-outline" },
                                        { label: "Grooming", color: "#f3e8ff", activeColor: "#9333ea", icon: "cut-outline" },
                                        { label: "Medicine", color: "#ffedd5", activeColor: "#ea580c", icon: "fitness-outline" },
                                        { label: "Supplies", color: "#fef9c3", activeColor: "#ca8a04", icon: "cube-outline" },
                                        { label: "Other", color: "#f3f4f6", activeColor: "#6b7280", icon: "ellipsis-horizontal-outline" },
                                    ].map((cat) => (
                                        <TouchableOpacity
                                            key={cat.label}
                                            onPress={() => setExpenseCategory(cat.label)}
                                            className="px-4 py-2 rounded-full flex-row items-center gap-2"
                                            style={{
                                                backgroundColor: expenseCategory === cat.label ? cat.color : "#f3f4f6",
                                                borderWidth: 1,
                                                borderColor: expenseCategory === cat.label ? cat.activeColor : "#f3f4f6",
                                            }}
                                        >
                                            <Ionicons
                                                name={cat.icon as any}
                                                size={14}
                                                color={expenseCategory === cat.label ? cat.activeColor : "#9ca3af"}
                                            />
                                            <Text
                                                className="text-sm font-medium"
                                                style={{
                                                    color: expenseCategory === cat.label ? cat.activeColor : "#6b7280",
                                                }}
                                            >
                                                {cat.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Amount */}
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Amount (₱)</Text>
                                <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center gap-2">
                                    <Ionicons name="cash-outline" size={16} color="#9ca3af" />
                                    <TextInput
                                        className="flex-1 text-black text-sm"
                                        placeholder="0.00"
                                        placeholderTextColor="#9ca3af"
                                        value={expenseAmount}
                                        onChangeText={setExpenseAmount}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {/* Date */}
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Date</Text>
                                <TouchableOpacity
                                    className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center gap-2"
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                                    <Text className="text-sm text-black">
                                        {expenseDate.toLocaleDateString([], {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={expenseDate}
                                        mode="date"
                                        display="default"
                                        maximumDate={new Date()}
                                        onChange={(_event: DateTimePickerEvent, date?: Date) => {
                                            setShowDatePicker(false);
                                            if (date) setExpenseDate(date);
                                        }}
                                    />
                                )}
                            </View>

                            {/* Description */}
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Description</Text>
                                <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center gap-2">
                                    <Ionicons name="create-outline" size={16} color="#9ca3af" />
                                    <TextInput
                                        className="flex-1 text-black text-sm"
                                        placeholder="e.g. Annual checkup"
                                        placeholderTextColor="#9ca3af"
                                        value={expenseDescription}
                                        onChangeText={setExpenseDescription}
                                    />
                                </View>
                            </View>

                        </View>
                    )}

                    {selectedType === "medication" && (
                        <View className="gap-4">
                            <Text className="text-base font-semibold text-black">Medication Details</Text>
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Medication Name</Text>
                                <TextInput
                                    className="bg-gray-100 rounded-xl px-4 py-3 text-black"
                                    placeholder="e.g. Heartgard"
                                    placeholderTextColor="#9ca3af"
                                    value={medName}
                                    onChangeText={setMedName}
                                />
                            </View>
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Dose</Text>
                                <TextInput
                                    className="bg-gray-100 rounded-xl px-4 py-3 text-black"
                                    placeholder="e.g. 1 tablet"
                                    placeholderTextColor="#9ca3af"
                                    value={medDose}
                                    onChangeText={setMedDose}
                                />
                            </View>
                        </View>
                    )}

                    {selectedType === "vaccine" && (
                        <View className="gap-4">
                            <Text className="text-base font-semibold text-black">Vaccine Details</Text>
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Vaccine Name</Text>
                                <TextInput
                                    className="bg-gray-100 rounded-xl px-4 py-3 text-black"
                                    placeholder="e.g. Rabies Booster"
                                    placeholderTextColor="#9ca3af"
                                    value={vaccineName}
                                    onChangeText={setVaccineName}
                                />
                            </View>
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Next Due Date</Text>
                                <TextInput
                                    className="bg-gray-100 rounded-xl px-4 py-3 text-black"
                                    placeholder="e.g. 2026-09-01"
                                    placeholderTextColor="#9ca3af"
                                    value={nextDue}
                                    onChangeText={setNextDue}
                                />
                            </View>
                        </View>
                    )}

                    {selectedType === "symptom" && (
                        <View className="gap-4">
                            <Text className="text-base font-semibold text-black">Symptom Details</Text>
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Symptom</Text>
                                <TextInput
                                    className="bg-gray-100 rounded-xl px-4 py-3 text-black"
                                    placeholder="e.g. Itchy Skin"
                                    placeholderTextColor="#9ca3af"
                                    value={symptomName}
                                    onChangeText={setSymptomName}
                                />
                            </View>
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Severity</Text>
                                <View className="flex-row gap-3">
                                    {["Mild", "Moderate", "Severe"].map((s) => (
                                        <TouchableOpacity
                                            key={s}
                                            onPress={() => setSeverity(s)}
                                            className="flex-1 py-2.5 rounded-xl border items-center"
                                            style={{
                                                backgroundColor: severity === s ? "#fee2e2" : "#f9fafb",
                                                borderColor: severity === s ? "#dc2626" : "#f3f4f6",
                                            }}
                                        >
                                            <Text
                                                className="text-sm font-medium"
                                                style={{ color: severity === s ? "#dc2626" : "#6b7280" }}
                                            >
                                                {s}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Notes (shared) */}
                    {selectedType && (
                        <View className="mt-4">
                            <Text className="text-sm text-gray-600 mb-2">Notes (optional)</Text>
                            <TextInput
                                className="bg-gray-100 rounded-xl px-4 py-3 text-black"
                                placeholder="Any additional notes..."
                                placeholderTextColor="#9ca3af"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    )}

                    {/* Error */}
                    {error ? (
                        <Text className="text-red-500 text-sm text-center mt-4">{error}</Text>
                    ) : null}

                </View>
            </KeyboardAwareScrollView>

            {/* Save Button */}
            {selectedType && (
                <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-white border-t border-gray-100">
                    <TouchableOpacity
                        className="bg-black rounded-xl py-4 items-center"
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-semibold text-base">Save Event</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}