import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const REMINDER_CHANNEL_ID = "forge-habit-reminders";
const DEFAULT_REMINDER_HOUR = 20;
const DEFAULT_REMINDER_MINUTE = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let androidChannelReady = false;

const ensureAndroidChannel = async () => {
  if (Platform.OS !== "android" || androidChannelReady) return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Habit Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 100, 200],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  androidChannelReady = true;
};

const ensureNotificationPermission = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
};

export const scheduleDailyHabitReminder = async ({
  habitId,
  habitTitle,
  hour = DEFAULT_REMINDER_HOUR,
  minute = DEFAULT_REMINDER_MINUTE,
}) => {
  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  await ensureAndroidChannel();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Habit Reminder",
      body: `Time to complete: ${habitTitle}`,
      sound: true,
      data: {
        type: "habit-reminder",
        habitId,
      },
    },
    trigger: Platform.select({
      android: {
        hour,
        minute,
        repeats: true,
        channelId: REMINDER_CHANNEL_ID,
      },
      default: {
        hour,
        minute,
        repeats: true,
      },
    }),
  });

  return notificationId;
};

export const cancelHabitReminder = async (notificationId) => {
  if (!notificationId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore cancellation failures.
  }
};

