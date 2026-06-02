import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

type Theme = "light" | "dark";

type ThemeContextType = {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    isDark: false,
    toggleTheme: () => { },
    setTheme: () => { },
});

const THEME_KEY = "@petcare_theme";

function getSystemTheme(): Theme {
    return (Appearance.getColorScheme() as Theme) || "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("light");

    useEffect(() => {
        // 1. Load saved local theme for instant UI
        AsyncStorage.getItem(THEME_KEY).then((saved) => {
            if (saved === "dark" || saved === "light") {
                setThemeState(saved);
            } else {
                // No saved theme — use system theme
                setThemeState(getSystemTheme());
            }
        });

        // 2. If user is logged in, fetch their preference from Supabase
        //    and override the local value
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadRemoteTheme(session.user);
            }
        });

        // 3. Listen for auth state changes (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === "SIGNED_IN" && session?.user) {
                    loadRemoteTheme(session.user);
                } else if (event === "SIGNED_OUT") {
                    // Revert to system theme on logout
                    setThemeState(getSystemTheme());
                    AsyncStorage.removeItem(THEME_KEY);
                }
            }
        );

        // 4. Listen for system appearance changes (only matters when logged out)
        const appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) => {
            // Only follow system if user hasn't explicitly set a preference
            AsyncStorage.getItem(THEME_KEY).then((saved) => {
                if (!saved) {
                    setThemeState((colorScheme as Theme) || "light");
                }
            });
        });

        return () => {
            subscription.unsubscribe();
            appearanceSubscription?.remove();
        };
    }, []);

    async function loadRemoteTheme(user: { user_metadata?: Record<string, unknown> }) {
        try {
            const remoteTheme = user.user_metadata?.theme_preference;
            if (remoteTheme === "dark" || remoteTheme === "light") {
                setThemeState(remoteTheme);
                AsyncStorage.setItem(THEME_KEY, remoteTheme);
            } else {
                // No remote preference saved yet — use system theme
                setThemeState(getSystemTheme());
            }
        } catch (err) {
            console.error("Error loading remote theme:", err);
        }
    }

    async function setTheme(newTheme: Theme) {
        setThemeState(newTheme);
        AsyncStorage.setItem(THEME_KEY, newTheme);

        // Sync to Supabase if logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.auth.updateUser({
                data: { theme_preference: newTheme },
            });
        }
    }

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => {
            const next = prev === "light" ? "dark" : "light";
            AsyncStorage.setItem(THEME_KEY, next);

            // Sync to Supabase (fire-and-forget)
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    supabase.auth.updateUser({
                        data: { theme_preference: next },
                    });
                }
            });

            return next;
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}