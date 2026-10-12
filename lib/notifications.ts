import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsType from 'expo-notifications';
import { Platform } from 'react-native';

import type { Habit, Task } from '@/db/repo';
import { parseLocalDate } from '@/lib/date';

/**
 * NOTE ON ANDROID OEM RELIABILITY:
 * On certain Android OEM variants (e.g., Xiaomi/MIUI/HyperOS, Oppo/ColorOS, Vivo/FuntouchOS, Samsung/OneUI),
 * aggressive background battery optimization may kill background processes or postpone alarms.
 * For 100% reliable reminder delivery, advise users to configure app battery usage to "Unrestricted"
 * and disable battery optimization in device settings.
 */

export const REMINDER_CHANNEL_ID = 'orbit-reminders';

/**
 * Check if running inside Expo Go store client.
 */
export function isExpoGo(): boolean {
  try {
    return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  } catch {
    return false;
  }
}

/**
 * Check if local notifications are supported in current environment.
 */
export function isNotificationsSupported(): boolean {
  if (Platform.OS === 'web') return false;
  if (isExpoGo()) return false;
  return true;
}

let _notificationsModule: typeof NotificationsType | null = null;
let _channelInitialized = false;
let _handlerInitialized = false;

/**
 * Lazily load expo-notifications module and initialize foreground handler.
 */
export async function getNotifications(): Promise<typeof NotificationsType | null> {
  if (!isNotificationsSupported()) return null;
  if (!_notificationsModule) {
    try {
      _notificationsModule = await import('expo-notifications');
      initNotificationHandler(_notificationsModule);
    } catch {
      return null;
    }
  }
  return _notificationsModule;
}

/**
 * Initialize foreground notification presentation handler.
 */
function initNotificationHandler(Notifications: typeof NotificationsType): void {
  if (_handlerInitialized) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    _handlerInitialized = true;
  } catch {
    // Fail silently without crashing
  }
}

/**
 * Create or configure the Android notification channel with HIGH importance.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!isNotificationsSupported()) return;
  if (_channelInitialized) return;

  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Orbit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff7a45',
    });
    _channelInitialized = true;
  } catch {
    // Fail silently without crashing
  }
}

/**
 * One-time initialization run on app startup.
 */
export async function initNotifications(): Promise<void> {
  if (!isNotificationsSupported()) return;
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;
    if (Platform.OS === 'android') {
      await setupNotificationChannel();
    }
  } catch {
    // Fail silently
  }
}

/**
 * Check current notification permission status without prompting.
 */
export async function getNotificationPermissionStatus(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return false;
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Request notification permission if not already granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return false;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Parse HH:MM string into numeric hour and minute.
 */
export function parseTimeParts(
  timeStr: string | null | undefined,
): { hour: number; minute: number } | null {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  if (
    isNaN(hour) ||
    isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { hour, minute };
}

/**
 * Compute the target trigger Date for a task reminder in local time.
 * Returns null if dueDate/timeStr is invalid or if the timestamp is in the past.
 */
export function computeTaskTriggerDate(
  dueDate: string | null | undefined,
  timeStr: string | null | undefined,
  nowMs: number = Date.now(),
): Date | null {
  if (!dueDate || !timeStr) return null;
  const time = parseTimeParts(timeStr);
  if (!time) return null;

  const targetDate = parseLocalDate(dueDate);
  targetDate.setHours(time.hour, time.minute, 0, 0);

  // If time has already passed, skip scheduling
  if (targetDate.getTime() <= nowMs) {
    return null;
  }

  return targetDate;
}

export type HabitTriggerConfig = {
  identifier: string;
  trigger:
    | NotificationsType.DailyTriggerInput
    | NotificationsType.WeeklyTriggerInput;
};

/**
 * Compute habit trigger configs based on active weekdays.
 * Uses DAILY if all 7 days are active, or WEEKLY per active weekday.
 */
export function getHabitTriggerConfigs(
  habitId: string,
  days: number[],
  timeStr: string | null | undefined,
  channelId: string = REMINDER_CHANNEL_ID,
): HabitTriggerConfig[] {
  const time = parseTimeParts(timeStr);
  if (!time) return [];

  const validDays = days.filter((d) => d >= 0 && d <= 6);
  const uniqueDays = Array.from(new Set(validDays));
  const isAllWeek = uniqueDays.length === 7 || uniqueDays.length === 0;

  if (isAllWeek) {
    return [
      {
        identifier: `habit-${habitId}`,
        trigger: {
          type: 'daily' as NotificationsType.SchedulableTriggerInputTypes.DAILY,
          hour: time.hour,
          minute: time.minute,
          channelId,
        },
      },
    ];
  }

  // Weekly triggers for each active weekday.
  // Note: expo-notifications WEEKLY weekday is 1..7 (1 = Sunday, 7 = Saturday).
  // Orbit days: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
  // Therefore: expoWeekday = orbitDay + 1.
  return uniqueDays
    .sort((a, b) => a - b)
    .map((d) => ({
      identifier: `habit-${habitId}-day-${d}`,
      trigger: {
        type: 'weekly' as NotificationsType.SchedulableTriggerInputTypes.WEEKLY,
        weekday: d + 1,
        hour: time.hour,
        minute: time.minute,
        channelId,
      },
    }));
}

/**
 * Schedule a task reminder for due date at specified time.
 */
export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  dueDate: string | null | undefined,
  timeStr: string | null | undefined,
): Promise<string | null> {
  const identifier = `task-${taskId}`;
  await cancelReminder(identifier);

  if (!dueDate || !timeStr) return null;

  const targetDate = computeTaskTriggerDate(dueDate, timeStr);
  if (!targetDate) return null;

  if (!isNotificationsSupported()) return null;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  await setupNotificationChannel();

  try {
    const Notifications = await getNotifications();
    if (!Notifications) return null;

    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'Orbit Task Reminder',
        body: taskTitle,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
    return id;
  } catch {
    return null;
  }
}

/**
 * Schedule habit reminder (daily or weekly triggers per active weekday).
 */
export async function scheduleHabitReminder(
  habitId: string,
  habitName: string,
  days: number[],
  timeStr: string | null | undefined,
): Promise<string[] | null> {
  await cancelHabitReminders(habitId);

  if (!timeStr) return null;

  const configs = getHabitTriggerConfigs(
    habitId,
    days,
    timeStr,
    REMINDER_CHANNEL_ID,
  );
  if (configs.length === 0) return null;

  if (!isNotificationsSupported()) return null;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  await setupNotificationChannel();

  try {
    const Notifications = await getNotifications();
    if (!Notifications) return null;

    const scheduledIds: string[] = [];
    for (const cfg of configs) {
      const id = await Notifications.scheduleNotificationAsync({
        identifier: cfg.identifier,
        content: {
          title: 'Orbit Daily Habit',
          body: `Time for your habit: ${habitName}`,
          sound: true,
        },
        trigger: cfg.trigger,
      });
      scheduledIds.push(id);
    }
    return scheduledIds;
  } catch {
    return null;
  }
}

/**
 * Cancel a specific scheduled notification by identifier.
 */
export async function cancelReminder(identifier: string): Promise<void> {
  if (!isNotificationsSupported()) return;
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Fail silently without crashing
  }
}

