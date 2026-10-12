import { describe, expect, it, jest } from '@jest/globals';

import {
  computeTaskTriggerDate,
  findOrphanNotificationIdentifiers,
  getExpectedReminderIdentifiers,
  getHabitTriggerConfigs,
  parseTimeParts,
  REMINDER_CHANNEL_ID,
} from '@/lib/notifications';
import type { Habit, Task } from '@/db/repo';

// Mock expo-constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    executionEnvironment: 'bare',
  },
  ExecutionEnvironment: {
    Bare: 'bare',
    Standalone: 'standalone',
    StoreClient: 'storeClient',
  },
}));

// Mock expo-notifications
const mockScheduleNotificationAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();
const mockGetAllScheduledNotificationsAsync = jest.fn();
const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockSetNotificationHandler = jest.fn();

jest.mock('expo-notifications', () => ({
  __esModule: true,
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
  AndroidImportance: {
    HIGH: 4,
  },
  scheduleNotificationAsync: (...args: unknown[]) =>
    mockScheduleNotificationAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) =>
    mockCancelScheduledNotificationAsync(...args),
  getAllScheduledNotificationsAsync: () =>
    mockGetAllScheduledNotificationsAsync(),
  getPermissionsAsync: () => mockGetPermissionsAsync(),
  requestPermissionsAsync: () => mockRequestPermissionsAsync(),
  setNotificationChannelAsync: (...args: unknown[]) =>
    mockSetNotificationChannelAsync(...args),
  setNotificationHandler: (...args: unknown[]) =>
    mockSetNotificationHandler(...args),
}));

