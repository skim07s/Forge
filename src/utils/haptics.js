import { Platform } from "react-native";

let cachedHaptics = null;
let didTryLoad = false;

function getHaptics() {
  if (didTryLoad) return cachedHaptics;
  didTryLoad = true;

  try {
    cachedHaptics = require("@mhpdev/react-native-haptics").default;
  } catch {
    cachedHaptics = null;
  }

  return cachedHaptics;
}

export async function triggerBubblePopHaptic() {
  const Haptics = getHaptics();
  if (!Haptics) return;

  try {
    if (Platform.OS === "android") {
      await Haptics.androidHaptics("confirm");
      return;
    }

    await Haptics.impact("soft");
  } catch {
    try {
      await Haptics.selection();
    } catch {
      // Ignore haptics errors to avoid blocking UX.
    }
  }
}

