import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

export default function HabitCard({ habit, onToggle, onDelete, onExpand }) {
  const { id, title, streak, completedToday } = habit;

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
      <View style={styles.content}>
        <Pressable
          style={[styles.checkbox, completedToday && styles.checkboxChecked]}
          onPress={handleCheckboxPress}
        >
          {completedToday && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>
        <Pressable
          style={styles.textContainer}
          onLongPress={() => onDelete(id)}
        >
          <Text style={[styles.title, completedToday && styles.titleCompleted]}>
            {title}
          </Text>
          <Text style={styles.streak}>🔥 {streak} day streak</Text>
        </Pressable>
        <Pressable style={styles.expandButton} onPress={handleExpandPress}>
          <Text style={styles.expandIcon}>⌄</Text>
        </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerCompleted: {
    backgroundColor: "#1A1A1A",
    opacity: 0.7,
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
});
