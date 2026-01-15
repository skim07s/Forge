import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
} from "react-native";

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

// Number of months to show before current month (reduced for performance)
const MONTHS_BEFORE = 6;

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

// Get month data for a given index (0 = oldest, MONTHS_BEFORE = current)
const getMonthData = (index) => {
  const today = new Date();
  const date = new Date(
    today.getFullYear(),
    today.getMonth() - (MONTHS_BEFORE - index),
    1
  );
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    key: `${date.getFullYear()}-${date.getMonth()}`,
  };
};

// Generate array of month indices
const generateMonthIndices = () => {
  return Array.from({ length: MONTHS_BEFORE + 1 }, (_, i) => i);
};

export default function Calendar({
  completedDates = [],
  onDatePress,
  selectedDate,
  streakCount = 0,
  habitTitle = "Habit",
  showHeader = true,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const calendarWidth = screenWidth - 64; // Account for modal/sheet padding
  const dayCellWidth = Math.floor(calendarWidth / 7);

  const today = new Date();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(MONTHS_BEFORE);

  const monthIndices = useMemo(() => generateMonthIndices(), []);

  const currentMonthData = useMemo(
    () => getMonthData(currentIndex),
    [currentIndex]
  );
  const { year: currentYear, month: currentMonth } = currentMonthData;

  // Calculate stats for current visible month
  const calendarDays = useMemo(
    () => generateCalendarDays(currentYear, currentMonth, completedDates),
    [currentYear, currentMonth, completedDates]
  );

  const monthCompletedCount = calendarDays.filter((d) => d.completed).length;
  const monthTotalDays = calendarDays.filter(
    (d) => d.day !== null && (d.isPast || d.isToday)
  ).length;
  const monthPercentage =
    monthTotalDays > 0
      ? Math.round((monthCompletedCount / monthTotalDays) * 100)
      : 0;

  const isCurrentMonthView = currentIndex === MONTHS_BEFORE;

  const goToPreviousMonth = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  }, [currentIndex]);

  const goToNextMonth = useCallback(() => {
    if (currentIndex < MONTHS_BEFORE) {
      const newIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  }, [currentIndex]);

  const goToToday = useCallback(() => {
    flatListRef.current?.scrollToIndex({
      index: MONTHS_BEFORE,
      animated: true,
    });
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const gridWidth = dayCellWidth * 7;

  const renderMonthPage = useCallback(
    ({ item: index }) => {
      const { year, month } = getMonthData(index);
      const days = generateCalendarDays(year, month, completedDates);

      return (
        <View style={[styles.monthPage, { width: gridWidth }]}>
          {/* Calendar Grid */}
          <View style={[styles.calendarGrid, { width: gridWidth }]}>
            {days.map((dayItem) => (
              <Pressable
                key={dayItem.key}
                style={[
                  styles.dayCell,
                  { width: dayCellWidth, height: dayCellWidth },
                ]}
                onPress={() =>
                  dayItem.day && onDatePress && onDatePress(dayItem.date)
                }
                disabled={!dayItem.day || dayItem.isFuture}
              >
                {dayItem.day !== null && (
                  <View
                    style={[
                      styles.dayCircle,
                      dayItem.isFuture && styles.dayFuture,
                      dayItem.isToday && !dayItem.completed && styles.dayToday,
                      dayItem.completed && styles.dayCompleted,
                      selectedDate === dayItem.date && styles.daySelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        dayItem.isToday &&
                          !dayItem.completed &&
                          styles.dayTextToday,
                        dayItem.completed && styles.dayTextCompleted,
                        dayItem.isFuture && styles.dayTextFuture,
                      ]}
                    >
                      {dayItem.day}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      );
    },
    [completedDates, onDatePress, selectedDate, dayCellWidth, gridWidth]
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: gridWidth,
      offset: gridWidth * index,
      index,
    }),
    [gridWidth]
  );

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
        <Pressable
          style={[
            styles.navButton,
            currentIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={goToPreviousMonth}
          disabled={currentIndex === 0}
        >
          <Text
            style={[
              styles.navButtonText,
              currentIndex === 0 && styles.navButtonTextDisabled,
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <Pressable onPress={goToToday}>
          <Text style={styles.monthTitle}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.navButton,
            isCurrentMonthView && styles.navButtonDisabled,
          ]}
          onPress={goToNextMonth}
          disabled={isCurrentMonthView}
        >
          <Text
            style={[
              styles.navButtonText,
              isCurrentMonthView && styles.navButtonTextDisabled,
            ]}
          >
            ›
          </Text>
        </Pressable>
      </View>

      {/* Stats for this month */}
      <View style={styles.monthStats}>
        <Text style={styles.monthStatsText}>
          {monthCompletedCount} of {monthTotalDays} days • {monthPercentage}%
        </Text>
      </View>

      {/* Weekday Headers */}
      <View style={[styles.weekdayRow, { width: gridWidth }]}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={[styles.weekdayText, { width: dayCellWidth }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Swipeable Calendar Pages */}
      <FlatList
        ref={flatListRef}
        data={monthIndices}
        renderItem={renderMonthPage}
        keyExtractor={(item) => item.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={MONTHS_BEFORE}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        snapToInterval={gridWidth}
        snapToAlignment="start"
        extraData={completedDates}
        style={{ width: gridWidth }}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
      />

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
    overflow: "hidden",
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
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    marginTop: -2,
  },
  navButtonTextDisabled: {
    color: "#666",
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
  monthPage: {
    // Width is set dynamically
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    // Width and height set dynamically
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
