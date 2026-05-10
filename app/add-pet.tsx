import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { usePet } from "../context/PetContext";

export default function AddPetScreen() {
    const router = useRouter();
    const { refreshPets } = usePet();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [name, setName] = useState("");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [weight, setWeight] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "">("");

    async function handleSave() {
        if (!name || !gender) {
            setError("Name and gender are required.");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            const { error } = await supabase.from("pets").insert({
                user_id: user.id,
                name,
                breed,
                age_years: parseFloat(age) || 0,
                weight_kg: parseFloat(weight) || 0,
                gender,
                status: "Healthy",
            });

            if (error) throw error;
            await refreshPets();
            router.back();
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-5 pt-4 pb-24">

                    {/* Header */}
                    <View className="flex-row items-center gap-3 mb-8">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-black">Add Pet</Text>
                    </View>

                    {/* Pet Avatar Placeholder */}
                    <View className="items-center mb-8">
                        <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center">
                            <Ionicons name="camera-outline" size={32} color="#9ca3af" />
                        </View>
                        <Text className="text-sm text-gray-400 mt-2">Add photo (coming soon)</Text>
                    </View>

                    {/* Name */}
                    <Text className="text-sm font-medium text-gray-700 mb-2">Pet Name *</Text>
                    <TextInput
                        className="bg-gray-100 rounded-xl px-4 py-3 text-black mb-4"
                        placeholder="e.g. Max"
                        placeholderTextColor="#9ca3af"
                        value={name}
                        onChangeText={setName}
                    />

                    {/* Breed */}
                    <Text className="text-sm font-medium text-gray-700 mb-2">Breed</Text>
                    <TextInput
                        className="bg-gray-100 rounded-xl px-4 py-3 text-black mb-4"
                        placeholder="e.g. Golden Retriever"
                        placeholderTextColor="#9ca3af"
                        value={breed}
                        onChangeText={setBreed}
                    />

                    {/* Age + Weight */}
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-700 mb-2">Age (years)</Text>
                            <TextInput
                                className="bg-gray-100 rounded-xl px-4 py-3 text-black"
                                placeholder="e.g. 4"
                                placeholderTextColor="#9ca3af"
                                value={age}
                                onChangeText={setAge}
                                keyboardType="numeric"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-700 mb-2">Weight (kg)</Text>
                            <TextInput
                                className="bg-gray-100 rounded-xl px-4 py-3 text-black"
                                placeholder="e.g. 28"
                                placeholderTextColor="#9ca3af"
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Gender */}
                    <Text className="text-sm font-medium text-gray-700 mb-2">Gender *</Text>
                    <View className="flex-row gap-4 mb-8">
                        {["Male", "Female"].map((g) => (
                            <TouchableOpacity
                                key={g}
                                onPress={() => setGender(g as "Male" | "Female")}
                                className="flex-1 py-3 rounded-xl border items-center"
                                style={{
                                    backgroundColor: gender === g ? "#000" : "#f9fafb",
                                    borderColor: gender === g ? "#000" : "#f3f4f6",
                                }}
                            >
                                <Text
                                    className="font-medium"
                                    style={{ color: gender === g ? "#fff" : "#6b7280" }}
                                >
                                    {g}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Error */}
                    {error ? (
                        <Text className="text-red-500 text-sm text-center mb-4">{error}</Text>
                    ) : null}

                </View>
            </ScrollView>

            {/* Save Button */}
            <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-white border-t border-gray-100">
                <TouchableOpacity
                    className="bg-black rounded-xl py-4 items-center"
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-semibold text-base">Save Pet</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}