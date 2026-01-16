import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const SPRING_CONFIG = {
  mass: 1.1,
  damping: 14,
  stiffness: 85,
};

export default function NewHabitSheet({ visible, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const overlayOpacity = useSharedValue(0);
  const translateY = useSharedValue(500);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setTitle("");
      setDescription("");
      setReminderEnabled(false);
      translateY.value = withSpring(0, SPRING_CONFIG);
      overlayOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = 500;
      overlayOpacity.value = 0;
    }
  }, [visible]);

  const handleCreate = () => {
    const name = title.trim();
    if (!name) return;
    Keyboard.dismiss();
    onCreate?.({
      title: name,
      description: description.trim(),
      reminderEnabled,
    });
  };

  const handleClose = () => {
    Keyboard.dismiss();
    translateY.value = withSpring(500, SPRING_CONFIG);
    overlayOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 300);
  };

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Overlay */}
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
          <Pressable style={styles.overlayPressable} onPress={handleClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[styles.sheet, sheetAnimatedStyle]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Habit</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Habit name</Text>
            <TextInput
              autoFocus
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Morning run"
              placeholderTextColor="#666"
              style={styles.input}
              returnKeyType="next"
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
          </ScrollView>

          {/* Footer - Always visible above keyboard */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable style={[styles.button, styles.cancel]} onPress={handleClose}>
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
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    maxHeight: "70%",
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
  },
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
  scrollContent: {
    flexGrow: 0,
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
    marginBottom: 16,
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
    paddingBottom: 16,
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

