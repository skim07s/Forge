import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Calendar from "./Calendar";
import BottomSheet from "./BottomSheet";

export default function HabitSheet({ visible, habit, onClose, onDateToggle }) {
  if (!habit) return null;

  const {
    id,
    title,
    streak = 0,
    startDate = new Date().toISOString(),
    completedDates = [],
  } = habit;

  const startDateFormatted = new Date(startDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalCompleted = completedDates.length;

  const handleDatePress = (date) => {
    if (onDateToggle) {
      onDateToggle(id, date);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight={0.85}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>🔥 {streak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>✓ {totalCompleted}</Text>
            <Text style={styles.statLabel}>Total Completions</Text>
          </View>
        </View>

        {/* Start Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Started</Text>
          <Text style={styles.startDate}>{startDateFormatted}</Text>
        </View>

        {/* Dynamic Calendar Component */}
        <View style={styles.section}>
          <Calendar
            completedDates={completedDates}
            streakCount={streak}
            habitTitle={title}
            onDatePress={handleDatePress}
            showHeader={false}
          />
        </View>
      </ScrollView>
    </BottomSheet>
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
    color: "#FFFFFF",
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    color: "#888",
    fontSize: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#252525",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFB800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#888",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  startDate: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
  },
});
