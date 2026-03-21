import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/themeContext";

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const { theme } = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.overlay }]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
        />

        <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              style={[
                styles.button,
                styles.secondaryButton,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: destructive ? theme.error : theme.accent,
                },
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text style={[styles.primaryButtonText, { color: theme.textOnAccent }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  message: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  button: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
