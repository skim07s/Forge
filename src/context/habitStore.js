import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get today's date in YYYY-MM-DD format
const getToday = () => new Date().toISOString().split("T")[0];

// Calculate streak from completedDates
const calculateStreak = (completedDates) => {
  if (!completedDates || completedDates.length === 0) return 0;

  const today = getToday();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const sorted = [...completedDates].sort((a, b) => b.localeCompare(a));
  
  // Check if streak is active (completed today or yesterday)
  if (sorted[0] !== today && sorted[0] !== yesterdayStr) return 0;

  let streak = 0;
  let checkDate = new Date(sorted[0]);

  for (const dateStr of sorted) {
    const expectedStr = checkDate.toISOString().split("T")[0];
    if (dateStr === expectedStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr < expectedStr) {
      break;
    }
  }

  return streak;
};

// Zustand store with AsyncStorage persistence
export const useHabitStore = create(
  persist(
    (set, get) => ({
      habits: [],

      // Add a new habit
      addHabit: (input) => {
        const payload =
          typeof input === "string"
            ? { title: input.trim() }
            : { ...input, title: (input?.title || "").trim() };

        if (!payload.title) return;

        const newHabit = {
          id: Date.now().toString(),
          title: payload.title,
          description: payload.description || "",
          reminderEnabled: !!payload.reminderEnabled,
          streak: 0,
          completedToday: false,
          startDate: getToday(),
          completedDates: [],
        };

        set((state) => ({ habits: [...state.habits, newHabit] }));
      },

      // Delete a habit by ID
      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        }));
      },

      // Toggle today's completion for a habit
      toggleHabit: (id) => {
        const today = getToday();

        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== id) return habit;

            const wasCompletedToday = habit.completedDates?.includes(today);
            let newDates;

            if (wasCompletedToday) {
              newDates = habit.completedDates.filter((d) => d !== today);
            } else {
              newDates = [...(habit.completedDates || []), today];
            }

            return {
              ...habit,
              completedDates: newDates,
              completedToday: !wasCompletedToday,
              streak: calculateStreak(newDates),
            };
          }),
        }));
      },

      // Toggle completion for a specific date
      toggleDateForHabit: (id, dateStr) => {
        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== id) return habit;

            const wasCompleted = habit.completedDates?.includes(dateStr);
            let newDates;

            if (wasCompleted) {
              newDates = habit.completedDates.filter((d) => d !== dateStr);
            } else {
              newDates = [...(habit.completedDates || []), dateStr];
            }

            const today = getToday();
            return {
              ...habit,
              completedDates: newDates,
              completedToday: newDates.includes(today),
              streak: calculateStreak(newDates),
            };
          }),
        }));
      },

      // Clear all habits (for debugging)
      clearAllHabits: () => {
        set({ habits: [] });
      },
    }),
    {
      name: "forge-habits-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
