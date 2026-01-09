// Date and calendar utility functions for Forge

// Constants
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
export const getToday = () => {
  const now = new Date();
  return formatDate(now);
};

/**
 * Format a Date object to YYYY-MM-DD (local time)
 */
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Format a date string to a readable format
 */
export const formatDateReadable = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Get the current week's dates (Sunday to Saturday)
 */
export const getCurrentWeekDates = (referenceDate = new Date()) => {
  const dayOfWeek = referenceDate.getDay();
  const todayStr = formatDate(referenceDate);
  const dates = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() - dayOfWeek + i);
    const dateStr = formatDate(date);
    dates.push({
      date: dateStr,
      day: date.getDate(),
      dayName: WEEKDAYS_SHORT[i],
      isToday: dateStr === todayStr,
    });
  }
  return dates;
};

/**
 * Generate calendar days for a specific month
 */
export const generateCalendarDays = (year, month, completedDates = []) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const days = [];

  // Add empty slots for days before the 1st
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ day: null, completed: false, key: `empty-${i}` });
  }

  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const isCompleted = completedDates.includes(dateStr);
    const isToday = isCurrentMonth && day === today.getDate();
    const isPast =
      new Date(year, month, day) <
      new Date(today.getFullYear(), today.getMonth(), today.getDate());

    days.push({
      day,
      date: dateStr,
      completed: isCompleted,
      isToday,
      isPast,
      isFuture: !isPast && !isToday,
      key: dateStr,
    });
  }

  return days;
};

/**
 * Calculate streak from consecutive completed dates (counting back from today or yesterday)
 * @param {string[]} completedDates - Array of date strings in YYYY-MM-DD format
 * @returns {number} The streak count
 */
export const calculateStreak = (completedDates) => {
  if (!completedDates || completedDates.length === 0) return 0;

  // Sort dates in descending order (most recent first)
  const sortedDates = [...completedDates].sort((a, b) => b.localeCompare(a));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(yesterday);

  // Streak must start from today or yesterday
  const mostRecentDate = sortedDates[0];
  if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(mostRecentDate === todayStr ? today : yesterday);

  for (const dateStr of sortedDates) {
    const expectedDateStr = formatDate(checkDate);

    if (dateStr === expectedDateStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr < expectedDateStr) {
      // Gap in dates, streak is broken
      break;
    }
  }

  return streak;
};

/**
 * Sort dates in descending order (most recent first)
 */
export const sortDatesDescending = (dates) => {
  return [...dates].sort((a, b) => b.localeCompare(a));
};
