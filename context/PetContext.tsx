import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Pet } from "../types/index";

type PetContextType = {
    pets: Pet[];
    selectedPet: Pet | null;
    setSelectedPet: (pet: Pet) => void;
    refreshPets: () => Promise<void>;
    petsLoading: boolean;
};

const PetContext = createContext<PetContextType>({
    pets: [],
    selectedPet: null,
    setSelectedPet: () => { },
    refreshPets: async () => { },
    petsLoading: true,
});

export function PetProvider({ children }: { children: ReactNode }) {
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [petsLoading, setPetsLoading] = useState(true);

    async function refreshPets() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setPets([]);
                setSelectedPet(null);
                setPetsLoading(false);
                return;
            }

            const { data: petsData } = await supabase
                .from("pets")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });

            if (petsData && petsData.length > 0) {
                setPets(petsData);
                setSelectedPet((prev) => {
                    const stillExists = petsData.find((p) => p.id === prev?.id);
                    return stillExists ?? petsData[0];
                });
            } else {
                setPets([]);
                setSelectedPet(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPetsLoading(false);
        }
    }

    useEffect(() => {
        // Initial load
        refreshPets();

        // Listen to auth changes — re-fetch pets on login/logout
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event) => {
                if (event === "SIGNED_IN") {
                    setPetsLoading(true);
                    refreshPets();
                }
                if (event === "SIGNED_OUT") {
                    setPets([]);
                    setSelectedPet(null);
                    setPetsLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return (
        <PetContext.Provider value={{ pets, selectedPet, setSelectedPet, refreshPets, petsLoading }}>
            {children}
        </PetContext.Provider>
    );
}

export function usePet() {
    return useContext(PetContext);
}