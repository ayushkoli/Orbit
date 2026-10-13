/**
 * Lightweight data layer for the widget task handler.
 * Reads directly from the same SQLite database the main app uses.
 * Since the widget task handler runs in a headless JS context that
 * still has access to native modules, expo-sqlite works here.
 */
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { WidgetData } from '@/widget/OrbitWidget';

/* ──────────── date helpers (no imports from app code to stay light) ──────────── */
const pad = (n: number) => String(n).padStart(2, '0');

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return todayKey(date);
}

function weekday(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/* ──────────── db access ──────────── */
let _db: SQLiteDatabase | null = null;

async function db(): Promise<SQLiteDatabase> {
  if (!_db) {
    _db = await openDatabaseAsync('orbit.db');
  }
  return _db;
}

/* ──────────── types matching the DB schema ──────────── */
type HabitRow = {
  id: string;
  name: string;
  color: string;
  days: string;
};

type TaskRow = {
  id: string;
  title: string;
  priority: number;
  done: number;
  due: string | null;
  done_at: string | null;
};

type LogRow = {
  habit_id: string;
  date: string;
};

/* ──────────── streak calculation ──────────── */
function computeStreak(
  days: number[],
  logs: Set<string>,
  td: string,
): number {
  let s = 0;
  for (let i = 0; i < 400; i++) {
    const k = addDays(td, -i);
    if (!days.includes(weekday(k))) continue;
    if (logs.has(k)) s += 1;
    else if (i > 0) break;
  }
  return s;
}

/* ──────────── main data getter ──────────── */
export async function getWidgetData(): Promise<WidgetData> {
  const d = await db();
  const td = todayKey();
  const dow = weekday(td);

  // Habits scheduled for today
  const allHabits = await d.getAllAsync<HabitRow>(
    'SELECT id, name, color, days FROM habits ORDER BY created_at ASC',
  );

  const todayHabits = allHabits.filter((h) => {
    try {
      const parsed = JSON.parse(h.days) as number[];
      return Array.isArray(parsed) && parsed.includes(dow);
    } catch {
      return true; // default to every day
    }
  });

  // Get all logs for computing streaks + today status
  const allLogs = await d.getAllAsync<LogRow>('SELECT habit_id, date FROM habit_logs');
  const logsByHabit: Record<string, Set<string>> = {};
  for (const l of allLogs) {
    if (!logsByHabit[l.habit_id]) logsByHabit[l.habit_id] = new Set();
    logsByHabit[l.habit_id].add(l.date);
  }

  const habits = todayHabits.map((h) => {
    const hLogs = logsByHabit[h.id] ?? new Set<string>();
    let days: number[];
    try {
      days = JSON.parse(h.days) as number[];
    } catch {
      days = [0, 1, 2, 3, 4, 5, 6];
    }
    return {
      id: h.id,
      name: h.name,
      color: h.color,
      done: hLogs.has(td),
      streak: computeStreak(days, hLogs, td),
    };
  });

  // Tasks due today (or overdue & not done, or completed today)
  const allTasks = await d.getAllAsync<TaskRow>(
    'SELECT id, title, priority, done, due, done_at FROM tasks ORDER BY created_at ASC',
  );

  const todayTasks = allTasks
    .filter(
      (t) =>
        t.due === td ||
        (!t.done && (!t.due || t.due < td)) ||
        (t.done && t.done_at === td),
    )
    .sort((a, b) => Number(a.done) - Number(b.done) || b.priority - a.priority)
    .slice(0, 8); // limit widget items

  const tasks = todayTasks.map((t) => ({
    id: t.id,
    title: t.title,
    done: !!t.done,
    priority: t.priority,
  }));

  return { habits, tasks };
}

/* ──────────── toggle handlers ──────────── */
export async function toggleHabitForWidget(habitId: string): Promise<void> {
  const d = await db();
  const td = todayKey();
  const existing = await d.getFirstAsync<{ habit_id: string }>(
    'SELECT habit_id FROM habit_logs WHERE habit_id = ? AND date = ?',
    [habitId, td],
  );
  if (existing) {
    await d.runAsync('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?', [
      habitId,
      td,
    ]);
  } else {
    await d.runAsync(
      'INSERT OR IGNORE INTO habit_logs (habit_id, date) VALUES (?, ?)',
      [habitId, td],
    );
  }
}

export async function toggleTaskForWidget(taskId: string): Promise<void> {
  const d = await db();
  const td = todayKey();
  const task = await d.getFirstAsync<{ done: number }>(
    'SELECT done FROM tasks WHERE id = ?',
    [taskId],
  );
  if (!task) return;
  const newDone = task.done ? 0 : 1;
  const doneAt = newDone ? td : null;
  await d.runAsync('UPDATE tasks SET done = ?, done_at = ? WHERE id = ?', [
    newDone,
    doneAt,
    taskId,
  ]);
}
