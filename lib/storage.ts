import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "./supabase";

const BUCKET = "pet-photos";

/**
 * Upload a pet photo to Supabase Storage.
 * Uses expo-file-system to properly read local file URIs.
 * Returns the public URL or null on failure.
 */
export async function uploadPetPhoto(
    userId: string,
    petId: string,
    uri: string
): Promise<string | null> {
    try {
        // Read the file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Decode base64 to binary
        const decoded = base64ToUint8Array(base64);

        // Unique path: user_id / pet_id / timestamp.jpg
        const filePath = `${userId}/${petId}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, decoded, {
                contentType: "image/jpeg",
                upsert: false,
            });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    } catch (err) {
        console.error("Error uploading photo:", err);
        return null;
    }
}

/**
 * Delete a pet photo from Supabase Storage.
 * Extracts the file path from the full URL.
 */
export async function deletePetPhoto(photoUrl: string): Promise<boolean> {
    try {
        // Extract file path from URL: .../pet-photos/{filePath}
        const urlParts = photoUrl.split(`/${BUCKET}/`);
        if (urlParts.length < 2) return false;

        const filePath = urlParts[1].split("?")[0]; // remove query params

        const { error } = await supabase.storage
            .from(BUCKET)
            .remove([filePath]);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error deleting photo:", err);
        return false;
    }
}

/**
 * Convert a base64 string to a Uint8Array for Supabase upload.
 */
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}