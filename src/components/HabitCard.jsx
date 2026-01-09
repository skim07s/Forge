import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

export default function HabitCard({
  habit,
  onToggle,
  onDelete,
  onExpand,
  onDateToggle,
  index = 0,
}) {
  const { id, title, streak, completedToday, completedDates = [] } = habit;
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Get current week dates
  const getWeekDates = () => {
    const today = currentDate;
    const dayOfWeek = today.getDay();
    const todayStr = today.toISOString().split("T")[0];
    const dates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayOfWeek + i);
      const dateStr = date.toISOString().split("T")[0];
      dates.push({
        date: dateStr,
        day: date.getDate(),
        dayName: ["S", "M", "T", "W", "T", "F", "S"][i],
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      });
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const handleCheckboxPress = () => {
    onToggle(id);
  };

  const handleExpandPress = () => {
    if (onExpand) {
      onExpand(id);
    }
  };

  return (
    <View
      style={[styles.container, completedToday && styles.containerCompleted]}
    >
      <View style={styles.mainContent}>
        <Pressable style={styles.content} onLongPress={() => onDelete(id)}>
          <Pressable
            style={[styles.checkbox, completedToday && styles.checkboxChecked]}
            onPress={handleCheckboxPress}
          >
            {completedToday && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>
          <View style={styles.textContainer}>
            <Text
              style={[styles.title, completedToday && styles.titleCompleted]}
            >
              {title}
            </Text>
            <Text style={styles.streak}>🔥 {streak} day streak</Text>
          </View>
          <Pressable style={styles.expandButton} onPress={handleExpandPress}>
            <Text style={styles.expandIcon}>⌄</Text>
          </Pressable>
        </Pressable>

        {/* Week Calendar */}
        <View style={styles.weekCalendar}>
          {weekDates.map((day, idx) => {
            const isCompleted = completedDates.includes(day.date);
            return (
              <Pressable
                key={idx}
                style={[
                  styles.dayContainer, 
                  day.isFuture && { opacity: 0.3 }
                ]}
                disabled={day.isFuture}
                onPress={() => onDateToggle && onDateToggle(id, day.date)}
              >
                <Text style={styles.dayName}>{day.dayName}</Text>
                <View
                  style={[
                    styles.dayCircle,
                    isCompleted && styles.dayCompleted,
                    day.isToday && styles.dayToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isCompleted && styles.dayNumberCompleted,
                      day.isToday && !isCompleted && styles.dayNumberToday,
                    ]}
                  >
                    {day.day}
                  </Text>
                </View>
              </Pressable>

            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  containerCompleted: {
    backgroundColor: "#1A1A1A",
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
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#FFB800",
    borderColor: "#FFB800",
  },
  checkmark: {
    color: "#0D0D0D",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: "#666",
  },
  streak: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#FF6B35",
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
  },
  expandIcon: {
    fontSize: 20,
    color: "#888",
    marginTop: -4,
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
    fontSize: 10,
    color: "#666",
    fontFamily: "Inter_500Medium",
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
  },
  dayCompleted: {
    backgroundColor: "#FFB800",
  },
  dayToday: {
    borderWidth: 2,
    borderColor: "#FFB800",
  },
  dayNumber: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Inter_600SemiBold",
  },
  dayNumberCompleted: {
    color: "#0D0D0D",
  },
  dayNumberToday: {
    color: "#FFB800",
  },
});
