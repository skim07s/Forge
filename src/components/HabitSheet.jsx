import React, { memo, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Calendar from "./Calendar";
import BottomSheet from "./BottomSheet";
import { useTheme } from "../context/themeContext";
import { STREAK_FREEZE_GEM_COST } from "../context/habitStore";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

const parseDateValue = (value) => {
  if (typeof value === "string" && DATE_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
};

function HabitSheet({
  visible,
  habit,
  onClose,
  onDateToggle,
  onEdit,
  onDelete,
  gems = 0,
  onManualFreeze,
  onRemoveFreeze,
  onCalendarGestureStart,
  onCalendarGestureEnd,
}) {
  const { theme } = useTheme();

  const {
    id,
    title,
    description = "",
    streak = 0,
    startDate = new Date().toISOString(),
    completedDates = [],
    frozenDates = [],
    activeWeekdays = ALL_WEEKDAYS,
  } = habit ?? {};

  const startDateFormatted = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(parseDateValue(startDate)),
    [startDate]
  );

  const totalCompleted = completedDates.length;
  const canAffordFreeze = gems >= STREAK_FREEZE_GEM_COST;
  const freezeTargetDate = (() => {
    const date = new Date();
    const weekdaySet = new Set(
      Array.isArray(activeWeekdays) && activeWeekdays.length
        ? activeWeekdays
        : ALL_WEEKDAYS
    );
    const isTodayScheduled = weekdaySet.has(date.getDay());
    if (isTodayScheduled) {
      date.setDate(date.getDate() - 1);
    }

    for (let i = 0; i < 366; i++) {
      if (weekdaySet.has(date.getDay())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      date.setDate(date.getDate() - 1);
    }

    return null;
  })();
  const hasYesterdayFreeze =
    !!freezeTargetDate && frozenDates.includes(freezeTargetDate);

  const handleDatePress = useCallback((date) => {
    if (habit && onDateToggle) {
      onDateToggle(id, date);
    }
  }, [habit, id, onDateToggle]);

  if (!habit) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight={0.85}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>{title}</Text>
        <Pressable
          onPress={onClose}
          style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]}
          accessibilityRole="button"
          accessibilityLabel="Close habit details"
          hitSlop={8}
        >
          <Text style={[styles.closeText, { color: theme.textSecondary }]}>✕</Text>
        </Pressable>
      </View>

      {description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
          onPress={() => onEdit?.(habit)}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${title}`}
        >
          <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>Edit Habit</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.deleteButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.error }]}
          onPress={() => onDelete?.(habit)}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${title}`}
        >
          <Text style={[styles.actionButtonText, { color: theme.error }]}>Delete Habit</Text>
        </Pressable>
      </View>

      <View style={[styles.freezeCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <View style={styles.freezeTextWrap}>
          <Text style={[styles.freezeTitle, { color: theme.textPrimary }]}>Streak Freeze</Text>
          <Text style={[styles.freezeSubtitle, { color: theme.textSecondary }]}>
            Spend {STREAK_FREEZE_GEM_COST} gems to protect yesterday if you missed it.
          </Text>
          <Text style={[styles.freezeBalance, { color: theme.textMuted }]}>
            Gems available: {gems}
          </Text>
        </View>
        <Pressable
          style={[
            styles.freezeButton,
            {
              backgroundColor: hasYesterdayFreeze
                ? theme.surface
                : canAffordFreeze
                ? theme.accentStrong
                : theme.surface,
              borderColor: hasYesterdayFreeze
                ? theme.accentStrong
                : canAffordFreeze
                ? theme.accentStrong
                : theme.border,
            },
            !hasYesterdayFreeze && !canAffordFreeze && styles.freezeButtonDisabled,
          ]}
          onPress={() =>
            hasYesterdayFreeze ? onRemoveFreeze?.(id) : onManualFreeze?.(id)
          }
          disabled={
            hasYesterdayFreeze
              ? !onRemoveFreeze
              : !onManualFreeze || !canAffordFreeze
          }
          accessibilityRole="button"
          accessibilityLabel={
            hasYesterdayFreeze
              ? `Remove streak freeze for ${title}`
              : `Use streak freeze for ${title}`
          }
        >
          <Text
            style={[
              styles.freezeButtonText,
              {
                color: hasYesterdayFreeze
                  ? theme.accentStrong
                  : canAffordFreeze
                  ? theme.textOnAccent
                  : theme.textMuted,
              },
            ]}
          >
            {hasYesterdayFreeze
              ? `Remove Freeze (+${STREAK_FREEZE_GEM_COST})`
              : `Freeze (-${STREAK_FREEZE_GEM_COST})`}
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.surfaceMuted }]}>
            <Text style={[styles.statNumber, { color: theme.accentStrong }]}>🔥 {streak}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Current Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surfaceMuted }]}>
            <Text style={[styles.statNumber, { color: theme.accentStrong }]}>✓ {totalCompleted}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Completions</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Started</Text>
          <Text style={[styles.startDate, { color: theme.textPrimary }]}>{startDateFormatted}</Text>
        </View>

        <View style={styles.section}>
          <Calendar
            completedDates={completedDates}
            frozenDates={frozenDates}
            activeWeekdays={activeWeekdays}
            streakCount={streak}
            habitTitle={title}
            onDatePress={handleDatePress}
            showHeader={false}
            onHorizontalGestureStart={onCalendarGestureStart}
            onHorizontalGestureEnd={onCalendarGestureEnd}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

function areEqual(prevProps, nextProps) {
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.habit === nextProps.habit &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.onDateToggle === nextProps.onDateToggle &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.gems === nextProps.gems &&
    prevProps.onManualFreeze === nextProps.onManualFreeze &&
    prevProps.onRemoveFreeze === nextProps.onRemoveFreeze &&
    prevProps.onCalendarGestureStart === nextProps.onCalendarGestureStart &&
    prevProps.onCalendarGestureEnd === nextProps.onCalendarGestureEnd
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    flex: 1,
    paddingRight: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    lineHeight: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  deleteButton: {},
  actionButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  freezeCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  freezeTextWrap: {
    gap: 4,
  },
  freezeTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  freezeSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "Inter_400Regular",
  },
  freezeBalance: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  freezeButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  freezeButtonDisabled: {
    opacity: 0.7,
  },
  freezeButtonText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  startDate: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
});

export default memo(HabitSheet, areEqual);
