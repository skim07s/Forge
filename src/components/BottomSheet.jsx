import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Modal,
  Keyboard,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "../context/themeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DISMISS_THRESHOLD = 150;

// Spring config - same for all animations
const SPRING_CONFIG = {
  mass: 1.1,
  damping: 14,
  stiffness: 85,
};

export default function BottomSheet({
  visible,
  onClose,
  children,
  maxHeight = 0.85,
}) {
  const openTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const { theme } = useTheme();

  // Shared Values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const keyboardOffset = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  // Keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates.height;
        // Animate sheet up with spring - use full height minus some padding
        keyboardOffset.value = withSpring(-height + 20, SPRING_CONFIG);
      }
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Animate sheet back down with spring
        keyboardOffset.value = withSpring(0, SPRING_CONFIG);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Animated Style - translateY + keyboard offset
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + keyboardOffset.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  useEffect(() => {
    if (visible) {
      // Reset position first
      translateY.value = SCREEN_HEIGHT;
      keyboardOffset.value = 0;
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
      // Small delay to ensure reset, then animate open with spring
      openTimeoutRef.current = setTimeout(() => {
        openTimeoutRef.current = null;
        translateY.value = withSpring(0, SPRING_CONFIG);
        overlayOpacity.value = withTiming(1, { duration: 200 });
      }, 10);
    } else {
      // Reset when closed
      translateY.value = SCREEN_HEIGHT;
      keyboardOffset.value = 0;
      overlayOpacity.value = 0;
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const dismiss = () => {
    // Dismiss keyboard first
    Keyboard.dismiss();
    // Close animation with same spring config
    translateY.value = withSpring(SCREEN_HEIGHT, SPRING_CONFIG);
    overlayOpacity.value = withTiming(0, { duration: 200 });
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose?.();
    }, 300);
  };

  // Pan gesture for dragging the sheet
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      'worklet';
      // Only allow dragging down
      if (event.translationY > 0) {
        translateY.value = context.value.y + event.translationY;
        const progress = Math.min(event.translationY / SCREEN_HEIGHT, 1);
        overlayOpacity.value = 1 - progress * 0.5;
      }
    })
    .onEnd((event) => {
      'worklet';
      const shouldDismiss =
        event.translationY > DISMISS_THRESHOLD || event.velocityY > 500;

      if (shouldDismiss) {
        // Dismiss with same spring config
        translateY.value = withSpring(SCREEN_HEIGHT, SPRING_CONFIG, () => {
          runOnJS(onClose)();
        });
        overlayOpacity.value = withTiming(0, { duration: 200 });
      } else {
        // Snap back with same spring config
        translateY.value = withSpring(0, SPRING_CONFIG);
        overlayOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={dismiss}
    >
      <KeyboardAvoidingView 
        style={styles.modalContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Overlay */}
        <Animated.View
          style={[styles.overlay, overlayAnimatedStyle, { backgroundColor: theme.overlay }]}
        >
          <Pressable
            style={styles.overlayPressable}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
          />
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              { maxHeight: SCREEN_HEIGHT * maxHeight, backgroundColor: theme.surface },
              sheetAnimatedStyle,
            ]}
          >
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: theme.border }]} />
            </View>

            {/* Content - wrapped in ScrollView for keyboard */}
            <ScrollView 
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>

            {/* Bottom Extension to fill gap */}
            <View style={[styles.bottomExtension, { backgroundColor: theme.surface }]} />
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
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
    paddingBottom: 40,
    minHeight: 200,
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
  scrollContent: {
    flexShrink: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  bottomExtension: {
    position: "absolute",
    bottom: -200,
    left: 0,
    right: 0,
    height: 200,
  },
});
