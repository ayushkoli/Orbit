import { addDays, mondayOffset, today } from '@/lib/date';
import { bestStreak, isDue, type StreakHabit } from '@/lib/streak';

export type TaskLike = {
  due: string | null;
  done: boolean;
  doneAt: string | null;
  priority: number;
};

export function tasksForDay<T extends TaskLike>(
  tasks: T[],
  day: string,
  todayKey = today(),
): T[] {
  return tasks
    .filter(
      (t) =>
        t.due === day ||
        (day === todayKey && !t.done && (!t.due || t.due < day)) ||
        (t.done && t.doneAt === day),
    )
    .sort((a, b) => Number(a.done) - Number(b.done) || b.priority - a.priority);
}

export type TaskFilter = 'open' | 'today' | 'up' | 'done';

export function filterTasks<T extends TaskLike>(
  tasks: T[],
  flt: TaskFilter,
  todayKey = today(),
): T[] {
  const list = tasks.filter((x) =>
    flt === 'done'
      ? x.done
      : !x.done &&
        (flt === 'open' ||
          (flt === 'today' && (!x.due || x.due <= todayKey)) ||
          (flt === 'up' && !!x.due && x.due > todayKey)),
  );
  return list.sort((a, b) => {
    const ad = a.due || '9';
    const bd = b.due || '9';
    if (ad < bd) return -1;
    if (ad > bd) return 1;
    return b.priority - a.priority;
  });
}

export type HabitLike = StreakHabit & { id: string };

export function attachLogs<T extends { id: string; days: number[] }>(
  habits: T[],
  logs: Record<string, Record<string, true | 1 | boolean | undefined>>,
): (T & StreakHabit)[] {
  return habits.map((h) => ({
    ...h,
    log: logs[h.id] ?? {},
  }));
}

export function dayOrbStats<THabit extends HabitLike, TTask extends TaskLike>(
  habits: THabit[],
  tasks: TTask[],
  day: string,
  todayKey = today(),
): {
  habitsDue: THabit[];
  tasks: TTask[];
  habitsDone: number;
  tasksDone: number;
  total: number;
  overall: number;
  taskRate: number;
  habitRate: number;
} {
  const habitsDue = habits.filter((h) => isDue(h, day));
  const dayTasks = tasksForDay(tasks, day, todayKey);
  const habitsDone = habitsDue.filter((h) => h.log[day]).length;
  const tasksDone = dayTasks.filter((t) => t.done).length;
  const total = habitsDue.length + dayTasks.length;
  return {
    habitsDue,
    tasks: dayTasks,
    habitsDone,
    tasksDone,
    total,
    overall: total ? (habitsDone + tasksDone) / total : 0,
    taskRate: dayTasks.length ? tasksDone / dayTasks.length : 0,
    habitRate: habitsDue.length ? habitsDone / habitsDue.length : 0,
  };
}

export function heatmapRange(todayKey = today()): string[] {
  const off = mondayOffset(todayKey);
  const start = addDays(todayKey, -off - 17 * 7);
  const keys: string[] = [];
  for (let i = 0; i < 126; i++) {
    const k = addDays(start, i);
    if (k > todayKey) break;
    keys.push(k);
  }
  return keys;
}

export type DayPoint = { date: string; rate: number };

export function combinedDailyRates(
  habits: HabitLike[],
  range: number,
  todayKey = today(),
): DayPoint[] {
  const pts: DayPoint[] = [];
  for (let i = 0; i < range; i++) {
    const k = addDays(todayKey, i - range + 1);
    let a = 0;
    let b = 0;
    for (const h of habits) {
      if (!isDue(h, k)) continue;
      b += 1;
      if (h.log[k]) a += 1;
    }
    pts.push({ date: k, rate: b ? a / b : 0 });
  }
  return pts;
}

export function habitRates(
  habits: HabitLike[],
  range: number,
  todayKey = today(),
): Record<string, { done: number; due: number }> {
  const rate: Record<string, { done: number; due: number }> = {};
  for (const h of habits) rate[h.id] = { done: 0, due: 0 };
  for (let i = 0; i < range; i++) {
    const k = addDays(todayKey, i - range + 1);
    for (const h of habits) {
      if (!isDue(h, k)) continue;
      rate[h.id].due += 1;
      if (h.log[k]) rate[h.id].done += 1;
    }
  }
  return rate;
}

export function completionTotals(
  habits: HabitLike[],
  range: number,
  todayKey = today(),
): { done: number; due: number; averagePct: number } {
  let done = 0;
  let due = 0;
  for (let i = 0; i < range; i++) {
    const k = addDays(todayKey, i - range + 1);
    for (const h of habits) {
      if (!isDue(h, k)) continue;
      due += 1;
      if (h.log[k]) done += 1;
    }
  }
  return {
    done,
    due,
    averagePct: due ? Math.round((done / due) * 100) : 0,
  };
}

export function longestStreakAmong(
  habits: HabitLike[],
  todayKey = today(),
): number {
  if (!habits.length) return 0;
  return Math.max(0, ...habits.map((h) => bestStreak(h, todayKey)));
}

export function smoothPath(points: [number, number][]): string {
  if (!points.length) return '';
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i - 1] || points[i];
    const b = points[i];
    const c = points[i + 1];
    const e = points[i + 2] || c;
    d += `C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c[0]},${c[1]}`;
  }
  return d;
}

export function chartLayout(
  rates: DayPoint[],
  width = 340,
  height = 170,
): {
  line: string;
  last: [number, number] | null;
  y: (v: number) => number;
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const L = 30;
  const R = 8;
  const T = 10;
  const B = 24;
  const pts: [number, number][] = rates.map((p, i) => [
    L + (width - L - R) * (rates.length > 1 ? i / (rates.length - 1) : 0),
    T + (height - T - B) * (1 - p.rate),
  ]);
  const y = (v: number) => T + (height - T - B) * (1 - v);
  return {
    line: pts.length > 1 ? smoothPath(pts) : '',
    last: pts.length ? pts[pts.length - 1] : null,
    y,
    left: L,
    right: width - R,
    top: T,
    bottom: B,
  };
}
