import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import HabitCard from "../components/HabitCard";
import HabitSheet from "../components/HabitSheet";
import NewHabitSheet from "../components/NewHabitSheet";
import ConfirmDialog from "../components/ConfirmDialog";
import { STREAK_FREEZE_GEM_COST, useHabitStore } from "../context/habitStore";
import { useTheme } from "../context/themeContext";
import { useShallow } from "zustand/react/shallow";
import { triggerBubblePopHaptic } from "../utils/haptics";
import {
  scheduleDailyHabitReminder,
  cancelHabitReminder,
} from "../utils/notifications";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const CHECK_DAY_CHANGE_INTERVAL_MS = 60000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getIsoDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isHabitScheduledOnDate = (habit, dateStr) => {
  if (!habit || typeof dateStr !== "string" || !DATE_PATTERN.test(dateStr)) {
    return false;
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  const weekdays =
    Array.isArray(habit.activeWeekdays) && habit.activeWeekdays.length
      ? habit.activeWeekdays
      : [0, 1, 2, 3, 4, 5, 6];

  return weekdays.includes(weekday);
};

export default function Anvil({ onPagerSwipeLockChange }) {
  const {
    habits,
    gems,
    addHabit,
    updateHabit,
    setHabitReminderNotificationId,
    deleteHabit,
    toggleHabit,
    toggleDateForHabit,
    useFreezeForHabit,
    removeFreezeForHabit,
  } = useHabitStore(
    useShallow((state) => ({
      habits: state.habits,
      gems: state.gems,
      addHabit: state.addHabit,
      updateHabit: state.updateHabit,
      setHabitReminderNotificationId: state.setHabitReminderNotificationId,
      deleteHabit: state.deleteHabit,
      toggleHabit: state.toggleHabit,
      toggleDateForHabit: state.toggleDateForHabit,
      useFreezeForHabit: state.useFreezeForHabit,
      removeFreezeForHabit: state.removeFreezeForHabit,
    }))
  );
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [newHabitSheetVisible, setNewHabitSheetVisible] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingHabit, setEditingHabit] = useState(null);
  const [isCalendarSwiping, setIsCalendarSwiping] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const selectedHabit = useMemo(
    () => (selectedHabitId ? habits.find((h) => h.id === selectedHabitId) : null),
    [habits, selectedHabitId]
  );

  useEffect(() => {
    onPagerSwipeLockChange?.(
      sheetVisible || newHabitSheetVisible || isCalendarSwiping
    );
  }, [
    isCalendarSwiping,
    newHabitSheetVisible,
    onPagerSwipeLockChange,
    sheetVisible,
  ]);

  useEffect(
    () => () => {
      onPagerSwipeLockChange?.(false);
    },
    [onPagerSwipeLockChange]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDate((prevDate) =>
        now.toDateString() === prevDate.toDateString() ? prevDate : now
      );
    }, CHECK_DAY_CHANGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const todayIso = useMemo(() => getIsoDate(currentDate), [currentDate]);
  const currentDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(currentDate),
    [currentDate]
  );

  const weekDates = useMemo(() => {
    const dayOfWeek = currentDate.getDay();

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - dayOfWeek + index);
      const dateIso = getIsoDate(date);

      return {
        date: dateIso,
        day: date.getDate(),
        dayName: DAY_LABELS[index],
        isToday: dateIso === todayIso,
        isFuture: dateIso > todayIso,
      };
    });
  }, [currentDate, todayIso]);

  const openHabitSheet = useCallback((id) => {
    setSelectedHabitId(id);
    setSheetVisible(true);
  }, []);

  const closeHabitSheet = useCallback(() => {
    setSheetVisible(false);
    setSelectedHabitId(null);
    setIsCalendarSwiping(false);
  }, []);

  const openCreateHabitSheet = useCallback(() => {
    setEditingHabit(null);
    setNewHabitSheetVisible(true);
  }, []);

  const closeNewHabitSheet = useCallback(() => {
    setNewHabitSheetVisible(false);
    setEditingHabit(null);
  }, []);

  const syncHabitReminder = useCallback(
    async (habit, reminderEnabled) => {
      if (!habit?.id) return;

      if (habit.reminderNotificationId) {
        await cancelHabitReminder(habit.reminderNotificationId);
      }

      if (!reminderEnabled) {
        setHabitReminderNotificationId(habit.id, null);
        return;
      }

      const notificationId = await scheduleDailyHabitReminder({
        habitId: habit.id,
        habitTitle: habit.title,
      });

      setHabitReminderNotificationId(habit.id, notificationId);

      if (!notificationId) {
        Alert.alert(
          "Notification Permission Required",
          "Enable notifications in device settings to receive habit reminders."
        );
      }
    },
    [setHabitReminderNotificationId]
  );

  const handleSubmitHabit = useCallback(
    async (payload) => {
      let savedHabit = null;

      if (editingHabit?.id) {
        savedHabit = updateHabit(editingHabit.id, payload);
      } else {
        savedHabit = addHabit(payload);
      }

      if (!savedHabit) {
        throw new Error("Unable to save habit");
      }

      await syncHabitReminder(savedHabit, !!payload.reminderEnabled);

      void triggerBubblePopHaptic();
      closeNewHabitSheet();
    },
    [addHabit, closeNewHabitSheet, editingHabit, syncHabitReminder, updateHabit]
  );

  const handleEditFromSheet = useCallback((habit) => {
    if (!habit) return;
    setEditingHabit(habit);
    setNewHabitSheetVisible(true);
    setSheetVisible(false);
    setIsCalendarSwiping(false);
  }, []);

  const deleteHabitWithReminder = useCallback(
    async (habit) => {
      if (!habit?.id) return;

      if (habit.reminderNotificationId) {
        await cancelHabitReminder(habit.reminderNotificationId);
      }

      deleteHabit(habit.id);
    },
    [deleteHabit]
  );

  const handleDeleteFromSheet = useCallback(
    (habit) => {
      if (!habit?.id) return;
      setDeleteTarget({ habit, closeSheetAfterDelete: true });
    },
    []
  );

  const handleCalendarGestureStart = useCallback(() => {
    setIsCalendarSwiping(true);
  }, []);

  const handleCalendarGestureEnd = useCallback(() => {
    setIsCalendarSwiping(false);
  }, []);

  const handleToggleHabit = useCallback(
    (id) => {
      const today = getIsoDate();
      const habit = useHabitStore.getState().habits.find((h) => h.id === id);
      const wasCompleted = habit?.completedDates?.includes(today);
      const isScheduledToday = isHabitScheduledOnDate(habit, today);
      if (!isScheduledToday && !wasCompleted) return;

      toggleHabit(id);

      if (!wasCompleted) {
        void triggerBubblePopHaptic();
      }
    },
    [toggleHabit]
  );

  const handleToggleDateForHabit = useCallback(
    (id, dateStr) => {
      const habit = useHabitStore.getState().habits.find((h) => h.id === id);
      const wasCompleted = habit?.completedDates?.includes(dateStr);
      const isScheduledDate = isHabitScheduledOnDate(habit, dateStr);
      if (!isScheduledDate && !wasCompleted) return;

      toggleDateForHabit(id, dateStr);

      if (!wasCompleted) {
        void triggerBubblePopHaptic();
      }
    },
    [toggleDateForHabit]
  );

  const handleManualFreeze = useCallback(
    (habitId) => {
      const result = useFreezeForHabit(habitId);
      if (result?.ok) {
        void triggerBubblePopHaptic();
        Alert.alert(
          "Streak Protected",
          `Used ${STREAK_FREEZE_GEM_COST} gems to freeze yesterday.`
        );
        return;
      }

      const reason = result?.reason;
      if (reason === "insufficient_gems") {
        Alert.alert(
          "Not enough gems",
          `You need at least ${STREAK_FREEZE_GEM_COST} gems to use a freeze.`
        );
        return;
      }

      if (reason === "already_frozen") {
        Alert.alert("Freeze already used", "Yesterday is already protected for this habit.");
        return;
      }

      if (reason === "no_missed_day") {
        Alert.alert("Nothing to freeze", "You did not miss yesterday for this habit.");
        return;
      }

      if (reason === "no_active_streak") {
        Alert.alert("Freeze unavailable", "A freeze needs an active streak from earlier days.");
        return;
      }

      Alert.alert("Freeze unavailable", "Unable to apply freeze right now.");
    },
    [useFreezeForHabit]
  );

  const handleRemoveFreeze = useCallback(
    (habitId) => {
      const result = removeFreezeForHabit(habitId);
      if (result?.ok) {
        void triggerBubblePopHaptic();
        Alert.alert(
          "Freeze Removed",
          `Removed yesterday's freeze and refunded ${STREAK_FREEZE_GEM_COST} gems.`
        );
        return;
      }

      if (result?.reason === "no_freeze") {
        Alert.alert("No freeze found", "Yesterday is not frozen for this habit.");
        return;
      }

      Alert.alert("Remove failed", "Unable to remove freeze right now.");
    },
    [removeFreezeForHabit]
  );

  const completedCount = useMemo(
    () => habits.filter((h) => h.completedToday).length,
    [habits]
  );
  const totalCount = habits.length;
  const progressPercent = useMemo(
    () =>
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    [completedCount, totalCount]
  );

  const handleDeleteFromCard = useCallback(
    (id) => {
      const habit = habits.find((h) => h.id === id);
      if (!habit) return;
      setDeleteTarget({ habit, closeSheetAfterDelete: false });
    },
    [habits]
  );

  const handleCancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget?.habit) return;

    const target = deleteTarget;
    setDeleteTarget(null);

    if (target.closeSheetAfterDelete) {
      closeHabitSheet();
    }

    void deleteHabitWithReminder(target.habit);
  }, [closeHabitSheet, deleteHabitWithReminder, deleteTarget]);

  const renderHabit = useCallback(
    ({ item }) => (
      <HabitCard
        habit={item}
        onToggle={handleToggleHabit}
        onDelete={handleDeleteFromCard}
        onExpand={openHabitSheet}
        onDateToggle={handleToggleDateForHabit}
        weekDates={weekDates}
      />
    ),
    [
      handleDeleteFromCard,
      handleToggleDateForHabit,
      handleToggleHabit,
      openHabitSheet,
      weekDates,
    ]
  );

  const keyExtractor = useCallback((item) => item.id, []);
  const listBottomPadding = useMemo(
    () => ({ paddingBottom: 64 + insets.bottom }),
    [insets.bottom]
  );
  const addButtonBottomStyle = useMemo(
    () => ({ bottom: 16 + insets.bottom }),
    [insets.bottom]
  );
  const headerTopPadding = useMemo(
    () => ({ paddingTop: insets.top + 8, paddingBottom: 12 }),
    [insets.top]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["left", "right"]}
    >
      <View style={[styles.header, headerTopPadding]}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>The Anvil</Text>
          <View
            style={[
              styles.gemBadge,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <Text style={[styles.gemIcon, { color: theme.accentStrong }]}>G</Text>
            <Text style={[styles.gemCount, { color: theme.textPrimary }]}>{gems}</Text>
          </View>
        </View>
        <Text style={[styles.date, { color: theme.textSecondary }]}>{currentDateLabel}</Text>
      </View>

      <View
        style={[
          styles.progressCard,
          {
            backgroundColor: theme.surface,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.16,
            shadowRadius: 6,
            elevation: 4,
          },
        ]}
      >
        <View style={styles.progressInfo}>
          <Text style={[styles.progressNumber, { color: theme.accentStrong }]}>
            {completedCount}/{totalCount}
          </Text>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Habits Forged</Text>
        </View>

        <View style={[styles.progressBarContainer, { backgroundColor: theme.surfaceMuted }]}>
          <View
            style={[styles.progressBar, { width: `${progressPercent}%`, backgroundColor: theme.accentStrong }]}
          />
        </View>
        <Text style={[styles.progressPercent, { color: theme.textSecondary }]}>{progressPercent}%</Text>
      </View>

      <FlatList
        data={habits}
        renderItem={renderHabit}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={[styles.listContent, listBottomPadding]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No habits yet. Add your first one below.</Text>
          </View>
        }
      />

      <Pressable
        style={[
          styles.addButton,
          addButtonBottomStyle,
          { backgroundColor: theme.accent, shadowColor: theme.shadow },
        ]}
        onPress={openCreateHabitSheet}
        accessibilityLabel="Add new habit"
        accessibilityRole="button"
      >
        <Text style={[styles.addButtonText, { color: theme.textOnAccent }]}>+</Text>
      </Pressable>

      <HabitSheet
        visible={sheetVisible}
        habit={selectedHabit}
        gems={gems}
        onClose={closeHabitSheet}
        onDateToggle={handleToggleDateForHabit}
        onEdit={handleEditFromSheet}
        onDelete={handleDeleteFromSheet}
        onManualFreeze={handleManualFreeze}
        onRemoveFreeze={handleRemoveFreeze}
        onCalendarGestureStart={handleCalendarGestureStart}
        onCalendarGestureEnd={handleCalendarGestureEnd}
      />

      <NewHabitSheet
        visible={newHabitSheetVisible}
        onClose={closeNewHabitSheet}
        onCreate={handleSubmitHabit}
        initialValues={editingHabit}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Habit"
        message={
          deleteTarget?.habit?.title
            ? `Delete "${deleteTarget.habit.title}"?`
            : "Delete this habit?"
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  gemBadge: {
    minWidth: 70,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  gemIcon: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  gemCount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  date: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  progressCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  progressNumber: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  progressLabel: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "right",
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  addButton: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
  },
});

