import { supabase } from "./supabase";
import { useCallback, useState } from "react";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: "petcare://login",
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    "petcare://login"
                );

                if (result.type === "success" && result.url) {
                    const url = new URL(result.url);
                    if (url.hash && url.hash.length > 1) {
                        const fragment = url.hash.substring(1);
                        const params = new URLSearchParams(fragment);
                        const accessToken = params.get("access_token");
                        const refreshToken = params.get("refresh_token");

                        if (accessToken && refreshToken) {
                            await supabase.auth.setSession({
                                access_token: accessToken,
                                refresh_token: refreshToken,
                            });
                            // onAuthStateChange in _layout.tsx will handle navigation
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Google sign-in error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    return { handleGoogleSignIn, loading };
}
