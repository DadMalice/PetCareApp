// @ts-ignore
import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { PetProvider } from "../context/PetContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { StatusBar } from "expo-status-bar";

function RootLayoutInner() {
    const [session, setSession] = useState<Session | null>(null);
    const [initialized, setInitialized] = useState<boolean>(false);
    const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
    const router = useRouter();
    const segments = useSegments();
    const { isDark } = useTheme();

    // Handle incoming deep links (password reset + Google OAuth callback)
    async function handleDeepLink(url: string) {
        try {
            const urlObj = new URL(url);
            const isPasswordRecovery =
                url.includes("reset-password") || url.includes("type=recovery");

            // Implicit flow: tokens in URL fragment (#access_token=...&refresh_token=...)
            // Used by both password recovery and Google OAuth callback
            if (urlObj.hash && urlObj.hash.length > 1) {
                const fragment = urlObj.hash.substring(1);
                const params = new URLSearchParams(fragment);
                const accessToken = params.get("access_token");
                const refreshToken = params.get("refresh_token");

                if (accessToken && refreshToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error) console.error("Error setting session:", error);

                    if (isPasswordRecovery) {
                        setIsPasswordRecovery(true);
                        router.replace("/(auth)/reset-password");
                    }
                    // For OAuth callback, onAuthStateChange will handle navigation
                    return;
                }
            }

            // PKCE flow: code in query params (password recovery only)
            if (isPasswordRecovery) {
                const code = urlObj.searchParams.get("code");
                if (code) {
                    setIsPasswordRecovery(true);
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) console.error("Error exchanging code:", error);
                    router.replace("/(auth)/reset-password");
                }
            }
        } catch (err) {
            console.error("Error handling deep link:", err);
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setSession(session);
            setInitialized(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event: AuthChangeEvent, session: Session | null) => {
                setSession(session);
                if (event === "PASSWORD_RECOVERY") {
                    setIsPasswordRecovery(true);
                    router.replace("/(auth)/reset-password");
                } else {
                    setIsPasswordRecovery(false);
                }
            }
        );

        // Listen for deep links while app is running
        const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
            handleDeepLink(url);
        });

        // Check if app was opened via deep link (cold start)
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink(url);
        });

        return () => {
            subscription.unsubscribe();
            linkingSubscription.remove();
        };
    }, []);

    useEffect(() => {
        if (!initialized) return;
        if (isPasswordRecovery) return;
        const inAuth = segments[0] === "(auth)";
        if (!session && !inAuth) router.replace("/(auth)/login");
        if (session && inAuth) router.replace("/(tabs)");
    }, [session, initialized, isPasswordRecovery]);

    if (!initialized) {
        return (
            <SafeAreaProvider>
                <View className={`flex-1 items-center justify-center ${isDark ? "bg-dark-bg" : "bg-white"}`}>
                    <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar style={isDark ? "light" : "dark"} />
            <View className={`flex-1 bg-white dark:bg-dark-bg${isDark ? " dark" : ""}`}>
                <PetProvider>
                    <Slot />
                </PetProvider>
            </View>
        </SafeAreaProvider>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <RootLayoutInner />
        </ThemeProvider>
    );
}