import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { getDb } from '@/db/client';
import { newId, nowStamp, today } from '@/lib/date';
import type { HabitIconName } from '@/components/Icon';
import type { ThemeMode } from '@/lib/theme';

export type Task = {
  id: string;
  title: string;
  priority: 0 | 1 | 2;
  due: string | null;
  tag: string;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
  reminder?: string | null;
};

export type Habit = {
  id: string;
  name: string;
  icon: HabitIconName;
  color: string;
  days: number[];
  createdAt: string;
  reminder?: string | null;
};

export type HabitLog = { habitId: string; date: string };

export type Snapshot = {
  tasks: Task[];
  habits: Habit[];
  logs: HabitLog[];
  theme: ThemeMode;
  userName?: string;
};

type TaskRow = {
  id: string;
  title: string;
  priority: number;
  due: string | null;
  tag: string;
  done: number;
  done_at: string | null;
  created_at: string;
  reminder?: string | null;
};

type HabitRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  days: string;
  created_at: string;
  reminder?: string | null;
};

type LogRow = { habit_id: string; date: string };

const COL = [
  '#ff7a45',
  '#ff5c93',
  '#5cc8ff',
  '#ffb938',
  '#8f9bff',
  '#3ddc97',
] as const;

const ICONS: HabitIconName[] = [
  'drop',
  'dumb',
  'code',
  'book',
  'moon',
  'bolt',
  'heart',
  'leaf',
  'cup',
  'pen',
  'sun',
  'music',
];

function asPriority(n: number): 0 | 1 | 2 {
  if (n <= 0) return 0;
  if (n >= 2) return 2;
  return 1;
}

function asIcon(n: string): HabitIconName {
  return (ICONS as string[]).includes(n) ? (n as HabitIconName) : 'bolt';
}

function guessIcon(name: string): HabitIconName {
  if (/water/i.test(name)) return 'drop';
  if (/gym|workout|lift/i.test(name)) return 'dumb';
  if (/code|dev/i.test(name)) return 'code';
  if (/read|book/i.test(name)) return 'book';
  if (/sleep/i.test(name)) return 'moon';
  return 'bolt';
}

function mapTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    priority: asPriority(r.priority),
    due: r.due,
    tag: r.tag ?? '',
    done: !!r.done,
    doneAt: r.done_at,
    createdAt: r.created_at,
    reminder: r.reminder ?? null,
  };
}

