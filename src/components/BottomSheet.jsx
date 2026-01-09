import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Modal,
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

export default function BottomSheet({
  visible,
  onClose,
  children,
  maxHeight = 0.85,
}) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  useEffect(() => {
    if (visible) {
      // Slide up with spring animation
      translateY.value = withSpring(0, {
        damping: 50,
        stiffness: 400,
      });
      overlayOpacity.value = withTiming(1, { duration: 250 });
    } else {
      // Reset for next open
      translateY.value = SCREEN_HEIGHT;
      overlayOpacity.value = 0;
    }
  }, [visible]);

  const dismiss = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    overlayOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
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
        // Fade overlay as sheet is dragged
        const progress = Math.min(event.translationY / SCREEN_HEIGHT, 1);
        overlayOpacity.value = 1 - progress * 0.5;
      }
    })
    .onEnd((event) => {
      'worklet';
      const shouldDismiss =
        event.translationY > DISMISS_THRESHOLD || event.velocityY > 500;

      if (shouldDismiss) {
        // Dismiss with velocity
        translateY.value = withSpring(
          SCREEN_HEIGHT,
          {
            velocity: event.velocityY,
            damping: 50,
            stiffness: 400,
          },
          () => {
            runOnJS(dismiss)();
          }
        );
        overlayOpacity.value = withTiming(0, { duration: 200 });
      } else {
        // Snap back with spring
        translateY.value = withSpring(0, {
          velocity: event.velocityY,
          damping: 50,
          stiffness: 400,
        });
        overlayOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Overlay */}
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
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
            {/* Bottom Extension to prevent gap */}
            <View style={styles.bottomExtension} />
            
            {/* Draggable Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Content */}
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sheet: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  bottomExtension: {
    position: "absolute",
    bottom: -200,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "#1A1A1A",
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#555",
    borderRadius: 2,
  },
});
