import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
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

export default function NewIngotSheet({ visible, onClose, onCreate, initialTitle = "" }) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeTimeoutRef = useRef(null);
  const overlayOpacity = useSharedValue(0);
  const translateY = useSharedValue(500);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const isEditMode = !!initialTitle;

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle ?? "");
      setIsSubmitting(false);
      translateY.value = withSpring(0, SPRING_CONFIG);
      overlayOpacity.value = withTiming(1, { duration: 200 });
    } else {
      setIsSubmitting(false);
      translateY.value = 500;
      overlayOpacity.value = 0;
    }
  }, [initialTitle, visible]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleCreate = () => {
    if (isSubmitting) return;

    const nextTitle = title.trim();
    if (!nextTitle) return;

    setIsSubmitting(true);
    Keyboard.dismiss();
    try {
      onCreate(nextTitle);
      setTitle("");
      handleClose();
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
              {isEditMode ? "Edit Task" : "New Task"}
            </Text>
            <Pressable
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]}
              accessibilityRole="button"
              accessibilityLabel={isEditMode ? "Close edit task form" : "Close new task form"}
              hitSlop={8}
            >
              <Text style={[styles.closeText, { color: theme.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.content}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceMuted, color: theme.textPrimary }]}
              placeholder="What needs to be done?"
              placeholderTextColor={theme.inputPlaceholder}
              value={title}
              onChangeText={setTitle}
              autoFocus={visible}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              accessibilityLabel="Task title"
              maxLength={160}
            />
          </View>

          <Pressable
            style={[
              styles.createButton,
              { backgroundColor: theme.accent },
              !title.trim() && styles.disabledButton,
              !title.trim() && { backgroundColor: theme.surfaceMuted },
              { marginBottom: insets.bottom + 16 },
            ]}
            onPress={handleCreate}
            disabled={!title.trim() || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel={isEditMode ? "Save task changes" : "Add task to ingot list"}
          >
            <Text style={[styles.createButtonText, { color: theme.textOnAccent }]}>
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Adding..."
                : isEditMode
                  ? "Save Changes"
                  : "Add to Ingot List"}
            </Text>
          </Pressable>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
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
  content: {
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  createButton: {
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  disabledButton: {},
  createButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
