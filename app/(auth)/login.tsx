import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import { useGoogleAuth } from "../../lib/googleAuth";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";

export default function LoginScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const { handleGoogleSignIn } = useGoogleAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin() {
        setLoading(true);
        setError("");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        setLoading(false);
    }

    const bgClass = isDark ? "bg-dark-bg" : "bg-white";
    const textClass = isDark ? "text-dark-text" : "text-black";
    const textSecondaryClass = isDark ? "text-dark-text-secondary" : "text-gray-400";
    const textThirdClass = isDark ? "text-dark-text-secondary font-bold" : "text-gray-400 font-bold";
    const inputBgClass = isDark ? "bg-dark-card" : "bg-gray-100";
    const inputTextClass = isDark ? "text-dark-text" : "text-black";
    const cardBgClass = isDark ? "bg-dark-card" : "bg-white";

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
                <View className="px-6 pt-20">
                    {/* Logo */}
                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-black rounded-2xl items-center justify-center mb-5">
                            <MaterialCommunityIcons name="paw" size={40} color="white" />
                        </View>
                        <Text className={`text-3xl font-bold ${textClass} tracking-tight`}>PetCare</Text>
                        <Text className={`${textSecondaryClass} mt-2 text-sm`}>Manage your pets and keep them healthy.</Text>
                    </View>

                    {/* Email */}
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>Email</Text>
                    <View className={`flex-row items-center ${inputBgClass} rounded-xl px-4 py-3 mb-4`}>
                        <Ionicons name="mail-outline" size={18} color="#9ca3af" style={{ marginRight: 10 }} />
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

                    {/* Password */}
                    <Text className={`text-sm font-medium ${isDark ? "text-dark-text-secondary" : "text-gray-700"} mb-2`}>Password</Text>
                    <View className={`flex-row items-center ${inputBgClass} rounded-xl px-4 py-3 mb-2`}>
                        <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={{ marginRight: 10 }} />
                        <TextInput
                            className={`flex-1 ${inputTextClass} text-sm`}
                            placeholder="Password"
                            placeholderTextColor="#9ca3af"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={18}
                                color="#9ca3af"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity
                        className="items-end mb-6"
                        onPress={() => router.push("/(auth)/forgot-password")}
                    >
                        <Text className="text-sm text-gray-500">Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Error */}
                    {error ? (
                        <Text className="text-red-500 text-sm text-center mb-4">{error}</Text>
                    ) : null}

                    {/* Login Button */}
                    <TouchableOpacity
                        className="bg-black rounded-xl py-4 items-center mb-4 flex-row justify-center gap-2"
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Ionicons name="log-in-outline" size={18} color="white" />
                        <Text className="text-white font-semibold text-base">
                            {loading ? "Logging in..." : "Log In"}
                        </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center mb-4">
                        <View className="flex-1 h-px bg-gray-200" />
                        <Text className="mx-3 text-gray-400 text-sm">or</Text>
                        <View className="flex-1 h-px bg-gray-200" />
                    </View>

                    {/* Google Button */}
                    <TouchableOpacity
                        className="bg-white border border-[#DADCE0] rounded-xl py-4 items-center mb-8 flex-row justify-center gap-3"
                        activeOpacity={0.8}
                        onPress={handleGoogleSignIn}
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

                    {/* Sign Up Link */}
                    <View className="flex-row justify-center">
                        <Text className={`${textSecondaryClass}`}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                            <Text className={`${textThirdClass}`}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}