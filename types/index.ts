export type EventType =
    | "expense"
    | "feeding"
    | "medication"
    | "vaccine"
    | "symptom";

export type Pet = {
    id: string;
    user_id: string;
    name: string;
    breed: string;
    age_years: number;
    weight_kg: number;
    gender: "Male" | "Female";
    photo_url?: string;
    status: "Healthy" | "Sick" | "Under Medication";
    created_at: string;
};

export type PetEvent = {
    id: string;
    pet_id: string;
    user_id: string;
    type: EventType;
    timestamp: string;
    metadata: Record<string, any>;
    created_at: string;
};

export type Reminder = {
    id: string;
    user_id: string;
    pet_id: string;
    title: string;
    type: string;
    due_date: string;
    is_completed: boolean;
    completed_at: string | null;
    is_recurring: boolean;
    recurrence: string | null;
    is_active: boolean;
    created_at: string;
};