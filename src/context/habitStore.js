import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { appStorage } from "../utils/storage";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
export const STREAK_FREEZE_GEM_COST = 5;
const ALL_WEEKDAYS = Object.freeze([0, 1, 2, 3, 4, 5, 6]);
const MAX_SCHEDULE_SCAN_DAYS = 366;
const STREAK_REWARD_WEEK_LENGTH = 7;
const STREAK_REWARD_BASE_GEMS = 5;

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

const normalizeGems = (value) =>
  Math.max(0, Math.floor(Number.isFinite(value) ? value : Number(value) || 0));

const normalizeNotificationId = (value) =>
  typeof value === "string" && value.trim() ? value : null;

const normalizeActiveWeekdays = (values) => {
  const normalized = unique(
    Array.isArray(values)
      ? values
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
      : []
  ).sort((a, b) => a - b);

  return normalized.length > 0 ? normalized : [...ALL_WEEKDAYS];
};

const normalizeDateList = (values) =>
  unique(
    Array.isArray(values)
      ? values.filter(
          (value) => typeof value === "string" && DATE_PATTERN.test(value)
        )
      : []
  ).sort((a, b) => b.localeCompare(a));

const normalizeMilestones = (values) =>
  unique(
    Array.isArray(values)
      ? values
          .map((value) => Number(value))
          .filter(
            (value) =>
              Number.isInteger(value) &&
              value > 0 &&
              value % STREAK_REWARD_WEEK_LENGTH === 0
          )
      : []
  ).sort((a, b) => a - b);

const getMilestonesForStreak = (streakValue) => {
  const streak = Math.max(
    0,
    Math.floor(Number.isFinite(streakValue) ? streakValue : Number(streakValue) || 0)
  );
  const weeks = Math.floor(streak / STREAK_REWARD_WEEK_LENGTH);
  return Array.from(
    { length: weeks },
    (_, index) => (index + 1) * STREAK_REWARD_WEEK_LENGTH
  );
};

const getRewardForMilestone = (milestoneValue) => {
  const milestone = Number(milestoneValue);
  if (
    !Number.isInteger(milestone) ||
    milestone <= 0 ||
    milestone % STREAK_REWARD_WEEK_LENGTH !== 0
  ) {
    return 0;
  }

  const weekIndex = milestone / STREAK_REWARD_WEEK_LENGTH - 1;
  const reward = STREAK_REWARD_BASE_GEMS * 2 ** weekIndex;
  if (!Number.isFinite(reward) || reward <= 0) {
    return 0;
  }

  return Math.floor(reward);
};

const shiftDateString = (dateStr, dayOffset) => {
  const parsedDate = parseLocalDate(dateStr);
  if (!parsedDate || !Number.isFinite(dayOffset)) return null;
  parsedDate.setDate(parsedDate.getDate() + dayOffset);
  return formatLocalDate(parsedDate);
};

const getScheduledDateAtOrBefore = (dateStr, activeWeekdays = ALL_WEEKDAYS) => {
  const parsedDate = parseLocalDate(dateStr);
  if (!parsedDate) return null;

  const weekdaySet = new Set(normalizeActiveWeekdays(activeWeekdays));
  for (let i = 0; i < MAX_SCHEDULE_SCAN_DAYS; i++) {
    if (weekdaySet.has(parsedDate.getDay())) {
      return formatLocalDate(parsedDate);
    }
    parsedDate.setDate(parsedDate.getDate() - 1);
  }

  return null;
};

const getPreviousScheduledDate = (dateStr, activeWeekdays = ALL_WEEKDAYS) => {
  const parsedDate = parseLocalDate(dateStr);
  if (!parsedDate) return null;

  const weekdaySet = new Set(normalizeActiveWeekdays(activeWeekdays));
  parsedDate.setDate(parsedDate.getDate() - 1);

  for (let i = 0; i < MAX_SCHEDULE_SCAN_DAYS; i++) {
    if (weekdaySet.has(parsedDate.getDay())) {
      return formatLocalDate(parsedDate);
    }
    parsedDate.setDate(parsedDate.getDate() - 1);
  }

  return null;
};

