import React, { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Pencil, Trash2 } from "lucide-react-native";
import { useTheme } from "../context/themeContext";

function IngotItem({ item, onToggle, onDelete, onEdit }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface },
        item.result && styles.completedContainer,
      ]}
    >
      <Pressable
        style={styles.content}
        onPress={() => onToggle(item.id)}
        accessibilityRole="checkbox"
        accessibilityLabel={
          item.result
            ? `Mark ${item.title} as pending`
            : `Mark ${item.title} as complete`
        }
        accessibilityState={{ checked: item.result }}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: theme.border },
            item.result && styles.checkboxChecked,
            item.result && { backgroundColor: theme.accentStrong, borderColor: theme.accentStrong },
          ]}
        >
          {item.result && <Text style={[styles.checkmark, { color: theme.textOnAccent }]}>✓</Text>}
        </View>
        <Text
          style={[
            styles.title,
            { color: theme.textPrimary },
            item.result && styles.titleCompleted,
            item.result && { color: theme.textMuted },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => onEdit(item)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${item.title}`}
        >
          <Pencil size={18} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => onDelete(item.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.title}`}
        >
          <Trash2 size={20} color={theme.error} />
        </Pressable>
      </View>
    </View>
  );
}

function areEqual(prevProps, nextProps) {
  return (
    prevProps.item === nextProps.item &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onEdit === nextProps.onEdit
  );
}

export default memo(IngotItem, areEqual);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 8,
    paddingRight: 10,
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
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {},
  checkmark: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  titleCompleted: {
    textDecorationLine: "line-through",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
