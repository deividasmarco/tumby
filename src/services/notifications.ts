import * as Notifications from 'expo-notifications';

// Show reminders even if the app is foregrounded when they fire.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const REMINDER_HOUR = 17; // 5 PM local
const REMINDER_MINUTE = 0;

const MESSAGES = [
  'Did your child try something new today?',
  'Small exposures count 🌱',
  'Time for today\'s Tumby check-in.',
];

/** Asks for notification permission if not already granted. Returns true if allowed. */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Schedules a single daily local reminder at 5 PM, replacing any existing one. */
export async function scheduleDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const body = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Tumby', body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
    },
  });
}

/** Cancels all scheduled reminders. */
export async function cancelReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
