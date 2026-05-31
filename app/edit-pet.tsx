import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Image,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator"; // Added import
import { supabase } from "../lib/supabase";
import { usePet } from "../context/PetContext";
import { useTheme } from "../context/ThemeContext";
import { uploadPetPhoto, deletePetPhoto } from "../lib/storage";
import { StatusBar } from "expo-status-bar";

export default function EditPetScreen() {
    const router = useRouter();
    const { pets, refreshPets } = usePet();
    const { isDark } = useTheme();
    const { petId } = useLocalSearchParams<{ petId: string }>();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");

    const [name, setName] = useState("");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [weight, setWeight] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "">("");
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
    const [removePhoto, setRemovePhoto] = useState(false);

    const bgClass = isDark ? "bg-dark-bg" : "bg-white";
    const textClass = isDark ? "text-dark-text" : "text-black";
    const textSecondaryClass = isDark ? "text-dark-text-secondary" : "text-gray-400";
    const inputBgClass = isDark ? "bg-dark-card" : "bg-gray-100";
    const inputTextClass = isDark ? "text-dark-text" : "text-black";

    // Load pet data
    useEffect(() => {
        if (!petId) return;
        const pet = pets.find((p) => p.id === petId);
        if (pet) {
            setName(pet.name);
            setBreed(pet.breed);
            setAge(pet.age_years.toString());
            setWeight(pet.weight_kg.toString());
            setGender(pet.gender);
            setExistingPhotoUrl(pet.photo_url || null);
        }
        setFetching(false);
    }, [petId, pets]);

    async function pickPhoto() {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required", "We need camera roll access to add a photo.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            // The built-in editor (allowsEditing) already handled cropping to a square.
            // Use the result directly — no additional manipulation needed.
            setPhotoUri(result.assets[0].uri);
            setRemovePhoto(false);
        }
    }

    function handleRemovePhoto() {
        setPhotoUri(null);
        setRemovePhoto(true);
    }

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

            // Handle photo changes
            let newPhotoUrl = existingPhotoUrl;

            if (removePhoto && existingPhotoUrl) {
                // Delete the old photo from storage
                await deletePetPhoto(existingPhotoUrl);
                newPhotoUrl = null;
            }

            if (photoUri) {
                // Delete old photo if exists
                if (existingPhotoUrl) {
                    await deletePetPhoto(existingPhotoUrl);
                }
                // Upload new photo
                const url = await uploadPetPhoto(user.id, petId!, photoUri);
                if (url) newPhotoUrl = url;
            }

            // Update the pet
            const { error: updateError } = await supabase
                .from("pets")
                .update({
                    name,
                    breed,
                    age_years: parseFloat(age) || 0,
                    weight_kg: parseFloat(weight) || 0,
                    gender,
                    photo_url: newPhotoUrl,
                })
                .eq("id", petId);

            if (updateError) throw updateError;

            await refreshPets();
            router.back();
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    }

    async function handleDeletePet() {
        Alert.alert(
            "Delete Pet",
            `Are you sure you want to delete ${name}? All events and reminders for this pet will also be deleted. This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // Delete photo from storage
                            if (existingPhotoUrl) {
                                await deletePetPhoto(existingPhotoUrl);
                            }
                            // Delete pet (cascades to events and reminders)
                            await supabase.from("pets").delete().eq("id", petId);
                            await refreshPets();
                            router.back();
                        } catch (err: any) {
                            setError(err.message);
                        }
                        setLoading(false);
                    },
                },
            ]
        );
    }

    if (fetching) {
        return (
            <SafeAreaView className={`flex-1 ${bgClass} items-center justify-center`}>
                <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
            </SafeAreaView>
        );
    }

    const displayPhoto = photoUri || (removePhoto ? null : existingPhotoUrl);

    return (
        <SafeAreaView className={`flex-1 ${bgClass}`}>
            <StatusBar style={isDark ? "light" : "dark"} />
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-5 pt-4 pb-24">

                    {/* Header */}
                    <View className="flex-row items-center gap-3 mb-8">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color={isDark ? "#f5f5f7" : "#000"} />
                        </TouchableOpacity>
                        <Text className={`text-2xl font-bold ${textClass}`}>Edit Pet</Text>
                    </View>

                    {/* Pet Photo Picker */}
                    <View className="items-center mb-4">
                        <TouchableOpacity onPress={pickPhoto}>
                            {displayPhoto ? (
                                <View className="w-24 h-24 rounded-full overflow-hidden">
                                    <Image
                                        source={{ uri: displayPhoto }}
                                        style={{ width: 96, height: 96 }}
                                        resizeMode="none"
                                    />
                                </View>
                            ) : (
                                <View className={`w-24 h-24 rounded-full items-center justify-center ${isDark ? "bg-dark-card" : "bg-gray-100"}`}>
                                    <Ionicons name="camera-outline" size={32} color="#9ca3af" />
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text className={`text-sm ${textSecondaryClass} mt-2`}>Tap photo to change</Text>
                        {displayPhoto && (
                            <TouchableOpacity onPress={handleRemovePhoto} className="mt-2">
                                <Text className="text-sm text-red-500">Remove Photo</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Name */}
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>Pet Name *</Text>
                    <TextInput
                        className={`${inputBgClass} rounded-xl px-4 py-3 ${inputTextClass} mb-4`}
                        placeholder="e.g. Max"
                        placeholderTextColor="#9ca3af"
                        value={name}
                        onChangeText={setName}
                    />

                    {/* Breed */}
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>Breed</Text>
                    <TextInput
                        className={`${inputBgClass} rounded-xl px-4 py-3 ${inputTextClass} mb-4`}
                        placeholder="e.g. Golden Retriever"
                        placeholderTextColor="#9ca3af"
                        value={breed}
                        onChangeText={setBreed}
                    />

                    {/* Age + Weight */}
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>Age (years)</Text>
                            <TextInput
                                className={`${inputBgClass} rounded-xl px-4 py-3 ${inputTextClass}`}
                                placeholder="e.g. 4"
                                placeholderTextColor="#9ca3af"
                                value={age}
                                onChangeText={setAge}
                                keyboardType="numeric"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>Weight (kg)</Text>
                            <TextInput
                                className={`${inputBgClass} rounded-xl px-4 py-3 ${inputTextClass}`}
                                placeholder="e.g. 28"
                                placeholderTextColor="#9ca3af"
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Gender */}
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>Gender *</Text>
                    <View className="flex-row gap-4 mb-8">
                        {["Male", "Female"].map((g) => (
                            <TouchableOpacity
                                key={g}
                                onPress={() => setGender(g as "Male" | "Female")}
                                className="flex-1 py-3 rounded-xl border items-center"
                                style={{
                                    backgroundColor: gender === g ? "#000" : (isDark ? "#1c1c1e" : "#f9fafb"),
                                    borderColor: gender === g ? "#000" : (isDark ? "#2c2c2e" : "#f3f4f6"),
                                }}
                            >
                                <Text
                                    className="font-medium"
                                    style={{ color: gender === g ? "#fff" : (isDark ? "#98989d" : "#6b7280") }}
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

                    {/* Delete Pet */}
                    <TouchableOpacity
                        className="flex-row items-center justify-center gap-2 mt-4"
                        onPress={handleDeletePet}
                    >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        <Text className="text-red-500 text-sm font-medium">Delete this pet</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>

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
                        <Text className="text-white font-semibold text-base">Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}