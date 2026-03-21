const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_HABIT_TITLE_LENGTH = 120;
const MAX_HABIT_DESCRIPTION_LENGTH = 500;
const MAX_INGOT_TITLE_LENGTH = 160;

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

const calculateStreak = (completedDates) => {
  if (!completedDates || completedDates.length === 0) return 0;

  const today = getToday();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterday);

  const sorted = [...completedDates].sort((a, b) => b.localeCompare(a));
  if (sorted[0] !== today && sorted[0] !== yesterdayStr) return 0;

  let streak = 0;
  let checkDate = parseLocalDate(sorted[0]);
  if (!checkDate) return 0;

  for (const dateStr of sorted) {
    const expectedStr = formatLocalDate(checkDate);
    if (dateStr === expectedStr) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr < expectedStr) {
      break;
    }
  }

  return streak;
};

const buildHabit = (habit, index = 0, completedDatesOverride = null) => {
  const title = sanitizeText(habit?.title, MAX_HABIT_TITLE_LENGTH);
  if (!title) return null;

  const completedDates = normalizeCompletedDates(
    completedDatesOverride ?? habit?.completedDates
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
    streak: calculateStreak(completedDates),
    completedToday: completedDates.includes(today),
    startDate,
    completedDates,
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

  return { habits, ingots };
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

  return { habits, ingots };
};

export const normalizeImportData = (raw) => {
  const legacyData = normalizeLegacyImport(raw);
  if (legacyData) return legacyData;

  const forgeData = normalizeForgeImport(raw);
  if (forgeData.habits.length || forgeData.ingots.length) {
    return forgeData;
  }

  throw new Error("Invalid JSON format. Expected Forge export data.");
};

export const buildExportData = ({ habits, ingots }) => ({
  format: "forge-export-v1",
  exportedAt: new Date().toISOString(),
  habits: Array.isArray(habits) ? habits : [],
  ingots: Array.isArray(ingots) ? ingots : [],
});