function mapHabit(r: HabitRow): Habit {
  let days: number[] = [];
  try {
    const parsed = JSON.parse(r.days) as unknown;
    if (Array.isArray(parsed)) {
      days = parsed.filter((d): d is number => typeof d === 'number');
    }
  } catch {
    days = [0, 1, 2, 3, 4, 5, 6];
  }
  return {
    id: r.id,
    name: r.name,
    icon: r.icon ? asIcon(r.icon) : guessIcon(r.name),
    color: r.color,
    days,
    createdAt: r.created_at,
    reminder: r.reminder ?? null,
  };
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

export async function seedIfNeeded(): Promise<void> {
  const seeded = await getMeta('seeded');
  if (seeded === '1') return;
  const db = await getDb();
  const t = today();
  const created = nowStamp();
  await db.withTransactionAsync(async () => {
    const h1 = newId();
    const h2 = newId();
    const h3 = newId();
    await db.runAsync(
      'INSERT INTO habits (id, name, icon, color, days, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [h1, 'Drink 3L water', 'drop', COL[2], JSON.stringify([0, 1, 2, 3, 4, 5, 6]), created],
    );
    await db.runAsync(
      'INSERT INTO habits (id, name, icon, color, days, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [h2, 'Gym', 'dumb', COL[0], JSON.stringify([1, 2, 3, 4, 5, 6]), created],
    );
    await db.runAsync(
      'INSERT INTO habits (id, name, icon, color, days, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [h3, 'Code 1 hour', 'code', COL[4], JSON.stringify([0, 1, 2, 3, 4, 5, 6]), created],
    );
    await db.runAsync(
      'INSERT INTO tasks (id, title, priority, due, tag, done, done_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newId(), 'Tap me to edit, + to add', 1, t, 'welcome', 0, null, created],
    );
    await db.runAsync(
      'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ['seeded', '1'],
    );
  });
}

export async function loadAll(): Promise<Snapshot> {
  await seedIfNeeded();
  const db = await getDb();
  const taskRows = await db.getAllAsync<TaskRow>(
    'SELECT * FROM tasks ORDER BY created_at ASC',
  );
  const habitRows = await db.getAllAsync<HabitRow>(
    'SELECT * FROM habits ORDER BY created_at ASC',
  );
  const logRows = await db.getAllAsync<LogRow>('SELECT * FROM habit_logs');
  const rawTheme = await getMeta('theme');
  const rawName = await getMeta('userName');
  const validPresets = [
    'system',
    'light',
    'dark',
    'dark-orbit',
    'dark-oled',
    'dark-aurora',
    'light-orbit',
    'light-minimal',
    'light-sand',
  ];
  const theme = (validPresets.includes(rawTheme ?? '') ? rawTheme : 'dark-orbit') as ThemeMode;
  return {
    tasks: taskRows.map(mapTask),
    habits: habitRows.map(mapHabit),
    logs: logRows.map((r) => ({ habitId: r.habit_id, date: r.date })),
    theme,
    userName: rawName ?? '',
  };
}

export async function insertTask(task: Task): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO tasks (id, title, priority, due, tag, done, done_at, created_at, reminder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      task.id,
      task.title,
      task.priority,
      task.due,
      task.tag,
      task.done ? 1 : 0,
      task.doneAt,
      task.createdAt,
      task.reminder ?? null,
    ],
  );
}

export async function updateTask(task: Task): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE tasks SET title = ?, priority = ?, due = ?, tag = ?, done = ?, done_at = ?, reminder = ? WHERE id = ?',
    [
      task.title,
      task.priority,
      task.due,
      task.tag,
      task.done ? 1 : 0,
      task.doneAt,
      task.reminder ?? null,
      task.id,
    ],
  );
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
}

export async function insertHabit(habit: Habit): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO habits (id, name, icon, color, days, created_at, reminder) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      habit.id,
      habit.name,
      habit.icon,
      habit.color,
      JSON.stringify(habit.days),
      habit.createdAt,
      habit.reminder ?? null,
    ],
  );
}

export async function updateHabit(habit: Habit): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE habits SET name = ?, icon = ?, color = ?, days = ?, reminder = ? WHERE id = ?',
    [habit.name, habit.icon, habit.color, JSON.stringify(habit.days), habit.reminder ?? null, habit.id],
  );
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
}

export async function addLog(habitId: string, date: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR IGNORE INTO habit_logs (habit_id, date) VALUES (?, ?)',
    [habitId, date],
  );
}

export async function removeLog(habitId: string, date: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?', [
    habitId,
    date,
  ]);
}

