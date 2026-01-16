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

      // Delete a habit
      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
        }));
      },

      // Toggle habit completion for today
      toggleHabit: (id) => {
        const today = getToday();
        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== id) return habit;

            const isCompletedToday = (habit.completedDates || []).includes(today);
            const newCompletedDates = isCompletedToday
              ? (habit.completedDates || []).filter((d) => d !== today)
              : [...(habit.completedDates || []), today];

            return {
              ...habit,
              completedToday: !isCompletedToday,
              completedDates: newCompletedDates,
              streak: calculateStreak(newCompletedDates),
            };
          }),
        }));
      },

      // Toggle completion for a specific date (retroactive tracking)
      toggleDateForHabit: (habitId, date) => {
        const today = getToday();
        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== habitId) return habit;

            const isCompleted = (habit.completedDates || []).includes(date);
            const newCompletedDates = isCompleted
              ? (habit.completedDates || []).filter((d) => d !== date)
              : [...(habit.completedDates || []), date];

            const isToday = date === today;

            return {
              ...habit,
              completedDates: newCompletedDates,
              completedToday: isToday
                ? newCompletedDates.includes(today)
                : habit.completedToday,
              streak: calculateStreak(newCompletedDates),
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
