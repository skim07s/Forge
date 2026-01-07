import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
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

// Generate calendar days for a specific month
const generateCalendarDays = (year, month, completedDates = []) => {
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

export default function Calendar({
  completedDates = [],
  onDatePress,
  selectedDate,
  streakCount = 0,
  habitTitle = "Habit",
  showHeader = true,
}) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const calendarDays = generateCalendarDays(
    currentYear,
    currentMonth,
    completedDates
  );

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const isCurrentMonthView =
    currentYear === today.getFullYear() && currentMonth === today.getMonth();

  // Calculate stats for this month
  const monthCompletedCount = calendarDays.filter((d) => d.completed).length;
  const monthTotalDays = calendarDays.filter(
    (d) => d.day !== null && (d.isPast || d.isToday)
  ).length;
  const monthPercentage =
    monthTotalDays > 0
      ? Math.round((monthCompletedCount / monthTotalDays) * 100)
      : 0;

  return (
    <View style={styles.container}>
      {/* Header with title and streak - optional */}
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.habitTitle}>{habitTitle}</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streakCount}</Text>
          </View>
        </View>
      )}

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <Pressable style={styles.navButton} onPress={goToPreviousMonth}>
          <Text style={styles.navButtonText}>‹</Text>
        </Pressable>

        <Pressable onPress={goToToday}>
          <Text style={styles.monthTitle}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={goToNextMonth}>
          <Text style={styles.navButtonText}>›</Text>
        </Pressable>
      </View>

      {/* Stats for this month */}
      <View style={styles.monthStats}>
        <Text style={styles.monthStatsText}>
          {monthCompletedCount} of {monthTotalDays} days • {monthPercentage}%
        </Text>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((item) => (
          <Pressable
            key={item.key}
            style={styles.dayCell}
            onPress={() => item.day && onDatePress && onDatePress(item.date)}
            disabled={!item.day || item.isFuture}
          >
            {item.day !== null && (
              <View
                style={[
                  styles.dayCircle,
                  item.isFuture && styles.dayFuture,
                  item.isToday && !item.completed && styles.dayToday,
                  item.completed && styles.dayCompleted,
                  selectedDate === item.date && styles.daySelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    item.isToday && !item.completed && styles.dayTextToday,
                    item.completed && styles.dayTextCompleted,
                    item.isFuture && styles.dayTextFuture,
                  ]}
                >
                  {item.day}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendCompleted]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendToday]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendMissed]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
      </View>

      {/* Today Button */}
      {!isCurrentMonthView && (
        <Pressable style={styles.todayButton} onPress={goToToday}>
          <Text style={styles.todayButtonText}>Go to Today</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  habitTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  streakBadge: {
    backgroundColor: "#252525",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FF6B35",
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    marginTop: -2,
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  monthStats: {
    alignItems: "center",
    marginBottom: 16,
  },
  monthStatsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#888",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#666",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  dayCompleted: {
    backgroundColor: "#FFB800",
  },
  dayToday: {
    borderWidth: 2,
    borderColor: "#FF6B35",
    backgroundColor: "#252525",
  },
  dayFuture: {
    backgroundColor: "#1F1F1F",
  },
  daySelected: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  dayText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#888",
  },
  dayTextCompleted: {
    color: "#0D0D0D",
    fontFamily: "Inter_700Bold",
  },
  dayTextToday: {
    color: "#FF6B35",
    fontFamily: "Inter_700Bold",
  },
  dayTextFuture: {
    color: "#444",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#252525",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendCompleted: {
    backgroundColor: "#FFB800",
  },
  legendToday: {
    backgroundColor: "#252525",
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  legendMissed: {
    backgroundColor: "#333",
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#888",
  },
  todayButton: {
    marginTop: 16,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  todayButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