const getNextScheduledDate = (dateStr, activeWeekdays = ALL_WEEKDAYS) => {
  const parsedDate = parseLocalDate(dateStr);
  if (!parsedDate) return null;

  const weekdaySet = new Set(normalizeActiveWeekdays(activeWeekdays));
  parsedDate.setDate(parsedDate.getDate() + 1);

  for (let i = 0; i < MAX_SCHEDULE_SCAN_DAYS; i++) {
    if (weekdaySet.has(parsedDate.getDay())) {
      return formatLocalDate(parsedDate);
    }
    parsedDate.setDate(parsedDate.getDate() + 1);
  }

  return null;
};

const isDateScheduled = (dateStr, activeWeekdays = ALL_WEEKDAYS) => {
  const parsedDate = parseLocalDate(dateStr);
  if (!parsedDate) return false;
  return new Set(normalizeActiveWeekdays(activeWeekdays)).has(parsedDate.getDay());
};

const getFreezeTargetDateForToday = (activeWeekdays = ALL_WEEKDAYS) => {
  const today = getToday();
  if (isDateScheduled(today, activeWeekdays)) {
    return getPreviousScheduledDate(today, activeWeekdays);
  }

  return getScheduledDateAtOrBefore(today, activeWeekdays);
};

// Calculate streak from completedDates and frozenDates.
// Frozen days count toward streak length.
// Only scheduled weekdays contribute to streak count.
const calculateStreak = (
  completedDates,
  frozenDates = [],
  activeWeekdays = ALL_WEEKDAYS
) => {
  const safeWeekdays = normalizeActiveWeekdays(activeWeekdays);
  const completedSet = new Set(
    normalizeDateList(completedDates).filter((date) =>
      isDateScheduled(date, safeWeekdays)
    )
  );
  const frozenSet = new Set(
    normalizeDateList(frozenDates).filter((date) =>
      isDateScheduled(date, safeWeekdays)
    )
  );
  if (completedSet.size === 0) return 0;

  const today = getToday();
  const cursorStart = getScheduledDateAtOrBefore(today, safeWeekdays);
  if (!cursorStart) return 0;
  if (!completedSet.has(cursorStart) && !frozenSet.has(cursorStart)) {
    return 0;
  }

  let streak = 0;
  let cursor = cursorStart;

  while (cursor) {
    if (completedSet.has(cursor) || frozenSet.has(cursor)) {
      streak++;
      cursor = getPreviousScheduledDate(cursor, safeWeekdays);
      continue;
    }

    break;
  }

  return streak;
};

