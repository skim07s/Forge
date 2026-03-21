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
import { useHabitStore } from "../context/habitStore";
import { useTheme } from "../context/themeContext";
import { useShallow } from "zustand/react/shallow";
import { triggerBubblePopHaptic } from "../utils/haptics";
import {
  scheduleDailyHabitReminder,
  cancelHabitReminder,
} from "../utils/notifications";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const CHECK_DAY_CHANGE_INTERVAL_MS = 60000;

const getIsoDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Anvil({ onPagerSwipeLockChange }) {
  const {
    habits,
    addHabit,
    updateHabit,
    setHabitReminderNotificationId,
    deleteHabit,
    toggleHabit,
    toggleDateForHabit,
  } = useHabitStore(
    useShallow((state) => ({
      habits: state.habits,
      addHabit: state.addHabit,
      updateHabit: state.updateHabit,
      setHabitReminderNotificationId: state.setHabitReminderNotificationId,
      deleteHabit: state.deleteHabit,
      toggleHabit: state.toggleHabit,
      toggleDateForHabit: state.toggleDateForHabit,
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

      toggleDateForHabit(id, dateStr);

      if (!wasCompleted) {
        void triggerBubblePopHaptic();
      }
    },
    [toggleDateForHabit]
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>The Anvil</Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>{currentDateLabel}</Text>
      </View>

      <View style={[styles.progressCard, { backgroundColor: theme.surface }]}>
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
        onClose={closeHabitSheet}
        onDateToggle={handleToggleDateForHabit}
        onEdit={handleEditFromSheet}
        onDelete={handleDeleteFromSheet}
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
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
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

