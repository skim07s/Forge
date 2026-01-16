import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Zustand store with AsyncStorage persistence
export const useIngotStore = create(
  persist(
    (set) => ({
      ingots: [],

      addIngot: (title) => {
        const newIngot = {
          id: Date.now().toString(),
          title: title.trim(),
          result: false, // false = pending, true = complete
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ ingots: [newIngot, ...state.ingots] }));
      },

      toggleIngot: (id) => {
        set((state) => ({
          ingots: state.ingots.map((item) =>
            item.id === id ? { ...item, result: !item.result } : item
          ),
        }));
      },

      deleteIngot: (id) => {
        set((state) => ({
          ingots: state.ingots.filter((item) => item.id !== id),
        }));
      },
    }),
    {
      name: "forge-ingots-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
