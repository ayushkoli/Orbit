import { create } from 'zustand';

import type { HabitIconName } from '@/components/Icon';
import * as repo from '@/db/repo';
import type { Habit, Task } from '@/db/repo';
import { newId, nowStamp, today } from '@/lib/date';
import {
  cancelHabitReminders,
  cancelReminder,
  reconcileReminders,
  scheduleHabitReminder,
  scheduleTaskReminder,
} from '@/lib/notifications';
import { HABIT_COLORS, type ThemeMode, type ThemePresetId } from '@/lib/theme';
import type { TaskFilter } from '@/lib/stats';

export type SheetKind = 't' | 'h';

export type SheetState = {
  type: SheetKind;
  id: string;
  n: string;
  p: 0 | 1 | 2;
  d: string;
  tag: string;
  i: HabitIconName;
  c: string;
  days: number[];
  reminder: string | null;
};

type Store = {
  ready: boolean;
  tasks: Task[];
  habits: Habit[];
  logs: Record<string, Record<string, true>>;
  themeMode: ThemeMode;
  selectedDate: string;
  taskFilter: TaskFilter;
  statsRange: 7 | 30 | 90;
  sheet: SheetState | null;
  profileOpen: boolean;
  userName: string;
  popId: string | null;
  hydrate: () => Promise<void>;
  setSelectedDate: (key: string) => void;
  setTaskFilter: (flt: TaskFilter) => void;
  setStatsRange: (n: 7 | 30 | 90) => void;
  setUserName: (name: string) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setThemePreset: (preset: ThemePresetId) => Promise<void>;
  toggleTheme: (resolved: 'light' | 'dark') => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  toggleHabitDate: (id: string, dateKey?: string) => Promise<void>;
  toggleHabitToday: (id: string) => Promise<void>;
  openProfile: () => void;
  closeProfile: () => void;
  openCreate: (type: SheetKind, defaultDue: string) => void;
  openEditTask: (id: string) => void;
  openEditHabit: (id: string) => void;
  patchSheet: (patch: Partial<SheetState>) => void;
  closeSheet: () => void;
  saveSheet: () => Promise<boolean>;
  deleteSheet: () => Promise<void>;
  backup: () => Promise<void>;
  restore: () => Promise<boolean>;
};

function logsMap(rows: { habitId: string; date: string }[]): Record<string, Record<string, true>> {
  const m: Record<string, Record<string, true>> = {};
  for (const r of rows) {
    if (!m[r.habitId]) m[r.habitId] = {};
    m[r.habitId][r.date] = true;
  }
  return m;
}

