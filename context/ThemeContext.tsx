import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("light");

    useEffect(() => {
        // Load saved theme
        AsyncStorage.getItem(THEME_KEY).then((saved) => {
            if (saved === "dark" || saved === "light") {
                setThemeState(saved);
            }
        });
    }, []);

    function setTheme(newTheme: Theme) {
        setThemeState(newTheme);
        AsyncStorage.setItem(THEME_KEY, newTheme);
    }

    function toggleTheme() {
        setThemeState((prev) => {
            const next = prev === "light" ? "dark" : "light";
            AsyncStorage.setItem(THEME_KEY, next);
            return next;
        });
    }

    return (
        <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}