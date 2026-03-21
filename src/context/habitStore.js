import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { appStorage } from "../utils/storage";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateStr) => {
  if (typeof dateStr !== "string" || !DATE_PATTERN.test(dateStr)) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const sanitizeText = (value, maxLength) =>
  String(value ?? "")
    .trim()
    .slice(0, maxLength);

const unique = (values) => Array.from(new Set(values));

const getToday = () => formatLocalDate(new Date());
const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeNotificationId = (value) =>
  typeof value === "string" && value.trim() ? value : null;

// Calculate streak from completedDates
const calculateStreak = (completedDates) => {
  if (!completedDates || completedDates.length === 0) return 0;

  const today = getToday();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterday);

  const sorted = unique(
    completedDates.filter((value) => typeof value === "string" && DATE_PATTERN.test(value))
  ).sort((a, b) => b.localeCompare(a));
  if (sorted.length === 0) return 0;

  // Check if streak is active (completed today or yesterday)
  if (sorted[0] !== today && sorted[0] !== yesterdayStr) return 0;

  let streak = 0;
  let checkDate = parseLocalDate(sorted[0]);
  if (!checkDate) return 0;

  for (const dateStr of sorted) {
    const expectedStr = formatLocalDate(checkDate);
    if (dateStr === expectedStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr < expectedStr) {
      break;
    }
  }

  return streak;
};

// Zustand store with MMKV-backed persistence
export const useHabitStore = create(
  persist(
    (set) => ({
      habits: [],

      // Add a new habit
      addHabit: (input) => {
        const payload =
          typeof input === "string"
            ? { title: sanitizeText(input, MAX_TITLE_LENGTH) }
            : {
                ...input,
                title: sanitizeText(input?.title, MAX_TITLE_LENGTH),
              };

        if (!payload.title) return null;

        const newHabit = {
          id: createId(),
          title: payload.title,
          description: sanitizeText(payload.description, MAX_DESCRIPTION_LENGTH),
          reminderEnabled: !!payload.reminderEnabled,
          reminderNotificationId: normalizeNotificationId(payload?.reminderNotificationId),
          streak: 0,
          completedToday: false,
          startDate: getToday(),
          completedDates: [],
        };

        set((state) => ({ habits: [...state.habits, newHabit] }));
        return newHabit;
      },

      setHabits: (habits) => {
        const safeHabits = Array.isArray(habits)
          ? habits
              .map((habit) => {
                const title = sanitizeText(habit?.title, MAX_TITLE_LENGTH);
                if (!title) return null;

                const completedDates = unique(
                  Array.isArray(habit?.completedDates)
                    ? habit.completedDates.filter(
                        (value) =>
                          typeof value === "string" && DATE_PATTERN.test(value)
                      )
                    : []
                ).sort((a, b) => b.localeCompare(a));

                const today = getToday();
                const oldestCompletedDate =
                  completedDates[completedDates.length - 1];
                return {
                  id: String(habit?.id || createId()),
                  title,
                  description: sanitizeText(
                    habit?.description,
                    MAX_DESCRIPTION_LENGTH
                  ),
                  reminderEnabled: !!(habit?.reminderEnabled ?? habit?.reminder),
                  reminderNotificationId: normalizeNotificationId(
                    habit?.reminderNotificationId
                  ),
                  startDate:
                    typeof habit?.startDate === "string" &&
                    DATE_PATTERN.test(habit.startDate)
                      ? habit.startDate
                      : oldestCompletedDate || today,
                  completedDates,
                  completedToday: completedDates.includes(today),
                  streak: calculateStreak(completedDates),
                };
              })
              .filter(Boolean)
          : [];

        set({ habits: safeHabits });
      },

      updateHabit: (id, input) => {
        const nextTitle = sanitizeText(input?.title, MAX_TITLE_LENGTH);
        if (!nextTitle) return null;

        let updatedHabit = null;

        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== id) return habit;

            updatedHabit = {
              ...habit,
              title: nextTitle,
              description: sanitizeText(input?.description, MAX_DESCRIPTION_LENGTH),
              reminderEnabled: !!input?.reminderEnabled,
            };

            return updatedHabit;
          }),
        }));

        return updatedHabit;
      },

      setHabitReminderNotificationId: (id, notificationId) => {
        const safeNotificationId = normalizeNotificationId(notificationId);

        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id
              ? { ...habit, reminderNotificationId: safeNotificationId }
              : habit
          ),
        }));
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
        if (typeof dateStr !== "string" || !DATE_PATTERN.test(dateStr)) return;

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
      storage: createJSONStorage(() => appStorage),
    }
  )
);
