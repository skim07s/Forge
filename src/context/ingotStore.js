import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { appStorage } from "../utils/storage";

const MAX_INGOT_TITLE_LENGTH = 160;
const sanitizeTitle = (value) =>
  String(value ?? "")
    .trim()
    .slice(0, MAX_INGOT_TITLE_LENGTH);
const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Zustand store with MMKV-backed persistence
export const useIngotStore = create(
  persist(
    (set) => ({
      ingots: [],

      addIngot: (title) => {
        const safeTitle = sanitizeTitle(title);
        if (!safeTitle) return;

        const newIngot = {
          id: createId(),
          title: safeTitle,
          result: false, // false = pending, true = complete
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ ingots: [newIngot, ...state.ingots] }));
      },

      setIngots: (ingots) => {
        const safeIngots = Array.isArray(ingots)
          ? ingots
              .map((ingot) => {
                const title = sanitizeTitle(ingot?.title);
                if (!title) return null;

                return {
                  id: String(ingot?.id || createId()),
                  title,
                  result: !!ingot?.result,
                  createdAt:
                    typeof ingot?.createdAt === "string"
                      ? ingot.createdAt
                      : new Date().toISOString(),
                };
              })
              .filter(Boolean)
          : [];

        set({ ingots: safeIngots });
      },

      updateIngot: (id, title) => {
        const safeTitle = sanitizeTitle(title);
        if (!safeTitle) return;

        set((state) => ({
          ingots: state.ingots.map((item) =>
            item.id === id ? { ...item, title: safeTitle } : item
          ),
        }));
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
      storage: createJSONStorage(() => appStorage),
    }
  )
);
