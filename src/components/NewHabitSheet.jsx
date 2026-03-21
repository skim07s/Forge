import React, { useState, useEffect, useRef } from "react";
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
import { useTheme } from "../context/themeContext";

const SPRING_CONFIG = {
  mass: 1.1,
  damping: 14,
  stiffness: 85,
};

export default function NewHabitSheet({
  visible,
  onClose,
  onCreate,
  initialValues = null,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeTimeoutRef = useRef(null);
  const overlayOpacity = useSharedValue(0);
  const translateY = useSharedValue(500);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const isEditMode = !!initialValues;

  useEffect(() => {
    if (visible) {
      setTitle(initialValues?.title ?? "");
      setDescription(initialValues?.description ?? "");
      setReminderEnabled(!!initialValues?.reminderEnabled);
      setIsSubmitting(false);
      translateY.value = withSpring(0, SPRING_CONFIG);
      overlayOpacity.value = withTiming(1, { duration: 200 });
    } else {
      setIsSubmitting(false);
      translateY.value = 500;
      overlayOpacity.value = 0;
    }
  }, [initialValues, visible]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleCreate = async () => {
    if (isSubmitting) return;

    const name = title.trim();
    if (!name) return;

    setIsSubmitting(true);
    Keyboard.dismiss();
    try {
      await onCreate?.({
        title: name,
        description: description.trim(),
        reminderEnabled,
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    translateY.value = withSpring(500, SPRING_CONFIG);
    overlayOpacity.value = withTiming(0, { duration: 200 });
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose?.();
    }, 300);
  };

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View
          style={[styles.overlay, overlayAnimatedStyle, { backgroundColor: theme.overlay }]}
        >
          <Pressable style={styles.overlayPressable} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetAnimatedStyle, { backgroundColor: theme.surface }]}>
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {isEditMode ? "Edit Habit" : "New Habit"}
            </Text>
            <Pressable
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]}
              accessibilityRole="button"
              accessibilityLabel={isEditMode ? "Close edit habit form" : "Close new habit form"}
              hitSlop={8}
            >
              <Text style={[styles.closeText, { color: theme.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.label, { color: theme.textSecondary }]}>Habit name</Text>
            <TextInput
              autoFocus
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Morning run"
              placeholderTextColor={theme.inputPlaceholder}
              style={[styles.input, { backgroundColor: theme.surfaceMuted, color: theme.textPrimary }]}
              returnKeyType="next"
              accessibilityLabel="Habit name"
              maxLength={120}
            />

            <Text style={[styles.label, { marginTop: 16, color: theme.textSecondary }]}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Optional: add details about this habit"
              placeholderTextColor={theme.inputPlaceholder}
              style={[
                styles.input,
                styles.textarea,
                { backgroundColor: theme.surfaceMuted, color: theme.textPrimary },
              ]}
              multiline
              accessibilityLabel="Habit description"
              maxLength={500}
            />

            <View style={[styles.toggleRow, { backgroundColor: theme.surfaceMuted }]}>
              <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Set reminder</Text>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
                thumbColor={reminderEnabled ? theme.switchThumbOn : theme.switchThumbOff}
              />
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={[styles.button, styles.cancel, { backgroundColor: theme.surfaceMuted }]}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={isEditMode ? "Cancel editing habit" : "Cancel new habit"}
            >
              <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.create,
                { backgroundColor: theme.accent },
                { opacity: title.trim() ? 1 : 0.6 },
              ]}
              onPress={handleCreate}
              disabled={!title.trim() || isSubmitting}
              accessibilityRole="button"
              accessibilityLabel={isEditMode ? "Save habit changes" : "Create habit"}
            >
              <Text style={[styles.buttonText, styles.createText, { color: theme.textOnAccent }]}>
                {isSubmitting
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create"}
              </Text>
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
  },
  overlayPressable: {
    flex: 1,
  },
  sheet: {
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
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 16,
  },
  scrollContent: {
    flexGrow: 0,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  textarea: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  toggleRow: {
    marginTop: 16,
    marginBottom: 16,
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
  cancel: {},
  create: {},
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  createText: {},
});

