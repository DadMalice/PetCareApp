// @ts-ignore
import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { PetProvider } from "../context/PetContext";

export default function RootLayout() {
    const [session, setSession] = useState<Session | null>(null);
    const [initialized, setInitialized] = useState<boolean>(false);
    const router = useRouter();
    const segments = useSegments();

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
                <View className="flex-1 bg-white items-center justify-center">
                    <ActivityIndicator size="large" color="#000" />
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <PetProvider>
                <Slot />
            </PetProvider>
        </SafeAreaProvider>
    );
}