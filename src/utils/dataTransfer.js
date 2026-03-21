const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_HABIT_TITLE_LENGTH = 120;
const MAX_HABIT_DESCRIPTION_LENGTH = 500;
const MAX_INGOT_TITLE_LENGTH = 160;
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const MAX_SCHEDULE_SCAN_DAYS = 366;
const STREAK_FREEZE_GEM_COST = 5;
const STREAK_REWARD_WEEK_LENGTH = 7;
const STREAK_REWARD_BASE_GEMS = 5;

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value) => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getToday = () => formatLocalDate(new Date());
const sanitizeText = (value, maxLength) =>
  String(value ?? "")
    .trim()
    .slice(0, maxLength);

const isValidDateString = (value) =>
  typeof value === "string" && DATE_PATTERN.test(value);
const normalizeGems = (value) =>
  Math.max(0, Math.floor(Number.isFinite(value) ? value : Number(value) || 0));
const normalizeActiveWeekdays = (input) => {
  if (!Array.isArray(input)) return [...ALL_WEEKDAYS];

  const weekdays = Array.from(
    new Set(
      input
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    )
  ).sort((a, b) => a - b);

  return weekdays.length > 0 ? weekdays : [...ALL_WEEKDAYS];
};

const epochDayToDateString = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const utcDate = new Date(Date.UTC(1970, 0, 1) + value * DAY_MS);
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utcDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeCompletedDates = (input) => {
  if (!Array.isArray(input)) return [];

  const unique = new Set();

  for (const value of input) {
    if (isValidDateString(value)) {
      unique.add(value);
      continue;
    }

    const parsedEpochDay = epochDayToDateString(value);
    if (parsedEpochDay) {
      unique.add(parsedEpochDay);
    }
  }

  return Array.from(unique).sort((a, b) => b.localeCompare(a));
};

const normalizeMilestones = (input) => {
  if (!Array.isArray(input)) return [];

  const unique = new Set();
  for (const value of input) {
    const milestone = Number(value);
    if (
      Number.isInteger(milestone) &&
      milestone > 0 &&
      milestone % STREAK_REWARD_WEEK_LENGTH === 0
    ) {
      unique.add(milestone);
    }
  }

  return Array.from(unique).sort((a, b) => a - b);
};

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

