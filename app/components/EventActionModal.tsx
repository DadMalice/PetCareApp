import { View, Text, TouchableOpacity, Modal, Alert, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { PetEvent } from "../../types";

type Props = {
    visible: boolean;
    event: PetEvent | null;
    onClose: () => void;
    onDelete: (eventId: string) => void;
};

export default function EventActionModal({ visible, event, onClose, onDelete }: Props) {
    const router = useRouter();
    const slideAnim = useRef(new Animated.Value(500)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            slideAnim.setValue(500);
        }
    }, [visible]);

    if (!event) return null;

    const eventId = event.id;

    function handleEdit() {
        onClose();
        router.push(`/add-event?eventId=${eventId}`);
    }

    function handleDelete() {
        Alert.alert(
            "Delete Event",
            "Are you sure you want to delete this event? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        onDelete(eventId);
                        onClose();
                    },
                },
            ]
        );
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                className="flex-1 bg-black/40 justify-end"
                activeOpacity={1}
                onPress={onClose}
            >
                <Animated.View
                    style={{ transform: [{ translateY: slideAnim }] }}
                >
                    <View
                        className="bg-white rounded-t-3xl px-6 pt-8 pb-10"
                        style={{ elevation: 10 }}
                    >
                        {/* Event Preview */}
                        <View className="items-center mb-6">
                            <View
                                className="w-14 h-1 rounded-full bg-gray-300 mb-5"
                            />
                            <Text className="text-lg font-bold text-black text-center capitalize">
                                {event.type}
                            </Text>
                            <Text className="text-sm text-gray-400 mt-1 text-center">
                                {event.metadata?.name || event.metadata?.food_type || event.metadata?.category || ""}
                            </Text>
                        </View>

                        {/* Edit Button */}
                        <TouchableOpacity
                            className="flex-row items-center bg-gray-100 rounded-2xl px-5 py-4 mb-3"
                            onPress={handleEdit}
                        >
                            <View className="w-10 h-10 rounded-full bg-black items-center justify-center mr-4">
                                <Ionicons name="create-outline" size={20} color="#fff" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-black">Edit Event</Text>
                                <Text className="text-xs text-gray-400">Modify this event details</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                        </TouchableOpacity>

                        {/* Delete Button */}
                        <TouchableOpacity
                            className="flex-row items-center bg-red-50 rounded-2xl px-5 py-4"
                            onPress={handleDelete}
                        >
                            <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center mr-4">
                                <Ionicons name="trash-outline" size={20} color="#fff" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-red-600">Delete Event</Text>
                                <Text className="text-xs text-red-400">Remove this event permanently</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#fca5a5" />
                        </TouchableOpacity>

                        {/* Cancel */}
                        <TouchableOpacity
                            className="items-center mt-6 pt-4 border-t border-gray-100"
                            onPress={onClose}
                        >
                            <Text className="text-sm font-medium text-gray-500">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
}