import { create } from "zustand";
import { Platform } from "react-native";

// Platform-aware storage
let storage = null;

// Initialize storage based on platform
try {
  if (Platform.OS !== "web") {
    const { MMKV } = require("react-native-mmkv");
    storage = new MMKV();
  }
} catch (error) {
  console.warn("MMKV initialization failed, falling back to localStorage");
}

// Get today's date in YYYY-MM-DD format
const getToday = () => new Date().toISOString().split("T")[0];

// Storage adapter
const storageAdapter = {
  getString: (key) => {
    if (storage && Platform.OS !== "web") {
      return storage.getString(key);
    }
    // Fallback to localStorage for web
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
    return null;
  },
  set: (key, value) => {
    if (storage && Platform.OS !== "web") {
      storage.set(key, value);
    }
    // Fallback to localStorage for web
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  },
  delete: (key) => {
    if (storage && Platform.OS !== "web") {
      storage.delete(key);
    }
    // Fallback to localStorage for web
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
  },
};

// Zustand store with platform-aware persistence
export const useHabitStore = create((set, get) => {
  // Load initial habits from storage
  const loadHabitsFromStorage = () => {
    try {
      const stored = storageAdapter.getString("habits");
      if (!stored) return [];
      
      // Parse and hydrate habits - recalculate completedToday based on today's date
      const habits = JSON.parse(stored);
      const today = getToday();
      return habits.map(habit => ({
        ...habit,
        completedDates: habit.completedDates || [],
        completedToday: (habit.completedDates || []).includes(today),
      }));
    } catch (error) {
      console.error("Error loading habits from storage:", error);
      return [];
    }
  };

  // Save habits to storage
  const saveHabitsToStorage = (habits) => {
    try {
      storageAdapter.set("habits", JSON.stringify(habits));
    } catch (error) {
      console.error("Error saving habits to storage:", error);
    }
  };

  return {
    habits: loadHabitsFromStorage(),

    // Add a new habit
    addHabit: (input) => {
      set((state) => {
        const payload =
          typeof input === "string"
            ? { title: input.trim() }
            : { ...input, title: (input?.title || "").trim() };

        if (!payload.title) return {};

        const newHabit = {
          id: Date.now().toString(),
          title: payload.title,
          description: payload.description || "",
          reminderEnabled: !!payload.reminderEnabled,
          streak: 0,
          completedToday: false,
          startDate: getToday(),
          completedDates: [], // Ensure new habits have this array
        };
        const updatedHabits = [...state.habits, newHabit];
        saveHabitsToStorage(updatedHabits);
        return { habits: updatedHabits };
      });
    },

    // Delete a habit
    deleteHabit: (id) => {
      set((state) => {
        const updatedHabits = state.habits.filter((habit) => habit.id !== id);
        saveHabitsToStorage(updatedHabits);
        return { habits: updatedHabits };
      });
    },

    // Toggle habit completion for today
    toggleHabit: (id) => {
      set((state) => {
        const today = getToday();
        const updatedHabits = state.habits.map((habit) => {
          if (habit.id !== id) return habit;

          const isCompletedToday = (habit.completedDates || []).includes(today);
          const newCompletedDates = isCompletedToday
            ? (habit.completedDates || []).filter((d) => d !== today)
            : [...(habit.completedDates || []), today];

          return {
            ...habit,
            completedToday: newCompletedDates.includes(today),
            completedDates: newCompletedDates,
            streak: isCompletedToday
              ? Math.max(0, habit.streak - 1)
              : habit.streak + 1,
          };
        });
        saveHabitsToStorage(updatedHabits);
        return { habits: updatedHabits };
      });
    },

    // Toggle completion for a specific date (retroactive tracking)
    toggleDateForHabit: (habitId, date) => {
      set((state) => {
        const updatedHabits = state.habits.map((habit) => {
          if (habit.id !== habitId) return habit;

          const isCompleted = (habit.completedDates || []).includes(date);
          const newCompletedDates = isCompleted
            ? (habit.completedDates || []).filter((d) => d !== date)
            : [...(habit.completedDates || []), date];

          const today = getToday();
          const isToday = date === today;

          return {
            ...habit,
            completedDates: newCompletedDates,
            completedToday: isToday
              ? newCompletedDates.includes(today)
              : habit.completedToday,
            streak: isToday
              ? isCompleted
                ? Math.max(0, habit.streak - 1)
                : habit.streak + 1
              : habit.streak,
          };
        });
        saveHabitsToStorage(updatedHabits);
        return { habits: updatedHabits };
      });
    },

    // Clear all habits (for debugging)
    clearAllHabits: () => {
      set(() => {
        storageAdapter.delete("habits");
        return { habits: [] };
      });
    },

    // Refresh completedToday for all habits (call when day changes)
    refreshCompletedToday: () => {
      set((state) => {
        const today = getToday();
        const updatedHabits = state.habits.map((habit) => ({
          ...habit,
          completedToday: (habit.completedDates || []).includes(today),
        }));
        return { habits: updatedHabits };
      });
    },
  };
});
