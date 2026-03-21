import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { useTheme } from "../context/themeContext";
import StreakFreezeIcon from "./StreakFreezeIcon";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const FROZEN_DAY_ICON_SIZE = 40;
const OFF_DAY_BACKGROUND = "rgba(232, 90, 90, 0.18)";

const getWeekdayFromDate = (dateStr) => {
  if (typeof dateStr !== "string" || !DATE_PATTERN.test(dateStr)) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
};

// Animated Button Component with bounce effect
function AnimatedButton({ style, onPress, children, disabled, ...rest }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const triggerAnimation = () => {
    // Scale in all directions - shorter, subtler bounce
    scale.value = withSequence(
      withTiming(1.1, { duration: 80 }),
      withSpring(1, { mass: 1.1, damping: 14, stiffness: 85 })
    );
  };

  const handlePress = () => {
    if (!disabled) {
      triggerAnimation();
      onPress && onPress();
    }
  };

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPress={handlePress}
      disabled={disabled}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

function HabitCard({
  habit,
  onToggle,
  onDelete,
  onExpand,
  onDateToggle,
  weekDates = [],
}) {
  const {
    id,
    title,
    streak,
    completedToday,
    completedDates = [],
    frozenDates = [],
    activeWeekdays = ALL_WEEKDAYS,
  } = habit;
  const { theme } = useTheme();
  const completedDateSet = useMemo(
    () => new Set(completedDates),
    [completedDates]
  );
  const frozenDateSet = useMemo(() => new Set(frozenDates), [frozenDates]);
  const activeWeekdaySet = useMemo(
    () =>
      new Set(
        Array.isArray(activeWeekdays) && activeWeekdays.length
          ? activeWeekdays
          : ALL_WEEKDAYS
      ),
    [activeWeekdays]
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.16,
          shadowRadius: 6,
          elevation: 4,
        },
        completedToday && styles.containerCompleted,
      ]}
    >
      <View style={styles.mainContent}>
        <Pressable style={styles.content} onLongPress={() => onDelete(id)}>
          {/* Checkbox with bounce animation */}
          <AnimatedButton
            style={[
              styles.checkbox,
              { borderColor: theme.border },
              completedToday && styles.checkboxChecked,
              completedToday && {
                backgroundColor: theme.accentStrong,
                borderColor: theme.accentStrong,
              },
            ]}
            onPress={() => onToggle(id)}
            accessibilityRole="checkbox"
            accessibilityLabel={
              completedToday
                ? `Mark ${title} as not completed`
                : `Mark ${title} as completed`
            }
            accessibilityState={{ checked: completedToday }}
            hitSlop={8}
          >
            {completedToday && <Text style={[styles.checkmark, { color: theme.textOnAccent }]}>✓</Text>}
          </AnimatedButton>

          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                { color: theme.textPrimary },
                completedToday && styles.titleCompleted,
                completedToday && { color: theme.textMuted },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text style={[styles.streak, { color: theme.accent }]}>🔥 {streak} day streak</Text>
          </View>

          {/* Expand button with bounce animation */}
          <AnimatedButton
            style={[styles.expandButton, { backgroundColor: theme.surfaceMuted }]}
            onPress={() => onExpand && onExpand(id)}
            accessibilityRole="button"
            accessibilityLabel={`Open details for ${title}`}
            hitSlop={8}
          >
            <Svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {/* Path copied from src/assets/angle-small-down.svg */}
              <Path
                d="M12,15.5a1.993,1.993,0,0,1-1.414-.585L5.293,9.621,6.707,8.207,12,13.5l5.293-5.293,1.414,1.414-5.293,5.293A1.993,1.993,0,0,1,12,15.5Z"
                fill={theme.textSecondary}
              />
            </Svg>
          </AnimatedButton>
        </Pressable>

        {/* Week Calendar */}
        <View style={styles.weekCalendar}>
          {weekDates.map((day) => {
            const weekday = getWeekdayFromDate(day.date);
            const isScheduled = weekday === null ? true : activeWeekdaySet.has(weekday);
            const isCompleted = isScheduled && completedDateSet.has(day.date);
            const isFrozen = isScheduled && !isCompleted && frozenDateSet.has(day.date);
            return (
              <View
                key={day.date}
                style={[
                  styles.dayContainer,
                  day.isFuture && { opacity: 0.3 },
                  !isScheduled && { opacity: day.isFuture ? 0.35 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.dayName,
                    { color: theme.textMuted },
                    !isScheduled && { color: theme.error },
                  ]}
                >
                  {day.dayName}
                </Text>
                {/* Date button with bounce animation */}
                <AnimatedButton
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: isScheduled
                        ? theme.surfaceMuted
                        : OFF_DAY_BACKGROUND,
                    },
                    !isScheduled && styles.dayOff,
                    !isScheduled && { borderColor: theme.error },
                    isCompleted && styles.dayCompleted,
                    isCompleted && { backgroundColor: theme.accentStrong },
                    day.isToday && isScheduled && styles.dayToday,
                    day.isToday && isScheduled && { borderColor: theme.accentStrong },
                  ]}
                  onPress={() => onDateToggle && onDateToggle(id, day.date)}
                  disabled={day.isFuture || !isScheduled}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${day.dayName} ${day.day}`}
                  accessibilityState={{
                    disabled: day.isFuture || !isScheduled,
                    checked: isCompleted || isFrozen,
                  }}
                  hitSlop={6}
                >
                  {isFrozen ? (
                    <StreakFreezeIcon size={FROZEN_DAY_ICON_SIZE} />
                  ) : (
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: theme.textMuted },
                        isCompleted && styles.dayNumberCompleted,
                        isCompleted && { color: theme.textOnAccent },
                        !isScheduled && { color: theme.error },
                        day.isToday && isScheduled && !isCompleted && styles.dayNumberToday,
                        day.isToday &&
                          isScheduled &&
                          !isCompleted &&
                          !isFrozen && { color: theme.accentStrong },
                      ]}
                    >
                      {day.day}
                    </Text>
                  )}
                </AnimatedButton>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function areEqual(prevProps, nextProps) {
  return (
    prevProps.habit === nextProps.habit &&
    prevProps.weekDates === nextProps.weekDates &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onExpand === nextProps.onExpand &&
    prevProps.onDateToggle === nextProps.onDateToggle
  );
}

export default memo(HabitCard, areEqual);

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  containerCompleted: {
  },
  mainContent: {
    gap: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
  },
  checkmark: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
  },
  streak: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  weekCalendar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  dayContainer: {
    alignItems: "center",
    gap: 4,
  },
  dayName: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dayOff: {
    borderWidth: 1,
  },
  dayCompleted: {
  },
  dayToday: {
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  dayNumberCompleted: {
  },
  dayNumberToday: {
  },
});
