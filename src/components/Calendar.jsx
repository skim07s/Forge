import React, { memo, useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "../context/themeContext";

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
  const completedDateLookup =
    completedDates instanceof Set ? completedDates : new Set(completedDates);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;

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
    const isCompleted = completedDateLookup.has(dateStr);
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;

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

function Calendar({
  completedDates = [],
  onDatePress,
  selectedDate,
  streakCount = 0,
  habitTitle = "Habit",
  showHeader = true,
  onHorizontalGestureStart,
  onHorizontalGestureEnd,
}) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const calendarWidth = screenWidth - 64; // Account for modal/sheet padding
  const dayCellWidth = Math.floor(calendarWidth / 7);
  const gridWidth = dayCellWidth * 7;

  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(MONTHS_BEFORE);

  const monthIndices = useMemo(() => generateMonthIndices(), []);
  const completedDatesSet = useMemo(
    () => new Set(completedDates),
    [completedDates]
  );

  const currentMonthData = useMemo(
    () => getMonthData(currentIndex),
    [currentIndex]
  );
  const { year: currentYear, month: currentMonth } = currentMonthData;

  // Calculate stats for current visible month
  const calendarDays = useMemo(
    () => generateCalendarDays(currentYear, currentMonth, completedDatesSet),
    [currentYear, currentMonth, completedDatesSet]
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

  const isCalendarGestureActiveRef = useRef(false);
  const isMomentumScrollingRef = useRef(false);
  const swipeStartIndexRef = useRef(MONTHS_BEFORE);
  const isUserPagingRef = useRef(false);

  const beginHorizontalGesture = useCallback(() => {
    if (isCalendarGestureActiveRef.current) return;

    isCalendarGestureActiveRef.current = true;
    onHorizontalGestureStart?.();
  }, [onHorizontalGestureStart]);

  const endHorizontalGesture = useCallback(() => {
    if (!isCalendarGestureActiveRef.current) return;

    isCalendarGestureActiveRef.current = false;
    onHorizontalGestureEnd?.();
  }, [onHorizontalGestureEnd]);

  const handleTouchStart = useCallback(() => {
    beginHorizontalGesture();
  }, [beginHorizontalGesture]);

  const handleTouchEnd = useCallback(() => {
    if (!isMomentumScrollingRef.current) {
      isUserPagingRef.current = false;
      endHorizontalGesture();
    }
  }, [endHorizontalGesture]);

  const handleTouchCancel = useCallback(() => {
    if (!isMomentumScrollingRef.current) {
      isUserPagingRef.current = false;
      endHorizontalGesture();
    }
  }, [endHorizontalGesture]);

  const handleScrollBeginDrag = useCallback(() => {
    beginHorizontalGesture();
    isUserPagingRef.current = true;
    swipeStartIndexRef.current = currentIndex;
  }, [beginHorizontalGesture, currentIndex]);

  const handleScrollEndDrag = useCallback(() => {
    if (!isMomentumScrollingRef.current) {
      isUserPagingRef.current = false;
      endHorizontalGesture();
    }
  }, [endHorizontalGesture]);

  const handleMomentumScrollBegin = useCallback(() => {
    isMomentumScrollingRef.current = true;
    beginHorizontalGesture();
  }, [beginHorizontalGesture]);

  const handleMomentumScrollEnd = useCallback((event) => {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / gridWidth);
    const boundedIndex = Math.max(0, Math.min(MONTHS_BEFORE, rawIndex));
    let nextIndex = boundedIndex;

    if (isUserPagingRef.current) {
      const delta = boundedIndex - swipeStartIndexRef.current;
      if (Math.abs(delta) > 1) {
        nextIndex = swipeStartIndexRef.current + Math.sign(delta);
      }
    }

    if (nextIndex !== boundedIndex) {
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: false,
      });
    }

    setCurrentIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    isUserPagingRef.current = false;
    isMomentumScrollingRef.current = false;
    endHorizontalGesture();
  }, [endHorizontalGesture, gridWidth]);

  useEffect(() => {
    return () => {
      isUserPagingRef.current = false;
      isMomentumScrollingRef.current = false;
      endHorizontalGesture();
    };
  }, [endHorizontalGesture]);

  const renderMonthPage = useCallback(
    ({ item: index }) => {
      const { year, month } = getMonthData(index);
      const days = generateCalendarDays(year, month, completedDatesSet);

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
                      { backgroundColor: theme.surfaceMuted },
                      dayItem.isFuture && styles.dayFuture,
                      dayItem.isFuture && { backgroundColor: theme.surface },
                      dayItem.isToday && !dayItem.completed && styles.dayToday,
                      dayItem.isToday &&
                        !dayItem.completed && {
                          borderColor: theme.accent,
                          backgroundColor: theme.surfaceElevated,
                        },
                      dayItem.completed && styles.dayCompleted,
                      dayItem.completed && { backgroundColor: theme.accentStrong },
                      selectedDate === dayItem.date && styles.daySelected,
                      selectedDate === dayItem.date && { borderColor: theme.textPrimary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.textSecondary },
                        dayItem.isToday &&
                          !dayItem.completed &&
                          styles.dayTextToday,
                        dayItem.isToday && !dayItem.completed && { color: theme.accentStrong },
                        dayItem.completed && styles.dayTextCompleted,
                        dayItem.completed && { color: theme.textOnAccent },
                        dayItem.isFuture && styles.dayTextFuture,
                        dayItem.isFuture && { color: theme.textMuted },
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
    [
      completedDatesSet,
      onDatePress,
      selectedDate,
      dayCellWidth,
      gridWidth,
      theme.accent,
      theme.accentStrong,
      theme.surface,
      theme.surfaceElevated,
      theme.surfaceMuted,
      theme.textMuted,
      theme.textOnAccent,
      theme.textPrimary,
      theme.textSecondary,
    ]
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
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Header with title and streak - optional */}
      {showHeader && (
        <View style={styles.header}>
          <Text style={[styles.habitTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {habitTitle}
          </Text>
          <View style={[styles.streakBadge, { backgroundColor: theme.surfaceMuted }]}>
            <Text style={[styles.streakText, { color: theme.accent }]}>🔥 {streakCount}</Text>
          </View>
        </View>
      )}

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <Pressable
          style={[
            styles.navButton,
            { backgroundColor: theme.surfaceMuted },
            currentIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={goToPreviousMonth}
          disabled={currentIndex === 0}
        >
          <Text
            style={[
              styles.navButtonText,
              { color: theme.textPrimary },
              currentIndex === 0 && styles.navButtonTextDisabled,
              currentIndex === 0 && { color: theme.textMuted },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <Pressable onPress={goToToday}>
          <Text style={[styles.monthTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.navButton,
            { backgroundColor: theme.surfaceMuted },
            isCurrentMonthView && styles.navButtonDisabled,
          ]}
          onPress={goToNextMonth}
          disabled={isCurrentMonthView}
        >
          <Text
            style={[
              styles.navButtonText,
              { color: theme.textPrimary },
              isCurrentMonthView && styles.navButtonTextDisabled,
              isCurrentMonthView && { color: theme.textMuted },
            ]}
          >
            ›
          </Text>
        </Pressable>
      </View>

      {/* Stats for this month */}
      <View style={styles.monthStats}>
        <Text style={[styles.monthStatsText, { color: theme.textSecondary }]}>
          {monthCompletedCount} of {monthTotalDays} days • {monthPercentage}%
        </Text>
      </View>

      {/* Weekday Headers */}
      <View style={[styles.weekdayRow, { width: gridWidth }]}>
        {WEEKDAYS.map((day) => (
          <Text
            key={day}
            style={[styles.weekdayText, { width: dayCellWidth, color: theme.textMuted }]}
          >
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
        disableIntervalMomentum
        snapToInterval={gridWidth}
        snapToAlignment="start"
        extraData={completedDates}
        style={{ width: gridWidth }}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />

      {/* Legend */}
      <View style={[styles.legend, { borderTopColor: theme.divider }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendCompleted, { backgroundColor: theme.accentStrong }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              styles.legendToday,
              { backgroundColor: theme.surfaceMuted, borderColor: theme.accent },
            ]}
          />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendMissed, { backgroundColor: theme.surfaceElevated }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Missed</Text>
        </View>
      </View>

      {/* Today Button */}
      {!isCurrentMonthView && (
        <Pressable style={[styles.todayButton, { backgroundColor: theme.accent }]} onPress={goToToday}>
          <Text style={[styles.todayButtonText, { color: theme.textOnAccent }]}>Go to Today</Text>
        </Pressable>
      )}
    </View>
  );
}

function areEqual(prevProps, nextProps) {
  return (
    prevProps.completedDates === nextProps.completedDates &&
    prevProps.onDatePress === nextProps.onDatePress &&
    prevProps.selectedDate === nextProps.selectedDate &&
    prevProps.streakCount === nextProps.streakCount &&
    prevProps.habitTitle === nextProps.habitTitle &&
    prevProps.showHeader === nextProps.showHeader &&
    prevProps.onHorizontalGestureStart === nextProps.onHorizontalGestureStart &&
    prevProps.onHorizontalGestureEnd === nextProps.onHorizontalGestureEnd
  );
}

const styles = StyleSheet.create({
  container: {
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
    flexShrink: 1,
    paddingRight: 8,
  },
  streakBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 24,
    marginTop: -2,
  },
  navButtonTextDisabled: {
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    maxWidth: 170,
  },
  monthStats: {
    alignItems: "center",
    marginBottom: 16,
  },
  monthStatsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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
  },
  dayCompleted: {
  },
  dayToday: {
    borderWidth: 2,
  },
  dayFuture: {
  },
  daySelected: {
    borderWidth: 2,
  },
  dayText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  dayTextCompleted: {
    fontFamily: "Inter_700Bold",
  },
  dayTextToday: {
    fontFamily: "Inter_700Bold",
  },
  dayTextFuture: {
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
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
  },
  legendToday: {
    borderWidth: 2,
  },
  legendMissed: {
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  todayButton: {
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  todayButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});

export default memo(Calendar, areEqual);