export type TableBackup = {
  version: 1;
  tasks: TaskRow[];
  habits: HabitRow[];
  habit_logs: LogRow[];
  meta?: { key: string; value: string }[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function parseTableBackup(raw: unknown): TableBackup | null {
  if (!isRecord(raw)) return null;
  if (!Array.isArray(raw.tasks) || !Array.isArray(raw.habits)) return null;
  const tasks: TaskRow[] = [];
  for (const t of raw.tasks) {
    if (!isRecord(t) || typeof t.id !== 'string') return null;
    if ('title' in t || 't' in t) {
      const title = String(t.title ?? t.t ?? '');
      const dueRaw = t.due ?? t.d ?? null;
      const doneAtRaw = t.done_at ?? t.at ?? null;
      tasks.push({
        id: t.id,
        title,
        priority: Number(t.priority ?? t.p ?? 1),
        due: dueRaw ? String(dueRaw) : null,
        tag: String(t.tag ?? ''),
        done: Number(t.done ? 1 : 0),
        done_at: doneAtRaw ? String(doneAtRaw) : null,
        created_at: String(t.created_at ?? nowStamp()),
      });
    } else return null;
  }
  const habits: HabitRow[] = [];
  const extraLogs: LogRow[] = [];
  for (const h of raw.habits) {
    if (!isRecord(h) || typeof h.id !== 'string') return null;
    const name = String(h.name ?? h.n ?? '');
    if (!name) return null;
    let days = h.days;
    if (typeof days === 'string') {
      try {
        days = JSON.parse(days);
      } catch {
        days = [0, 1, 2, 3, 4, 5, 6];
      }
    }
    if (!Array.isArray(days)) days = [0, 1, 2, 3, 4, 5, 6];
    habits.push({
      id: h.id,
      name,
      icon: String(h.icon ?? h.i ?? guessIcon(name)),
      color: String(h.color ?? h.c ?? COL[0]),
      days: JSON.stringify(days),
      created_at: String(h.created_at ?? nowStamp()),
    });
    if (isRecord(h.log)) {
      for (const date of Object.keys(h.log)) {
        if (h.log[date]) extraLogs.push({ habit_id: h.id, date });
      }
    }
  }
  const habit_logs: LogRow[] = [...extraLogs];
  if (Array.isArray(raw.habit_logs)) {
    for (const l of raw.habit_logs) {
      if (!isRecord(l)) continue;
      const habit_id = String(l.habit_id ?? l.habitId ?? '');
      const date = String(l.date ?? '');
      if (habit_id && date) habit_logs.push({ habit_id, date });
    }
  }
  const meta: { key: string; value: string }[] = [];
  if (Array.isArray(raw.meta)) {
    for (const m of raw.meta) {
      if (isRecord(m) && typeof m.key === 'string' && typeof m.value === 'string') {
        meta.push({ key: m.key, value: m.value });
      }
    }
  }
  return { version: 1, tasks, habits, habit_logs, meta };
}

export async function exportBackup(): Promise<TableBackup> {
  const db = await getDb();
  const tasks = await db.getAllAsync<TaskRow>('SELECT * FROM tasks');
  const habits = await db.getAllAsync<HabitRow>('SELECT * FROM habits');
  const habit_logs = await db.getAllAsync<LogRow>('SELECT * FROM habit_logs');
  const meta = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT * FROM meta',
  );
  return { version: 1, tasks, habits, habit_logs, meta };
}

export async function shareBackup(): Promise<void> {
  const data = await exportBackup();
  const name = `orbit-backup-${today()}.json`;
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data, null, 2));
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Backup Orbit',
    UTI: 'public.json',
  });
}

export async function restoreFromObject(raw: unknown): Promise<void> {
  const parsed = parseTableBackup(raw);
  if (!parsed) {
    throw new Error('That is not a valid Orbit backup.');
  }
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM habit_logs; DELETE FROM tasks; DELETE FROM habits;');
    for (const h of parsed.habits) {
      await db.runAsync(
        'INSERT INTO habits (id, name, icon, color, days, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [h.id, h.name, h.icon, h.color, h.days, h.created_at],
      );
    }
    for (const t of parsed.tasks) {
      await db.runAsync(
        'INSERT INTO tasks (id, title, priority, due, tag, done, done_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          t.id,
          t.title,
          t.priority,
          t.due,
          t.tag,
          t.done,
          t.done_at,
          t.created_at,
        ],
      );
    }
    for (const l of parsed.habit_logs) {
      await db.runAsync(
        'INSERT OR IGNORE INTO habit_logs (habit_id, date) VALUES (?, ?)',
        [l.habit_id, l.date],
      );
    }
    if (parsed.meta) {
      for (const m of parsed.meta) {
        await db.runAsync(
          'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
          [m.key, m.value],
        );
      }
    }
    await db.runAsync(
      'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ['seeded', '1'],
    );
  });
}

export async function pickAndRestore(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return false;
  const uri = result.assets[0]?.uri;
  if (!uri) throw new Error('Could not read that file.');
  const file = new File(uri);
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That is not valid backup text.');
  }
  await restoreFromObject(raw);
  return true;
}
