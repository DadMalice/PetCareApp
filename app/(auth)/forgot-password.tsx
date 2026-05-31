import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { isDark } = useTheme();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const emailValid = /\S+@\S+\.\S+/.test(email);

    const bgClass = isDark ? "bg-dark-bg" : "bg-white";
    const textClass = isDark ? "text-dark-text" : "text-black";
    const textSecondaryClass = isDark ? "text-dark-text-secondary" : "text-gray-400";
    const inputBgClass = isDark ? "bg-dark-card" : "bg-gray-100";
    const inputTextClass = isDark ? "text-dark-text" : "text-black";

    async function handleSendReset() {
        if (!emailValid) return;

        setLoading(true);
        setError("");

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "petcare://reset-password",
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSent(true);
            setLoading(false);
        }
    }

    if (sent) {
        return (
            <SafeAreaView className={`flex-1 ${bgClass}`}>
                <StatusBar style={isDark ? "light" : "dark"} />
                <View className="flex-1 px-6 justify-center items-center">
                    <View
                        className="w-20 h-20 rounded-full items-center justify-center mb-6"
                        style={{ backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6" }}
                    >
                        <Ionicons
                            name="mail-outline"
                            size={36}
                            color={isDark ? "#f5f5f7" : "#000"}
                        />
                    </View>

                    <Text className={`text-2xl font-bold ${textClass} mb-2 text-center`}>
                        Check Your Email
                    </Text>

                    <Text className={`${textSecondaryClass} text-sm text-center mb-2 px-8`}>
                        We've sent a password reset link to
                    </Text>

                    <Text className={`${textClass} text-sm font-semibold text-center mb-6`}>
                        {email}
                    </Text>

                    <Text className={`${textSecondaryClass} text-xs text-center mb-8 px-10 leading-5`}>
                        Didn't receive the email? Check your spam folder, or make sure
                        the email address is correct and try again.
                    </Text>

                    <TouchableOpacity
                        className="bg-black rounded-xl py-4 items-center w-full mb-4 flex-row justify-center gap-2"
                        onPress={() => setSent(false)}
                    >
                        <Ionicons name="refresh-outline" size={18} color="white" />
                        <Text className="text-white font-semibold text-base">
                            Try Again
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="items-center py-3"
                        onPress={() => router.back()}
                    >
                        <Text className={`text-sm ${textSecondaryClass} font-medium`}>
                            Back to Login
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
                        onPress={() => router.back()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={isDark ? "#f5f5f7" : "#000"}
                        />
                    </TouchableOpacity>

                    {/* Header */}
                    <Text className={`text-3xl font-bold ${textClass} mb-1`}>
                        Reset Password
                    </Text>

                    <Text className={`${textSecondaryClass} text-sm mb-8`}>
                        Enter the email associated with your account and we'll send a link to reset your password.
                    </Text>

                    {/* Email */}
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>
                        Email
                    </Text>

                    <View
                        className={`flex-row items-center rounded-xl px-4 py-3 mb-2 border ${email.length === 0
                            ? `${inputBgClass} border-transparent`
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
                            className={`flex-1 ${inputTextClass} text-sm`}
                            placeholder="your@email.com"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {email.length > 0 && (
                        <Text
                            className={`text-xs mb-6 ${emailValid
                                ? "text-green-600"
                                : "text-red-500"
                                }`}
                        >
                            {emailValid
                                ? "Valid email address"
                                : "Please enter a valid email"}
                        </Text>
                    )}

                    {email.length === 0 && (
                        <View className="mb-6" />
                    )}

                    {/* Error */}
                    {error ? (
                        <Text className="text-red-500 text-sm text-center mb-4">
                            {error}
                        </Text>
                    ) : null}

                    {/* Send Reset Link Button */}
                    <TouchableOpacity
                        className={`rounded-xl py-4 items-center mb-6 flex-row justify-center gap-2 ${emailValid
                            ? "bg-black"
                            : "bg-gray-300"
                            }`}
                        onPress={handleSendReset}
                        disabled={!emailValid || loading}
                    >
                        <Ionicons name="send-outline" size={18} color="white" />

                        <Text className="text-white font-semibold text-base">
                            {loading ? "Sending..." : "Send Reset Link"}
                        </Text>
                    </TouchableOpacity>

                    {/* Back to Login */}
                    <View className="flex-row justify-center">
                        <Text className={`${textSecondaryClass}`}>
                            Remember your password?{" "}
                        </Text>

                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-gray-400 font-bold">Log In</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}