describe('lib/notifications - Pure Logic & Computations', () => {
  describe('parseTimeParts', () => {
    it('parses valid HH:MM strings into numeric hour and minute', () => {
      expect(parseTimeParts('09:00')).toEqual({ hour: 9, minute: 0 });
      expect(parseTimeParts('14:30')).toEqual({ hour: 14, minute: 30 });
      expect(parseTimeParts('0:0')).toEqual({ hour: 0, minute: 0 });
      expect(parseTimeParts('23:59')).toEqual({ hour: 23, minute: 59 });
    });

    it('returns null for invalid strings or out-of-range times', () => {
      expect(parseTimeParts(null)).toBeNull();
      expect(parseTimeParts(undefined)).toBeNull();
      expect(parseTimeParts('')).toBeNull();
      expect(parseTimeParts('24:00')).toBeNull();
      expect(parseTimeParts('12:60')).toBeNull();
      expect(parseTimeParts('invalid')).toBeNull();
    });
  });

  describe('computeTaskTriggerDate', () => {
    // Reference timestamp: 2026-10-12 at 12:00:00 local time
    const fakeNow = new Date(2026, 9, 12, 12, 0, 0, 0).getTime();

    it('computes correct local trigger Date for future time on same day', () => {
      const target = computeTaskTriggerDate('2026-10-12', '14:30', fakeNow);
      expect(target).not.toBeNull();
      expect(target!.getFullYear()).toBe(2026);
      expect(target!.getMonth()).toBe(9); // October
      expect(target!.getDate()).toBe(12);
      expect(target!.getHours()).toBe(14);
      expect(target!.getMinutes()).toBe(30);
    });

    it('computes correct trigger Date for future day', () => {
      const target = computeTaskTriggerDate('2026-10-15', '09:00', fakeNow);
      expect(target).not.toBeNull();
      expect(target!.getDate()).toBe(15);
      expect(target!.getHours()).toBe(9);
    });

    it('skips and returns null for past times on same day', () => {
      const pastTime = computeTaskTriggerDate('2026-10-12', '11:00', fakeNow);
      expect(pastTime).toBeNull();
    });

    it('skips and returns null for dates in the past', () => {
      const pastDay = computeTaskTriggerDate('2026-10-10', '18:00', fakeNow);
      expect(pastDay).toBeNull();
    });

    it('returns null if dueDate or timeStr is missing', () => {
      expect(computeTaskTriggerDate(null, '14:00', fakeNow)).toBeNull();
      expect(computeTaskTriggerDate('2026-10-15', null, fakeNow)).toBeNull();
    });
  });

  describe('getHabitTriggerConfigs', () => {
    it('returns a single daily trigger when habit runs on all 7 days', () => {
      const configs = getHabitTriggerConfigs('h1', [0, 1, 2, 3, 4, 5, 6], '08:30');
      expect(configs).toHaveLength(1);
      expect(configs[0].identifier).toBe('habit-h1');
      expect(configs[0].trigger).toEqual({
        type: 'daily',
        hour: 8,
        minute: 30,
        channelId: REMINDER_CHANNEL_ID,
      });
    });

    it('defaults to daily trigger when days array is empty', () => {
      const configs = getHabitTriggerConfigs('h1', [], '08:30');
      expect(configs).toHaveLength(1);
      expect(configs[0].identifier).toBe('habit-h1');
      expect(configs[0].trigger.type).toBe('daily');
    });

    it('returns weekly triggers for specific active weekdays', () => {
      // Orbit weekdays: 1 = Mon, 3 = Wed, 5 = Fri
      // Expo weekly weekday mapping: d + 1 -> 2 = Mon, 4 = Wed, 6 = Fri
      const configs = getHabitTriggerConfigs('gym', [1, 3, 5], '07:00');
      expect(configs).toHaveLength(3);
      expect(configs.map((c) => c.identifier)).toEqual([
        'habit-gym-day-1',
        'habit-gym-day-3',
        'habit-gym-day-5',
      ]);
      expect(configs[0].trigger).toEqual({
        type: 'weekly',
        weekday: 2,
        hour: 7,
        minute: 0,
        channelId: REMINDER_CHANNEL_ID,
      });
      expect(configs[1].trigger).toEqual({
        type: 'weekly',
        weekday: 4,
        hour: 7,
        minute: 0,
        channelId: REMINDER_CHANNEL_ID,
      });
      expect(configs[2].trigger).toEqual({
        type: 'weekly',
        weekday: 6,
        hour: 7,
        minute: 0,
        channelId: REMINDER_CHANNEL_ID,
      });
    });

    it('correctly maps Sunday (Orbit 0 -> Expo 1)', () => {
      const configs = getHabitTriggerConfigs('church', [0], '10:00');
      expect(configs).toHaveLength(1);
      expect(configs[0].identifier).toBe('habit-church-day-0');
      expect((configs[0].trigger as { weekday: number }).weekday).toBe(1);
    });

    it('returns empty array if timeStr is missing or invalid', () => {
      expect(getHabitTriggerConfigs('h1', [1, 2], null)).toEqual([]);
      expect(getHabitTriggerConfigs('h1', [1, 2], 'invalid')).toEqual([]);
    });
  });

  describe('Reconciliation & Identifier Analysis', () => {
    const fakeNow = new Date(2026, 9, 12, 12, 0, 0, 0).getTime();

    const mockTasks: Task[] = [
      {
        id: 't-future',
        title: 'Future Task',
        priority: 1,
        due: '2026-10-15',
        reminder: '14:00',
        tag: '',
        done: false,
        doneAt: null,
        createdAt: '2026-10-12',
      },
      {
        id: 't-past',
        title: 'Past Task',
        priority: 1,
        due: '2026-10-10',
        reminder: '09:00',
        tag: '',
        done: false,
        doneAt: null,
        createdAt: '2026-10-10',
      },
      {
        id: 't-done',
        title: 'Completed Task',
        priority: 1,
        due: '2026-10-15',
        reminder: '14:00',
        tag: '',
        done: true,
        doneAt: '2026-10-12',
        createdAt: '2026-10-12',
      },
      {
        id: 't-no-reminder',
        title: 'No Reminder Task',
        priority: 1,
        due: '2026-10-15',
        reminder: null,
        tag: '',
        done: false,
        doneAt: null,
        createdAt: '2026-10-12',
      },
    ];

    const mockHabits: Habit[] = [
      {
        id: 'h-daily',
        name: 'Daily Habit',
        icon: 'drop',
        color: '#ff7a45',
        days: [0, 1, 2, 3, 4, 5, 6],
        reminder: '08:00',
        createdAt: '2026-10-12',
      },
      {
        id: 'h-mwf',
        name: 'Gym',
        icon: 'dumb',
        color: '#5cc8ff',
        days: [1, 3, 5],
        reminder: '18:00',
        createdAt: '2026-10-12',
      },
      {
        id: 'h-no-reminder',
        name: 'Read',
        icon: 'book',
        color: '#3ddc97',
        days: [0, 1, 2, 3, 4, 5, 6],
        reminder: null,
        createdAt: '2026-10-12',
      },
    ];

    it('getExpectedReminderIdentifiers accurately derives only valid future and active reminders', () => {
      const expected = getExpectedReminderIdentifiers(mockTasks, mockHabits, fakeNow);

      // t-future should be expected
      expect(expected.has('task-t-future')).toBe(true);

      // t-past, t-done, t-no-reminder should NOT be expected
      expect(expected.has('task-t-past')).toBe(false);
      expect(expected.has('task-t-done')).toBe(false);
      expect(expected.has('task-t-no-reminder')).toBe(false);

      // h-daily has 7 days -> habit-h-daily
      expect(expected.has('habit-h-daily')).toBe(true);

      // h-mwf has days 1, 3, 5 -> weekly identifiers
      expect(expected.has('habit-h-mwf-day-1')).toBe(true);
      expect(expected.has('habit-h-mwf-day-3')).toBe(true);
      expect(expected.has('habit-h-mwf-day-5')).toBe(true);
      expect(expected.has('habit-h-mwf')).toBe(false);

      // h-no-reminder should not have any
      expect(expected.has('habit-h-no-reminder')).toBe(false);
    });

    it('findOrphanNotificationIdentifiers identifies obsolete Orbit notifications', () => {
      const expected = new Set(['task-t-future', 'habit-h-daily']);
      const existing = [
        'task-t-future', // valid
        'task-t-deleted', // orphan
        'habit-h-daily', // valid
        'habit-h-old-day-2', // orphan
        'unrelated-system-id', // non-orbit notification
      ];

      const orphans = findOrphanNotificationIdentifiers(existing, expected);
      expect(orphans).toEqual(['task-t-deleted', 'habit-h-old-day-2']);
    });
  });
});
