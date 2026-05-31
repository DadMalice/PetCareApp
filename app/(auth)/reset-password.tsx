import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { isDark } = useTheme();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Validation
    const passwordValid = password.length >= 8;
    const passwordsMatch =
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword;
    const canSubmit = passwordValid && passwordsMatch;

    const bgClass = isDark ? "bg-dark-bg" : "bg-white";
    const textClass = isDark ? "text-dark-text" : "text-black";
    const textSecondaryClass = isDark ? "text-dark-text-secondary" : "text-gray-400";
    const inputBgClass = isDark ? "bg-dark-card" : "bg-gray-100";
    const inputTextClass = isDark ? "text-dark-text" : "text-black";

    async function handleUpdatePassword() {
        if (!canSubmit) return;

        setLoading(true);
        setError("");

        const { error } = await supabase.auth.updateUser({
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            // Sign out so the user can log in fresh with the new password
            await supabase.auth.signOut();
            setSuccess(true);
        }
        setLoading(false);
    }

    if (success) {
        return (
            <SafeAreaView className={`flex-1 ${bgClass}`}>
                <StatusBar style={isDark ? "light" : "dark"} />
                <View className="flex-1 px-6 justify-center items-center">
                    <View
                        className="w-20 h-20 rounded-full items-center justify-center mb-6"
                        style={{ backgroundColor: "#dcfce7" }}
                    >
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={36}
                            color="#22c55e"
                        />
                    </View>

                    <Text className={`text-2xl font-bold ${textClass} mb-2 text-center`}>
                        Password Updated
                    </Text>

                    <Text className={`${textSecondaryClass} text-sm text-center mb-8 px-10 leading-5`}>
                        Your password has been successfully updated. You can now log in with your new password.
                    </Text>

                    <TouchableOpacity
                        className="bg-black rounded-xl py-4 items-center w-full flex-row justify-center gap-2"
                        onPress={() => router.replace("/(auth)/login")}
                    >
                        <Ionicons name="log-in-outline" size={18} color="white" />
                        <Text className="text-white font-semibold text-base">
                            Go to Login
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
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
                <View className="px-6 pt-6">

                    {/* Back Button */}
                    <TouchableOpacity
                        className="mb-8"
                        onPress={() => router.replace("/(auth)/login")}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={isDark ? "#f5f5f7" : "#000"}
                        />
                    </TouchableOpacity>

                    {/* Header */}
                    <Text className={`text-3xl font-bold ${textClass} mb-1`}>
                        New Password
                    </Text>

                    <Text className={`${textSecondaryClass} text-sm mb-8`}>
                        Create a new password for your account. Make sure it's at least 8 characters.
                    </Text>

                    {/* Password */}
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>
                        New Password
                    </Text>

                    <View
                        className={`flex-row items-center rounded-xl px-4 py-3 mb-2 border ${password.length === 0
                            ? `${inputBgClass} border-transparent`
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
                            className={`flex-1 ${inputTextClass} text-sm`}
                            placeholder="Must be at least 8 characters"
                            placeholderTextColor="#9ca3af"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />

                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
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
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>
                        Confirm New Password
                    </Text>

                    <View
                        className={`flex-row items-center rounded-xl px-4 py-3 mb-2 border ${confirmPassword.length === 0
                            ? `${inputBgClass} border-transparent`
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
                            className={`flex-1 ${inputTextClass} text-sm`}
                            placeholder="Should match the password above"
                            placeholderTextColor="#9ca3af"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />

                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Ionicons
                                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                size={18}
                                color="#9ca3af"
                            />
                        </TouchableOpacity>
                    </View>

                    {confirmPassword.length > 0 && (
                        <Text
                            className={`text-xs mb-6 ${passwordsMatch
                                ? "text-green-600"
                                : "text-red-500"
                                }`}
                        >
                            {passwordsMatch
                                ? "Passwords match"
                                : "Passwords do not match"}
                        </Text>
                    )}

                    {confirmPassword.length === 0 && (
                        <View className="mb-6" />
                    )}

                    {/* Error */}
                    {error ? (
                        <Text className="text-red-500 text-sm text-center mb-4">
                            {error}
                        </Text>
                    ) : null}

                    {/* Update Password Button */}
                    <TouchableOpacity
                        className={`rounded-xl py-4 items-center mb-6 flex-row justify-center gap-2 ${canSubmit
                            ? "bg-black"
                            : "bg-gray-300"
                            }`}
                        onPress={handleUpdatePassword}
                        disabled={!canSubmit || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="lock-closed-outline" size={18} color="white" />
                                <Text className="text-white font-semibold text-base">
                                    Update Password
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Back to Login */}
                    <View className="flex-row justify-center">
                        <Text className={`${textSecondaryClass}`}>
                            Changed your mind?{" "}
                        </Text>

                        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                            <Text className="text-gray-400 font-bold">Log In</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}