const calculateMaximumHistoricalStreak = (
  completedDates,
  frozenDates = [],
  activeWeekdays = ALL_WEEKDAYS
) => {
  const safeWeekdays = normalizeActiveWeekdays(activeWeekdays);
  const completed = normalizeDateList(completedDates).filter((date) =>
    isDateScheduled(date, safeWeekdays)
  );
  const frozen = normalizeDateList(frozenDates).filter((date) =>
    isDateScheduled(date, safeWeekdays)
  );

  if (completed.length === 0) return 0;

  const completedSet = new Set(completed);
  const frozenSet = new Set(frozen);
  const continuityDates = normalizeDateList([...completed, ...frozen]);
  const earliestDate = continuityDates[continuityDates.length - 1];
  const latestDate = getScheduledDateAtOrBefore(getToday(), safeWeekdays);

  if (!earliestDate || !latestDate || earliestDate > latestDate) return 0;

  let cursor = earliestDate;
  let runningStreak = 0;
  let maxStreak = 0;
  let scanCount = 0;
  const maxScanDays = MAX_SCHEDULE_SCAN_DAYS * 20;

  while (cursor && scanCount < maxScanDays) {
    scanCount += 1;

    if (completedSet.has(cursor) || frozenSet.has(cursor)) {
      runningStreak += 1;
      if (runningStreak > maxStreak) {
        maxStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }

    if (cursor >= latestDate) break;

    const nextCursor = getNextScheduledDate(cursor, safeWeekdays);
    if (!nextCursor || nextCursor === cursor) break;
    cursor = nextCursor;
  }

  return maxStreak;
};

const mergeClaimedMilestonesWithHistory = (
  claimedMilestones,
  completedDates,
  frozenDates = [],
  activeWeekdays = ALL_WEEKDAYS
) => {
  const normalizedClaimed = normalizeMilestones(claimedMilestones);
  const maxHistoricalStreak = calculateMaximumHistoricalStreak(
    completedDates,
    frozenDates,
    activeWeekdays
  );
  const historicalMilestones = getMilestonesForStreak(maxHistoricalStreak);

  return normalizeMilestones([...normalizedClaimed, ...historicalMilestones]);
};

const calculateGemBalanceFromHistory = (habits) => {
  if (!Array.isArray(habits) || habits.length === 0) {
    return 0;
  }

  let earnedGems = 0;
  let spentGems = 0;

  for (const habit of habits) {
    const activeWeekdays = normalizeActiveWeekdays(habit?.activeWeekdays);
    const rewardedMilestones = normalizeMilestones(habit?.rewardedMilestones);
    const frozenDates = normalizeDateList(habit?.frozenDates).filter((date) =>
      isDateScheduled(date, activeWeekdays)
    );

    for (const milestone of rewardedMilestones) {
      earnedGems += getRewardForMilestone(milestone);
    }

    spentGems += frozenDates.length * STREAK_FREEZE_GEM_COST;
  }

  return normalizeGems(earnedGems - spentGems);
};

const normalizeHabitRecord = (habit) => {
  const title = sanitizeText(habit?.title, MAX_TITLE_LENGTH);
  if (!title) return null;

  const completedDates = normalizeDateList(habit?.completedDates);
  const activeWeekdays = normalizeActiveWeekdays(habit?.activeWeekdays);
  const frozenDates = normalizeDateList(habit?.frozenDates).filter((date) =>
    isDateScheduled(date, activeWeekdays)
  );
  const rewardedMilestones = mergeClaimedMilestonesWithHistory(
    habit?.rewardedMilestones,
    completedDates,
    frozenDates,
    activeWeekdays
  );
  const today = getToday();
  const oldestCompletedDate = completedDates[completedDates.length - 1];

  return {
    id: String(habit?.id || createId()),
    title,
    description: sanitizeText(habit?.description, MAX_DESCRIPTION_LENGTH),
    reminderEnabled: !!(habit?.reminderEnabled ?? habit?.reminder),
    reminderNotificationId: normalizeNotificationId(habit?.reminderNotificationId),
    activeWeekdays,
    startDate:
      typeof habit?.startDate === "string" && DATE_PATTERN.test(habit.startDate)
        ? habit.startDate
        : oldestCompletedDate || today,
    completedDates,
    frozenDates,
    rewardedMilestones,
    completedToday:
      isDateScheduled(today, activeWeekdays) && completedDates.includes(today),
    streak: calculateStreak(completedDates, frozenDates, activeWeekdays),
  };
};

const migratePersistedState = (persistedState, version) => {
  const previousState =
    persistedState && typeof persistedState === "object" ? persistedState : {};
  const habits = Array.isArray(previousState?.habits)
    ? previousState.habits.map((habit) => normalizeHabitRecord(habit)).filter(Boolean)
    : [];

  const migrated = {
    ...previousState,
    habits,
    gems: normalizeGems(previousState?.gems),
  };

  // Migrate old stores to history-based gems so previous streak/freeze data is counted.
  if ((version ?? 0) < 2) {
    migrated.gems = calculateGemBalanceFromHistory(habits);
  }

  return migrated;
};

const applyMilestoneRewards = (
  previousStreak,
  nextStreak,
  claimedMilestones = []
) => {
  const claimedSet = new Set(normalizeMilestones(claimedMilestones));
  let gemsEarned = 0;

  const claimableMilestones = getMilestonesForStreak(nextStreak);
  for (const milestone of claimableMilestones) {
    if (previousStreak >= milestone || claimedSet.has(milestone)) continue;
    claimedSet.add(milestone);
    gemsEarned += getRewardForMilestone(milestone);
  }

  return {
    claimedMilestones: Array.from(claimedSet).sort((a, b) => a - b),
    gemsEarned,
  };
};

const maybeConsumeFreezeForToday = (
  habit,
  availableGems,
  options = { manual: false }
) => {
  const safeGems = normalizeGems(availableGems);
  const frozenDates = normalizeDateList(habit?.frozenDates);
  const completedDates = normalizeDateList(habit?.completedDates);
  const activeWeekdays = normalizeActiveWeekdays(habit?.activeWeekdays);

  if (safeGems < STREAK_FREEZE_GEM_COST) {
    return { frozenDates, gemsSpent: 0, reason: "insufficient_gems" };
  }

  const today = getToday();
  const missedScheduledDate = options?.manual
    ? getFreezeTargetDateForToday(activeWeekdays)
    : getPreviousScheduledDate(today, activeWeekdays);
  const dayBeforeMissedScheduledDate = missedScheduledDate
    ? getPreviousScheduledDate(missedScheduledDate, activeWeekdays)
    : null;

  if (!missedScheduledDate || !dayBeforeMissedScheduledDate) {
    return { frozenDates, gemsSpent: 0, reason: "invalid_date" };
  }

  const continuityDates = new Set([
    ...completedDates,
    ...frozenDates,
  ]);

  const hasMissedDate = continuityDates.has(missedScheduledDate);
  const hasDayBeforeMissed = continuityDates.has(dayBeforeMissedScheduledDate);
  const freezeAlreadyUsedForMissedDate = frozenDates.includes(missedScheduledDate);

  if (freezeAlreadyUsedForMissedDate) {
    return { frozenDates, gemsSpent: 0, reason: "already_frozen" };
  }

  if (hasMissedDate) {
    return { frozenDates, gemsSpent: 0, reason: "no_missed_day" };
  }

  if (!hasDayBeforeMissed) {
    return { frozenDates, gemsSpent: 0, reason: "no_active_streak" };
  }

  return {
    frozenDates: normalizeDateList([...frozenDates, missedScheduledDate]),
    gemsSpent: STREAK_FREEZE_GEM_COST,
    reason: "applied",
  };
};

// Zustand store with MMKV-backed persistence
export const useHabitStore = create(
  persist(
    (set) => ({
      habits: [],
      gems: 0,

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
          activeWeekdays: normalizeActiveWeekdays(payload?.activeWeekdays),
          streak: 0,
          completedToday: false,
          startDate: getToday(),
          completedDates: [],
          frozenDates: [],
          rewardedMilestones: [],
        };

        set((state) => ({ habits: [...state.habits, newHabit] }));
        return newHabit;
      },

      setHabits: (habits) => {
        const safeHabits = Array.isArray(habits)
          ? habits.map((habit) => normalizeHabitRecord(habit)).filter(Boolean)
          : [];

        set({ habits: safeHabits });
      },

      setGems: (gems) => {
        set({ gems: normalizeGems(gems) });
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
              activeWeekdays: normalizeActiveWeekdays(
                Array.isArray(input?.activeWeekdays)
                  ? input.activeWeekdays
                  : habit?.activeWeekdays
              ),
            };

            updatedHabit.completedToday =
              isDateScheduled(getToday(), updatedHabit.activeWeekdays) &&
              normalizeDateList(updatedHabit.completedDates).includes(getToday());
            updatedHabit.streak = calculateStreak(
              updatedHabit.completedDates,
              updatedHabit.frozenDates,
              updatedHabit.activeWeekdays
            );
            updatedHabit.rewardedMilestones = mergeClaimedMilestonesWithHistory(
              updatedHabit.rewardedMilestones,
              updatedHabit.completedDates,
              updatedHabit.frozenDates,
              updatedHabit.activeWeekdays
            );

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

        set((state) => {
          let nextGems = normalizeGems(state.gems);
          const nextHabits = state.habits.map((habit) => {
            if (habit.id !== id) return habit;

            const completedDates = normalizeDateList(habit.completedDates);
            const frozenDates = normalizeDateList(habit.frozenDates);
            const activeWeekdays = normalizeActiveWeekdays(habit.activeWeekdays);
            const wasCompletedToday = completedDates.includes(today);
            const isScheduledToday = isDateScheduled(today, activeWeekdays);
            if (!isScheduledToday && !wasCompletedToday) {
              return habit;
            }

            const previousStreak = calculateStreak(
              completedDates,
              frozenDates,
              activeWeekdays
            );
            let newDates = completedDates;
            let newFrozenDates = frozenDates;

            if (wasCompletedToday) {
              newDates = completedDates.filter((d) => d !== today);
            } else {
              newDates = normalizeDateList([...completedDates, today]);
              const freezeResult = maybeConsumeFreezeForToday(
                { ...habit, completedDates, frozenDates },
                nextGems,
                { manual: false }
              );
              if (freezeResult.gemsSpent > 0) {
                newFrozenDates = freezeResult.frozenDates;
                nextGems -= freezeResult.gemsSpent;
              }
            }

            const nextStreak = calculateStreak(
              newDates,
              newFrozenDates,
              activeWeekdays
            );
            const rewardResult = applyMilestoneRewards(
              previousStreak,
              nextStreak,
              habit.rewardedMilestones
            );
            if (rewardResult.gemsEarned > 0) {
              nextGems += rewardResult.gemsEarned;
            }

            return {
              ...habit,
              completedDates: newDates,
              frozenDates: newFrozenDates,
              rewardedMilestones: rewardResult.claimedMilestones,
              completedToday:
                isDateScheduled(today, activeWeekdays) &&
                newDates.includes(today),
              streak: nextStreak,
            };
          });

          return {
            gems: nextGems,
            habits: nextHabits,
          };
        });
      },

      // Toggle completion for a specific date
      toggleDateForHabit: (id, dateStr) => {
        if (typeof dateStr !== "string" || !DATE_PATTERN.test(dateStr)) return;

        set((state) => {
          let nextGems = normalizeGems(state.gems);
          const today = getToday();
          const nextHabits = state.habits.map((habit) => {
            if (habit.id !== id) return habit;

            const completedDates = normalizeDateList(habit.completedDates);
            const frozenDates = normalizeDateList(habit.frozenDates);
            const activeWeekdays = normalizeActiveWeekdays(habit.activeWeekdays);
            const wasCompleted = completedDates.includes(dateStr);
            const isScheduledForDate = isDateScheduled(dateStr, activeWeekdays);
            if (!isScheduledForDate && !wasCompleted) {
              return habit;
            }

            const previousStreak = calculateStreak(
              completedDates,
              frozenDates,
              activeWeekdays
            );
            let newDates = completedDates;
            let newFrozenDates = frozenDates;

            if (wasCompleted) {
              newDates = completedDates.filter((d) => d !== dateStr);
            } else {
              newDates = normalizeDateList([...completedDates, dateStr]);
              if (dateStr === today) {
                const freezeResult = maybeConsumeFreezeForToday(
                  { ...habit, completedDates, frozenDates },
                  nextGems,
                  { manual: false }
                );
                if (freezeResult.gemsSpent > 0) {
                  newFrozenDates = freezeResult.frozenDates;
                  nextGems -= freezeResult.gemsSpent;
                }
              }
            }

            const nextStreak = calculateStreak(
              newDates,
              newFrozenDates,
              activeWeekdays
            );
            const rewardResult = applyMilestoneRewards(
              previousStreak,
              nextStreak,
              habit.rewardedMilestones
            );
            if (rewardResult.gemsEarned > 0) {
              nextGems += rewardResult.gemsEarned;
            }

            return {
              ...habit,
              completedDates: newDates,
              frozenDates: newFrozenDates,
              rewardedMilestones: rewardResult.claimedMilestones,
              completedToday:
                isDateScheduled(today, activeWeekdays) &&
                newDates.includes(today),
              streak: nextStreak,
            };
          });

          return {
            gems: nextGems,
            habits: nextHabits,
          };
        });
      },

      useFreezeForHabit: (id) => {
        if (!id) {
          return {
            ok: false,
            reason: "not_found",
            gemsSpent: 0,
          };
        }

        let outcome = {
          ok: false,
          reason: "not_found",
          gemsSpent: 0,
        };

        set((state) => {
          const habit = state.habits.find((item) => item.id === id);
          if (!habit) return state;

          const safeGems = normalizeGems(state.gems);
          const activeWeekdays = normalizeActiveWeekdays(habit.activeWeekdays);
          const freezeResult = maybeConsumeFreezeForToday(habit, safeGems, {
            manual: true,
          });
          if (freezeResult.gemsSpent <= 0) {
            outcome = {
              ok: false,
              reason: freezeResult.reason || "unavailable",
              gemsSpent: 0,
            };
            return state;
          }

          const completedDates = normalizeDateList(habit.completedDates);
          const newFrozenDates = freezeResult.frozenDates;
          const nextStreak = calculateStreak(
            completedDates,
            newFrozenDates,
            activeWeekdays
          );
          const nextGems = safeGems - freezeResult.gemsSpent;
          const today = getToday();

          outcome = {
            ok: true,
            reason: "applied",
            gemsSpent: freezeResult.gemsSpent,
          };

          return {
            gems: nextGems,
            habits: state.habits.map((item) =>
              item.id === id
                ? {
                    ...item,
                    frozenDates: newFrozenDates,
                    completedToday:
                      isDateScheduled(today, activeWeekdays) &&
                      completedDates.includes(today),
                    streak: nextStreak,
                  }
                : item
            ),
          };
        });

        return outcome;
      },

      removeFreezeForHabit: (id) => {
        if (!id) {
          return {
            ok: false,
            reason: "not_found",
            gemsRefunded: 0,
          };
        }

        let outcome = {
          ok: false,
          reason: "not_found",
          gemsRefunded: 0,
        };

        set((state) => {
          const habit = state.habits.find((item) => item.id === id);
          if (!habit) return state;

          const activeWeekdays = normalizeActiveWeekdays(habit.activeWeekdays);
          const today = getToday();
          const freezeTargetDate = getFreezeTargetDateForToday(activeWeekdays);
          if (!freezeTargetDate) {
            outcome = {
              ok: false,
              reason: "invalid_date",
              gemsRefunded: 0,
            };
            return state;
          }

          const completedDates = normalizeDateList(habit.completedDates);
          const frozenDates = normalizeDateList(habit.frozenDates);
          if (!frozenDates.includes(freezeTargetDate)) {
            outcome = {
              ok: false,
              reason: "no_freeze",
              gemsRefunded: 0,
            };
            return state;
          }

          const newFrozenDates = frozenDates.filter(
            (date) => date !== freezeTargetDate
          );
          const nextStreak = calculateStreak(
            completedDates,
            newFrozenDates,
            activeWeekdays
          );
          const nextGems =
            normalizeGems(state.gems) + STREAK_FREEZE_GEM_COST;

          outcome = {
            ok: true,
            reason: "removed",
            gemsRefunded: STREAK_FREEZE_GEM_COST,
          };

          return {
            gems: nextGems,
            habits: state.habits.map((item) =>
              item.id === id
                ? {
                    ...item,
                    frozenDates: newFrozenDates,
                    completedToday:
                      isDateScheduled(today, activeWeekdays) &&
                      completedDates.includes(today),
                    streak: nextStreak,
                  }
                : item
            ),
          };
        });

        return outcome;
      },

      // Clear all habits (for debugging)
      clearAllHabits: () => {
        set({ habits: [], gems: 0 });
      },
    }),
    {
      name: "forge-habits-storage",
      storage: createJSONStorage(() => appStorage),
      version: 2,
      migrate: (persistedState, version) =>
        migratePersistedState(persistedState, version),
    }
  )
);
