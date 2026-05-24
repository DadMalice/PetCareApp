// @ts-ignore
import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
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
    const router = useRouter();
    const segments = useSegments();
    const { isDark } = useTheme();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setSession(session);
            setInitialized(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event: AuthChangeEvent, session: Session | null) => {
                setSession(session);
            }
        );
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!initialized) return;
        const inAuth = segments[0] === "(auth)";
        if (!session && !inAuth) router.replace("/(auth)/login");
        if (session && inAuth) router.replace("/(tabs)");
    }, [session, initialized]);

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
            <View className={"flex-1 " + (isDark ? "dark bg-dark-bg" : "bg-white")}>
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