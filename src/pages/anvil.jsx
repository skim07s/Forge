import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HabitCard from "../components/HabitCard";
import HabitSheet from "../components/HabitSheet";
import NewHabitSheet from "../components/NewHabitSheet";
import { useHabitStore } from "../context/habitStore";

export default function Anvil() {
  const habits = useHabitStore((state) => state.habits);
  const addHabit = useHabitStore((state) => state.addHabit);
  const deleteHabit = useHabitStore((state) => state.deleteHabit);
  const toggleHabit = useHabitStore((state) => state.toggleHabit);
  const toggleDateForHabit = useHabitStore((state) => state.toggleDateForHabit);

  const [newHabitSheetVisible, setNewHabitSheetVisible] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get selected habit from store (stays in sync with updates)
  const selectedHabit = selectedHabitId
    ? habits.find((h) => h.id === selectedHabitId)
    : null;

  // Update date when day changes
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      if (now.toDateString() !== currentDate.toDateString()) {
        setCurrentDate(now);
      }
    };

    // Check every minute
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);

  const openHabitSheet = (id) => {
    setSelectedHabitId(id);
    setSheetVisible(true);
  };

  const closeHabitSheet = () => {
    setSheetVisible(false);
    setSelectedHabitId(null);
  };

  const handleCreateHabit = (payload) => {
    // payload: { title, description, reminderEnabled }
    addHabit(payload);
    setNewHabitSheetVisible(false);
  };

  const completedCount = habits.filter((h) => h.completedToday).length;
  const totalCount = habits.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const renderHabit = ({ item, index }) => (
    <HabitCard
      habit={item}
      onToggle={toggleHabit}
      onDelete={deleteHabit}
      onExpand={openHabitSheet}
      onDateToggle={toggleDateForHabit}
      index={index}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚒️ The Anvil</Text>
        <Text style={styles.date}>
          {currentDate.toLocaleDateString("en-US", {
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

      {/* Floating Add Button */}
      <Pressable
        style={styles.addButton}
        onPress={() => setNewHabitSheetVisible(true)}
        accessibilityLabel="Add new habit"
      >
        <Text style={styles.addButtonText}>+</Text>
      </Pressable>

      {/* Habit Detail Sheet */}
      <HabitSheet
        visible={sheetVisible}
        habit={selectedHabit}
        onClose={closeHabitSheet}
        onDateToggle={toggleDateForHabit}
      />

      {/* New Habit Sheet */}
      <NewHabitSheet
        visible={newHabitSheetVisible}
        onClose={() => setNewHabitSheetVisible(false)}
        onCreate={handleCreateHabit}
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
  // removed search/input bar styles
  addButton: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
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
    color: "#FFFFFF",
  },
});
