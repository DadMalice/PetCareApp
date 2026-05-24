/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}"
    ],
    presets: [require("nativewind/preset")],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                dark: {
                    bg: "#0f0f0f",
                    card: "#1c1c1e",
                    border: "#2c2c2e",
                    text: "#f5f5f7",
                    "text-secondary": "#98989d",
                    "text-tertiary": "#636366",
                },
            },
        },
    },
    plugins: [],
};