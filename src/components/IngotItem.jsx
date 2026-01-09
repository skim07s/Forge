import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Trash2 } from "lucide-react-native";

export default function IngotItem({ item, onToggle, onDelete }) {
  return (
    <View style={[styles.container, item.result && styles.completedContainer]}>
      <Pressable 
        style={styles.content} 
        onPress={() => onToggle(item.id)}
      >
        <View style={[styles.checkbox, item.result && styles.checkboxChecked]}>
          {item.result && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.title, item.result && styles.titleCompleted]}>
          {item.title}
        </Text>
      </Pressable>

      <Pressable 
        style={styles.deleteButton} 
        onPress={() => onDelete(item.id)}
        hitSlop={8}
      >
        <Trash2 size={20} color="#FF6B35" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    marginBottom: 8,
    paddingRight: 16, // Right padding for the delete button
  },
  completedContainer: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
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
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
