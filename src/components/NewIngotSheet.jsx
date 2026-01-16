import React, { useState, useEffect } from "react";
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

const SPRING_CONFIG = {
  mass: 1.1,
  damping: 14,
  stiffness: 85,
};

export default function NewIngotSheet({ visible, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const overlayOpacity = useSharedValue(0);
  const translateY = useSharedValue(500);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setTitle("");
      translateY.value = withSpring(0, SPRING_CONFIG);
      overlayOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = 500;
      overlayOpacity.value = 0;
    }
  }, [visible]);

  const handleCreate = () => {
    if (!title.trim()) return;
    Keyboard.dismiss();
    onCreate(title);
    setTitle("");
    handleClose();
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
            <Text style={styles.title}>New Task</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <TextInput
              style={styles.input}
              placeholder="What needs to be done?"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
              autoFocus={visible}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
          </View>

          {/* Footer - Always visible above keyboard */}
          <Pressable
            style={[styles.createButton, !title.trim() && styles.disabledButton, { marginBottom: insets.bottom + 16 }]}
            onPress={handleCreate}
            disabled={!title.trim()}
          >
            <Text style={styles.createButtonText}>Add to Ingot List</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#888',
    fontSize: 16,
  },
  content: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
  },
  createButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
