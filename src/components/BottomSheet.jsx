import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Modal,
  Keyboard,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

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
  // Shared Values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const keyboardOffset = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  
  // Track keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates.height;
        setKeyboardHeight(height);
        // Animate sheet up with spring
        keyboardOffset.value = withSpring(-height + 40, SPRING_CONFIG);
      }
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
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
      // Small delay to ensure reset, then animate open with spring
      setTimeout(() => {
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

  const dismiss = () => {
    // Dismiss keyboard first
    Keyboard.dismiss();
    // Close animation with same spring config
    translateY.value = withSpring(SCREEN_HEIGHT, SPRING_CONFIG);
    overlayOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      onClose();
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
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.modalContainer}>
        {/* Overlay */}
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
          <Pressable style={styles.overlayPressable} onPress={dismiss} />
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              { maxHeight: SCREEN_HEIGHT * maxHeight },
              sheetAnimatedStyle,
            ]}
          >
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Content */}
            <View style={styles.content}>{children}</View>

            {/* Bottom Extension to fill gap */}
            <View style={styles.bottomExtension} />
          </Animated.View>
        </GestureDetector>
      </View>
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
    backgroundColor: "#444",
    borderRadius: 2,
  },
  content: {
    flexShrink: 1,
  },
  bottomExtension: {
    position: "absolute",
    bottom: -200,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "#1A1A1A",
  },
});