const isDateScheduled = (dateStr, activeWeekdays = ALL_WEEKDAYS) => {
  const parsedDate = parseLocalDate(dateStr);
  if (!parsedDate) return false;
  return new Set(normalizeActiveWeekdays(activeWeekdays)).has(parsedDate.getDay());
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

const calculateMaximumHistoricalStreak = (
  completedDates,
  frozenDates = [],
  activeWeekdays = ALL_WEEKDAYS
) => {
  const safeWeekdays = normalizeActiveWeekdays(activeWeekdays);
  const completed = normalizeCompletedDates(completedDates).filter((date) =>
    isDateScheduled(date, safeWeekdays)
  );
  const frozen = normalizeCompletedDates(frozenDates).filter((date) =>
    isDateScheduled(date, safeWeekdays)
  );
  if (completed.length === 0) return 0;

  const completedSet = new Set(completed);
  const frozenSet = new Set(frozen);
  const continuityDates = normalizeCompletedDates([...completed, ...frozen]);
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
  const historicalMax = calculateMaximumHistoricalStreak(
    completedDates,
    frozenDates,
    activeWeekdays
  );
  const historicalMilestones = getMilestonesForStreak(historicalMax);
  return normalizeMilestones([...normalizeMilestones(claimedMilestones), ...historicalMilestones]);
};

const calculateStreak = (
  completedDates,
  frozenDates = [],
  activeWeekdays = ALL_WEEKDAYS
) => {
  if (!completedDates || completedDates.length === 0) return 0;

  const safeWeekdays = normalizeActiveWeekdays(activeWeekdays);
  const today = getToday();
  const frozenSet = new Set(
    normalizeCompletedDates(frozenDates).filter((date) =>
      isDateScheduled(date, safeWeekdays)
    )
  );

  const sorted = normalizeCompletedDates(completedDates).filter((date) =>
    isDateScheduled(date, safeWeekdays)
  );
  const completedSet = new Set(sorted);

  const cursorStart = getScheduledDateAtOrBefore(today, safeWeekdays);
  if (!cursorStart) return 0;
  if (!completedSet.has(cursorStart) && !frozenSet.has(cursorStart)) return 0;

  let streak = 0;
  let cursor = cursorStart;

  while (cursor) {
    if (completedSet.has(cursor) || frozenSet.has(cursor)) {
      streak += 1;
      cursor = getPreviousScheduledDate(cursor, safeWeekdays);
      continue;
    }

    break;
  }

  return streak;
};

const buildHabit = (habit, index = 0, completedDatesOverride = null) => {
  const title = sanitizeText(habit?.title, MAX_HABIT_TITLE_LENGTH);
  if (!title) return null;

  const completedDates = normalizeCompletedDates(
    completedDatesOverride ?? habit?.completedDates
  );
  const activeWeekdays = normalizeActiveWeekdays(habit?.activeWeekdays);
  const frozenDates = normalizeCompletedDates(habit?.frozenDates).filter((date) =>
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
  const startDate = isValidDateString(habit?.startDate)
    ? habit.startDate
    : oldestCompletedDate || today;

  return {
    id: String(habit?.id ?? `${Date.now()}-${index}`),
    title,
    description: sanitizeText(
      habit?.description,
      MAX_HABIT_DESCRIPTION_LENGTH
    ),
    reminderEnabled: !!(habit?.reminderEnabled ?? habit?.reminder),
    activeWeekdays,
    streak: calculateStreak(completedDates, frozenDates, activeWeekdays),
    completedToday:
      isDateScheduled(today, activeWeekdays) && completedDates.includes(today),
    startDate,
    completedDates,
    frozenDates,
    rewardedMilestones,
  };
};

const buildIngot = (ingot, index = 0) => {
  const title = sanitizeText(ingot?.title, MAX_INGOT_TITLE_LENGTH);
  if (!title) return null;

  return {
    id: String(ingot?.id ?? `${Date.now()}-ingot-${index}`),
    title,
    result: !!ingot?.result,
    createdAt:
      typeof ingot?.createdAt === "string"
        ? ingot.createdAt
        : new Date().toISOString(),
  };
};

const calculateGemBalanceFromHistory = (habits) => {
  if (!Array.isArray(habits) || habits.length === 0) return 0;

  let earnedGems = 0;
  let spentGems = 0;

  for (const habit of habits) {
    const activeWeekdays = normalizeActiveWeekdays(habit?.activeWeekdays);
    const rewardedMilestones = normalizeMilestones(habit?.rewardedMilestones);
    const frozenDates = normalizeCompletedDates(habit?.frozenDates).filter((date) =>
      isDateScheduled(date, activeWeekdays)
    );

    for (const milestone of rewardedMilestones) {
      earnedGems += getRewardForMilestone(milestone);
    }

    spentGems += frozenDates.length * STREAK_FREEZE_GEM_COST;
  }

  return normalizeGems(earnedGems - spentGems);
};

const normalizeForgeImport = (raw) => {
  const habits = Array.isArray(raw?.habits)
    ? raw.habits
        .map((habit, index) => buildHabit(habit, index))
        .filter(Boolean)
    : [];

  const ingots = Array.isArray(raw?.ingots)
    ? raw.ingots
        .map((ingot, index) => buildIngot(ingot, index))
        .filter(Boolean)
    : [];

  const hasGemValue = typeof raw?.gems !== "undefined" && raw?.gems !== null;
  return {
    habits,
    ingots,
    gems: hasGemValue ? normalizeGems(raw?.gems) : calculateGemBalanceFromHistory(habits),
  };
};

const normalizeLegacyImport = (raw) => {
  if (!Array.isArray(raw?.habits) || !Array.isArray(raw?.habitStatus)) {
    return null;
  }

  const completedDatesByHabitId = new Map();
  raw.habitStatus.forEach((statusItem) => {
    const habitKey = String(statusItem?.habitId ?? "");
    if (!habitKey) return;

    const dateValue = statusItem?.date;
    const dateStr = isValidDateString(dateValue)
      ? dateValue
      : epochDayToDateString(dateValue);
    if (!dateStr) return;

    const existing = completedDatesByHabitId.get(habitKey) || [];
    existing.push(dateStr);
    completedDatesByHabitId.set(habitKey, existing);
  });

  const habits = raw.habits
    .map((legacyHabit, index) => {
      const key = String(legacyHabit?.id ?? "");
      const completedDates = completedDatesByHabitId.get(key) || [];
      return buildHabit(legacyHabit, index, completedDates);
    })
    .filter(Boolean);

  const ingots = Array.isArray(raw?.tasks)
    ? raw.tasks
        .map((task, index) =>
          buildIngot(
            {
              id: task?.id,
              title: task?.title,
              result: task?.completed ?? task?.done ?? false,
              createdAt: task?.createdAt,
            },
            index
          )
        )
        .filter(Boolean)
    : [];

  const hasGemValue = typeof raw?.gems !== "undefined" && raw?.gems !== null;
  return {
    habits,
    ingots,
    gems: hasGemValue ? normalizeGems(raw?.gems) : calculateGemBalanceFromHistory(habits),
  };
};

export const normalizeImportData = (raw) => {
  const legacyData = normalizeLegacyImport(raw);
  if (legacyData) return legacyData;

  const forgeData = normalizeForgeImport(raw);
  if (
    forgeData.habits.length ||
    forgeData.ingots.length ||
    typeof raw?.gems !== "undefined"
  ) {
    return forgeData;
  }

  throw new Error("Invalid JSON format. Expected Forge export data.");
};

export const buildExportData = ({ habits, ingots, gems }) => ({
  format: "forge-export-v1",
  exportedAt: new Date().toISOString(),
  habits: Array.isArray(habits) ? habits : [],
  ingots: Array.isArray(ingots) ? ingots : [],
  gems: normalizeGems(gems),
});
