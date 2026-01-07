import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  SafeAreaView,
} from "react-native";
import HabitCard from "../components/HabitCard";
import HabitSheet from "../components/HabitSheet";

// Sample initial habits with tracking data
const initialHabits = [
  {
    id: "1",
    title: "Morning Meditation",
    streak: 5,
    completedToday: false,
    startDate: "2025-12-01",
    completedDates: [
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
      "2026-01-06",
    ],
  },
  {
    id: "2",
    title: "Exercise 30 min",
    streak: 12,
    completedToday: false,
    startDate: "2025-12-20",
    completedDates: [
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
      "2025-12-31",
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
      "2026-01-06",
    ],
  },
  {
    id: "3",
    title: "Read 20 pages",
    streak: 3,
    completedToday: true,
    startDate: "2026-01-01",
    completedDates: ["2026-01-05", "2026-01-06", "2026-01-07"],
  },
  {
    id: "4",
    title: "Drink 8 glasses of water",
    streak: 7,
    completedToday: false,
    startDate: "2025-12-15",
    completedDates: [
      "2025-12-31",
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
      "2026-01-06",
    ],
  },
];

export default function Anvil() {
  const [habits, setHabits] = useState(initialHabits);
  const [newHabit, setNewHabit] = useState("");
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const openHabitSheet = (id) => {
    const habit = habits.find((h) => h.id === id);
    setSelectedHabit(habit);
    setSheetVisible(true);
  };

  const closeHabitSheet = () => {
    setSheetVisible(false);
    setSelectedHabit(null);
  };

  // Toggle a specific date for a habit (from calendar)
  const toggleDateForHabit = (habitId, date) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;

        const isCompleted = habit.completedDates.includes(date);
        const newCompletedDates = isCompleted
          ? habit.completedDates.filter((d) => d !== date)
          : [...habit.completedDates, date];

        // Recalculate streak
        const today = new Date().toISOString().split("T")[0];
        const isToday = date === today;

        return {
          ...habit,
          completedDates: newCompletedDates,
          completedToday: isToday ? !isCompleted : habit.completedToday,
          streak: isToday
            ? isCompleted
              ? habit.streak - 1
              : habit.streak + 1
            : habit.streak,
        };
      })
    );

    // Update selected habit for the sheet
    setSelectedHabit((prev) => {
      if (!prev || prev.id !== habitId) return prev;
      const isCompleted = prev.completedDates.includes(date);
      return {
        ...prev,
        completedDates: isCompleted
          ? prev.completedDates.filter((d) => d !== date)
          : [...prev.completedDates, date],
      };
    });
  };

  const toggleHabit = (id) => {
    const today = new Date().toISOString().split("T")[0];

    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== id) return habit;

        const isCompletedToday = habit.completedDates.includes(today);
        const newCompletedDates = isCompletedToday
          ? habit.completedDates.filter((d) => d !== today)
          : [...habit.completedDates, today];

        return {
          ...habit,
          completedToday: !habit.completedToday,
          completedDates: newCompletedDates,
          streak: !habit.completedToday ? habit.streak + 1 : habit.streak - 1,
        };
      })
    );
  };

  const addHabit = () => {
    if (newHabit.trim() === "") return;

    const habit = {
      id: Date.now().toString(),
      title: newHabit.trim(),
      streak: 0,
      completedToday: false,
    };

    setHabits((prev) => [...prev, habit]);
    setNewHabit("");
  };

  const deleteHabit = (id) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== id));
  };

  const completedCount = habits.filter((h) => h.completedToday).length;
  const totalCount = habits.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const renderHabit = ({ item }) => (
    <HabitCard
      habit={item}
      onToggle={toggleHabit}
      onDelete={deleteHabit}
      onExpand={openHabitSheet}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚒️ The Anvil</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressNumber}>
            {completedCount}/{totalCount}
          </Text>
          <Text style={styles.progressLabel}>Habits Forged</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBar, { width: `${progressPercent}%` }]}
          />
        </View>
        <Text style={styles.progressPercent}>{progressPercent}%</Text>
      </View>

      {/* Habit List */}
      <FlatList
        data={habits}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No habits yet. Add one below!</Text>
          </View>
        }
      />

      {/* Add Habit Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new habit..."
          placeholderTextColor="#666"
          value={newHabit}
          onChangeText={setNewHabit}
          onSubmitEditing={addHabit}
        />
        <Pressable style={styles.addButton} onPress={addHabit}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {/* Habit Detail Sheet */}
      <HabitSheet
        visible={sheetVisible}
        habit={selectedHabit}
        onClose={closeHabitSheet}
        onDateToggle={toggleDateForHabit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  header: {
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#8A8A8A",
  },
  progressCard: {
    marginHorizontal: 24,
    backgroundColor: "#1A1A1A",
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
    color: "#FFB800",
  },
  progressLabel: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#8A8A8A",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FFB800",
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#8A8A8A",
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
    color: "#666",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 24,
    paddingBottom: 32,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
