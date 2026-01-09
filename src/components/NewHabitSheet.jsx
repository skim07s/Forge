import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
} from "react-native";
import BottomSheet from "./BottomSheet";

export default function NewHabitSheet({ visible, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle("");
      setDescription("");
      setReminderEnabled(false);
    }
  }, [visible]);

  const handleCreate = () => {
    const name = title.trim();
    if (!name) return;
    onCreate?.({
      title: name,
      description: description.trim(),
      reminderEnabled,
    });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight={0.7}>
      <View style={styles.header}>
        <Text style={styles.title}>New Habit</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>Habit name</Text>
        <TextInput
          autoFocus
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Morning run"
          placeholderTextColor="#666"
          style={styles.input}
          onSubmitEditing={handleCreate}
          returnKeyType="done"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Optional: add details about this habit"
          placeholderTextColor="#666"
          style={[styles.input, styles.textarea]}
          multiline
        />

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Set reminder</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: "#555", true: "#FF8A5A" }}
            thumbColor={reminderEnabled ? "#FF6B35" : "#CCC"}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={[styles.button, styles.cancel]} onPress={onClose}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            styles.create,
            { opacity: title.trim() ? 1 : 0.6 },
          ]}
          onPress={handleCreate}
          disabled={!title.trim()}
        >
          <Text style={[styles.buttonText, styles.createText]}>Create</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
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
  body: {
    marginTop: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#242424",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },
  textarea: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  toggleRow: {
    marginTop: 16,
    backgroundColor: "#242424",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancel: {
    backgroundColor: "#2A2A2A",
  },
  create: {
    backgroundColor: "#FF6B35",
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    fontSize: 16,
  },
  createText: {
    color: "#FFFFFF",
  },
});
