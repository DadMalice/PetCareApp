import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function SignUpScreen() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Validation
    const passwordValid = password.length >= 8;

    const passwordsMatch =
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword;

    const emailValid = /\S+@\S+\.\S+/.test(email);

    const canSubmit =
        fullName.trim() &&
        emailValid &&
        passwordValid &&
        passwordsMatch;

    async function handleSignUp() {
        setError("");

        if (!canSubmit) return;

        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) {
            setError(error.message);
        }

        setLoading(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAwareScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={100}
            >
                <View className="flex-1 px-6 justify-center">

                    {/* Back Button */}
                    <TouchableOpacity
                        className="mb-8"
                        onPress={() => router.back()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color="#000"
                        />
                    </TouchableOpacity>

                    {/* Header */}
                    <Text className="text-3xl font-bold text-black mb-1">
                        Create Account
                    </Text>

                    <Text className="text-gray-400 text-sm mb-8">
                        Join PetCare and start tracking your pets
                    </Text>

                    {/* Full Name */}
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Full Name
                    </Text>

                    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-4">
                        <Ionicons
                            name="person-outline"
                            size={18}
                            color="#9ca3af"
                            style={{ marginRight: 10 }}
                        />

                        <TextInput
                            className="flex-1 text-black text-sm"
                            placeholder="Jane Doe"
                            placeholderTextColor="#9ca3af"
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    {/* Email */}
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Email
                    </Text>

                    <View
                        className={`flex-row items-center rounded-xl px-4 py-3 mb-2 border ${email.length === 0
                            ? "bg-gray-100 border-transparent"
                            : emailValid
                                ? "bg-green-50 border-green-500"
                                : "bg-red-50 border-red-500"
                            }`}
                    >
                        <Ionicons
                            name="mail-outline"
                            size={18}
                            color="#9ca3af"
                            style={{ marginRight: 10 }}
                        />

                        <TextInput
                            className="flex-1 text-black text-sm"
                            placeholder="jane@email.com"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {email.length > 0 && (
                        <Text
                            className={`text-xs mb-4 ${emailValid
                                ? "text-green-600"
                                : "text-red-500"
                                }`}
                        >
                            {emailValid
                                ? "Valid email address"
                                : "Please enter a valid email"}
                        </Text>
                    )}

                    {/* Password */}
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Password
                    </Text>

                    <View
                        className={`flex-row items-center rounded-xl px-4 py-3 mb-2 border ${password.length === 0
                            ? "bg-gray-100 border-transparent"
                            : passwordValid
                                ? "bg-green-50 border-green-500"
                                : "bg-red-50 border-red-500"
                            }`}
                    >
                        <Ionicons
                            name="lock-closed-outline"
                            size={18}
                            color="#9ca3af"
                            style={{ marginRight: 10 }}
                        />

                        <TextInput
                            className="flex-1 text-black text-sm"
                            placeholder="Must be at least 8 characters"
                            placeholderTextColor="#9ca3af"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />

                        <TouchableOpacity
                            onPress={() =>
                                setShowPassword(!showPassword)
                            }
                        >
                            <Ionicons
                                name={
                                    showPassword
                                        ? "eye-off-outline"
                                        : "eye-outline"
                                }
                                size={18}
                                color="#9ca3af"
                            />
                        </TouchableOpacity>
                    </View>

                    {password.length > 0 && (
                        <Text
                            className={`text-xs mb-4 ${passwordValid
                                ? "text-green-600"
                                : "text-red-500"
                                }`}
                        >
                            {passwordValid
                                ? "Password strength looks good"
                                : "Password must be at least 8 characters"}
                        </Text>
                    )}

                    {/* Confirm Password */}
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                    </Text>

                    <View
                        className={`flex-row items-center rounded-xl px-4 py-3 mb-2 border ${confirmPassword.length === 0
                            ? "bg-gray-100 border-transparent"
                            : passwordsMatch
                                ? "bg-green-50 border-green-500"
                                : "bg-red-50 border-red-500"
                            }`}
                    >
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={18}
                            color="#9ca3af"
                            style={{ marginRight: 10 }}
                        />

                        <TextInput
                            className="flex-1 text-black text-sm"
                            placeholder="Should match the password above"
                            placeholderTextColor="#9ca3af"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />

                        <TouchableOpacity
                            onPress={() =>
                                setShowConfirmPassword(
                                    !showConfirmPassword
                                )
                            }
                        >
                            <Ionicons
                                name={
                                    showConfirmPassword
                                        ? "eye-off-outline"
                                        : "eye-outline"
                                }
                                size={18}
                                color="#9ca3af"
                            />
                        </TouchableOpacity>
                    </View>

                    {confirmPassword.length > 0 && (
                        <Text
                            className={`text-xs mb-4 ${passwordsMatch
                                ? "text-green-600"
                                : "text-red-500"
                                }`}
                        >
                            {passwordsMatch
                                ? "Passwords match"
                                : "Passwords do not match"}
                        </Text>
                    )}

                    {/* Terms */}
                    <Text className="text-xs text-gray-400 mb-6">
                        By signing up, you agree to our{" "}
                        <Text className="text-black font-semibold">
                            Terms of Service
                        </Text>{" "}
                        and{" "}
                        <Text className="text-black font-semibold">
                            Privacy Policy
                        </Text>
                    </Text>

                    {/* Error */}
                    {error ? (
                        <Text className="text-red-500 text-sm text-center mb-4">
                            {error}
                        </Text>
                    ) : null}

                    {/* Create Account Button */}
                    <TouchableOpacity
                        className={`rounded-xl py-4 items-center mb-4 flex-row justify-center gap-2 ${canSubmit
                            ? "bg-black"
                            : "bg-gray-300"
                            }`}
                        onPress={handleSignUp}
                        disabled={!canSubmit || loading}
                    >
                        <Ionicons
                            name="person-add-outline"
                            size={18}
                            color="white"
                        />

                        <Text className="text-white font-semibold text-base">
                            {loading
                                ? "Creating account..."
                                : "Create Account"}
                        </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center mb-4">
                        <View className="flex-1 h-px bg-gray-200" />

                        <Text className="mx-3 text-gray-400 text-sm">
                            or
                        </Text>

                        <View className="flex-1 h-px bg-gray-200" />
                    </View>

                    {/* Google Button */}
                    <TouchableOpacity
                        className="bg-white border border-[#DADCE0] rounded-xl py-4 items-center mb-8 flex-row justify-center gap-3"
                        activeOpacity={0.8}
                    >
                        <Image
                            source={require("../../assets/g-logo.png")}
                            style={{ width: 20, height: 20 }}
                            resizeMode="contain"
                        />

                        <Text
                            className="font-semibold text-[15px]"
                            style={{ color: "#3C4043" }}
                        >
                            Continue with Google
                        </Text>
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View className="flex-row justify-center">
                        <Text className="text-gray-500">
                            Already have an account?{" "}
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.back()}
                        >
                            <Text className="text-black font-bold">
                                Log In
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}