export const useStore = create<Store>((set, get) => ({
  ready: false,
  tasks: [],
  habits: [],
  logs: {},
  themeMode: 'dark-orbit',
  selectedDate: today(),
  taskFilter: 'open',
  statsRange: 30,
  sheet: null,
  profileOpen: false,
  userName: '',
  popId: null,

  hydrate: async () => {
    const snap = await repo.loadAll();
    set({
      ready: true,
      tasks: snap.tasks,
      habits: snap.habits,
      logs: logsMap(snap.logs),
      themeMode: snap.theme,
      userName: snap.userName ?? '',
    });
    void reconcileReminders(snap.tasks, snap.habits);
  },

  setSelectedDate: (key) => set({ selectedDate: key }),
  setTaskFilter: (flt) => set({ taskFilter: flt }),
  setStatsRange: (n) => set({ statsRange: n }),

  setUserName: async (name) => {
    set({ userName: name });
    await repo.setMeta('userName', name);
  },

  setThemeMode: async (mode) => {
    set({ themeMode: mode });
    await repo.setMeta('theme', mode);
  },

  setThemePreset: async (preset) => {
    set({ themeMode: preset });
    await repo.setMeta('theme', preset);
  },

  toggleTheme: async (resolved) => {
    const next = resolved === 'dark' ? 'light-orbit' : 'dark-orbit';
    await get().setThemeMode(next);
  },

  openProfile: () => set({ profileOpen: true }),
  closeProfile: () => set({ profileOpen: false }),

  toggleTask: async (id) => {
    const t = get().tasks.find((x) => x.id === id);
    if (!t) return;
    const done = !t.done;
    const next: Task = { ...t, done, doneAt: done ? today() : null };
    set({
      tasks: get().tasks.map((x) => (x.id === id ? next : x)),
      popId: id,
    });
    await repo.updateTask(next);
    if (done) {
      void cancelReminder(`task-${id}`);
    } else if (next.reminder && next.due) {
      void scheduleTaskReminder(next.id, next.title, next.due, next.reminder);
    }
    setTimeout(() => {
      if (get().popId === id) set({ popId: null });
    }, 400);
  },

  toggleHabitDate: async (id, dateKey) => {
    const k = dateKey || today();
    const current = get().logs[id]?.[k];
    const logs = { ...get().logs };
    const forH = { ...(logs[id] ?? {}) };
    if (current) {
      delete forH[k];
      await repo.removeLog(id, k);
    } else {
      forH[k] = true;
      await repo.addLog(id, k);
    }
    logs[id] = forH;
    set({ logs, popId: id });
    setTimeout(() => {
      if (get().popId === id) set({ popId: null });
    }, 400);
  },

  toggleHabitToday: async (id) => {
    await get().toggleHabitDate(id, today());
  },

  openCreate: (type, defaultDue) => {
    set({
      sheet: {
        type,
        id: '',
        n: '',
        p: 1,
        d: defaultDue,
        tag: '',
        i: 'bolt',
        c: HABIT_COLORS[0],
        days: [0, 1, 2, 3, 4, 5, 6],
        reminder: null,
      },
    });
  },

  openEditTask: (id) => {
    const it = get().tasks.find((x) => x.id === id);
    if (!it) return;
    set({
      sheet: {
        type: 't',
        id,
        n: it.title,
        p: it.priority,
        d: it.due ?? '',
        tag: it.tag,
        i: 'bolt',
        c: HABIT_COLORS[0],
        days: [0, 1, 2, 3, 4, 5, 6],
        reminder: it.reminder ?? null,
      },
    });
  },

  openEditHabit: (id) => {
    const it = get().habits.find((x) => x.id === id);
    if (!it) return;
    set({
      sheet: {
        type: 'h',
        id,
        n: it.name,
        p: 1,
        d: '',
        tag: '',
        i: it.icon,
        c: it.color,
        days: [...it.days],
        reminder: it.reminder ?? null,
      },
    });
  },

  patchSheet: (patch) => {
    const sh = get().sheet;
    if (!sh) return;
    set({ sheet: { ...sh, ...patch } });
  },

  closeSheet: () => set({ sheet: null }),

  saveSheet: async () => {
    const sh = get().sheet;
    if (!sh) return false;
    const n = sh.n.trim();
    if (!n) return false;
    const reminder = sh.reminder ? sh.reminder.trim() : null;
    if (sh.type === 't') {
      const tag = sh.tag.trim().replace(/^#/, '');
      const due = sh.d || null;
      if (sh.id) {
        const prev = get().tasks.find((x) => x.id === sh.id);
        if (!prev) return false;
        const next: Task = { ...prev, title: n, priority: sh.p, due, tag, reminder };
        await repo.updateTask(next);
        if (next.due && next.reminder && !next.done) {
          void scheduleTaskReminder(next.id, next.title, next.due, next.reminder);
        } else {
          void cancelReminder(`task-${next.id}`);
        }
        set({ tasks: get().tasks.map((x) => (x.id === next.id ? next : x)), sheet: null });
      } else {
        const next: Task = {
          id: newId(),
          title: n,
          priority: sh.p,
          due,
          tag,
          done: false,
          doneAt: null,
          createdAt: nowStamp(),
          reminder,
        };
        await repo.insertTask(next);
        if (next.due && next.reminder) {
          void scheduleTaskReminder(next.id, next.title, next.due, next.reminder);
        }
        set({ tasks: [...get().tasks, next], sheet: null });
      }
    } else {
      const days = sh.days.length ? sh.days : [0, 1, 2, 3, 4, 5, 6];
      if (sh.id) {
        const prev = get().habits.find((x) => x.id === sh.id);
        if (!prev) return false;
        const next: Habit = { ...prev, name: n, icon: sh.i, color: sh.c, days, reminder };
        await repo.updateHabit(next);
        if (next.reminder) {
          void scheduleHabitReminder(next.id, next.name, next.days, next.reminder);
        } else {
          void cancelHabitReminders(next.id);
        }
        set({ habits: get().habits.map((x) => (x.id === next.id ? next : x)), sheet: null });
      } else {
        const next: Habit = {
          id: newId(),
          name: n,
          icon: sh.i,
          color: sh.c,
          days,
          createdAt: nowStamp(),
          reminder,
        };
        await repo.insertHabit(next);
        if (next.reminder) {
          void scheduleHabitReminder(next.id, next.name, next.days, next.reminder);
        }
        set({ habits: [...get().habits, next], sheet: null });
      }
    }
    return true;
  },

  deleteSheet: async () => {
    const sh = get().sheet;
    if (!sh?.id) return;
    if (sh.type === 't') {
      void cancelReminder(`task-${sh.id}`);
      await repo.deleteTask(sh.id);
      set({ tasks: get().tasks.filter((x) => x.id !== sh.id), sheet: null });
    } else {
      void cancelHabitReminders(sh.id);
      await repo.deleteHabit(sh.id);
      const logs = { ...get().logs };
      delete logs[sh.id];
      set({
        habits: get().habits.filter((x) => x.id !== sh.id),
        logs,
        sheet: null,
      });
    }
  },

  backup: async () => {
    await repo.shareBackup();
  },

  restore: async () => {
    const ok = await repo.pickAndRestore();
    if (ok) await get().hydrate();
    return ok;
  },
}));