/**
 * Cancel all scheduled reminders associated with a habit.
 */
export async function cancelHabitReminders(habitId: string): Promise<void> {
  if (!isNotificationsSupported()) return;
  const identifiers = [
    `habit-${habitId}`,
    ...Array.from({ length: 7 }, (_, d) => `habit-${habitId}-day-${d}`),
  ];
  await Promise.all(identifiers.map((id) => cancelReminder(id)));
}

/**
 * Compute the set of expected reminder identifiers from tasks and habits.
 */
export function getExpectedReminderIdentifiers(
  tasks: Task[],
  habits: Habit[],
  nowMs: number = Date.now(),
): Set<string> {
  const expected = new Set<string>();

  for (const t of tasks) {
    if (!t.done && t.due && t.reminder) {
      const targetDate = computeTaskTriggerDate(t.due, t.reminder, nowMs);
      if (targetDate) {
        expected.add(`task-${t.id}`);
      }
    }
  }

  for (const h of habits) {
    if (h.reminder) {
      const configs = getHabitTriggerConfigs(h.id, h.days, h.reminder);
      for (const cfg of configs) {
        expected.add(cfg.identifier);
      }
    }
  }

  return expected;
}

/**
 * Find orphan notification identifiers that belong to Orbit but are no longer expected.
 */
export function findOrphanNotificationIdentifiers(
  existingIdentifiers: string[],
  expectedIdentifiers: Set<string>,
): string[] {
  return existingIdentifiers.filter(
    (id) =>
      (id.startsWith('task-') || id.startsWith('habit-')) &&
      !expectedIdentifiers.has(id),
  );
}

/**
 * Reconcile scheduled notifications against SQLite state.
 * Cancels orphaned notifications and schedules any missing reminders.
 */
export async function reconcileReminders(
  tasks: Task[],
  habits: Habit[],
): Promise<void> {
  if (!isNotificationsSupported()) return;

  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    const existingRequests =
      await Notifications.getAllScheduledNotificationsAsync();
    const existingIds = new Set(existingRequests.map((r) => r.identifier));

    const expectedIds = getExpectedReminderIdentifiers(tasks, habits);

    // Cancel orphans
    const orphans = findOrphanNotificationIdentifiers(
      Array.from(existingIds),
      expectedIds,
    );
    for (const orphan of orphans) {
      await cancelReminder(orphan);
    }

    // Check permission before scheduling new ones
    const hasPermission = await getNotificationPermissionStatus();
    if (!hasPermission) return;

    // Schedule missing task reminders
    for (const t of tasks) {
      if (!t.done && t.due && t.reminder) {
        const id = `task-${t.id}`;
        if (!existingIds.has(id)) {
          await scheduleTaskReminder(t.id, t.title, t.due, t.reminder);
        }
      }
    }

    // Schedule missing habit reminders
    for (const h of habits) {
      if (h.reminder) {
        const configs = getHabitTriggerConfigs(h.id, h.days, h.reminder);
        const hasAnyMissing = configs.some(
          (cfg) => !existingIds.has(cfg.identifier),
        );
        if (hasAnyMissing) {
          await scheduleHabitReminder(h.id, h.name, h.days, h.reminder);
        }
      }
    }
  } catch {
    // Fail silently without crashing
  }
}
