import { useState } from "react";
import { View, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
    photoUrl?: string | null;
    size?: number;
    className?: string;
    variant?: 'default' | 'bg';
};

export default function PetAvatar({ photoUrl, size = 14, className = "", variant = "default" }: Props) {
    const [imageError, setImageError] = useState(false);

    const iconSize = Math.round(size * 0.6);
    const isDefaultVariant = variant === "default";

    if (photoUrl && !imageError) {
        return (
            <View
                className={`rounded-full overflow-hidden ${className}`}
                style={{ width: size, height: size }}
            >
                <Image
                    source={{ uri: photoUrl }}
                    style={{ width: size, height: size }}
                    resizeMode="cover"
                    onError={() => setImageError(true)} // Smoothly falls back to the icon below
                />
            </View>
        );
    }

    return (
        <View
            className={`rounded-full items-center justify-center ${className} ${isDefaultVariant ? 'bg-amber-200' : 'bg-gray-100 dark:bg-dark-card'
                }`}
            style={{ width: size, height: size }}
        >
            <MaterialCommunityIcons
                name="dog"
                size={iconSize}
                color={isDefaultVariant ? "#000" : "#9ca3af"}
                accessible={true}
                accessibilityLabel="Pet avatar"
            />
        </View>
    );
}