import { addDays, today, weekday } from '@/lib/date';

export type StreakHabit = {
  days: number[];
  log: Record<string, boolean | 1 | undefined>;
};

export function isDue(habit: { days: number[] }, dateKey: string): boolean {
  return habit.days.includes(weekday(dateKey));
}

/**
 * Walk back from today over scheduled days only.
 * Today not yet done does not break the streak; a missed scheduled day does.
 */
export function currentStreak(habit: StreakHabit, todayKey = today()): number {
  let s = 0;
  for (let i = 0; i < 400; i++) {
    const k = addDays(todayKey, -i);
    if (!isDue(habit, k)) continue;
    if (habit.log[k]) s += 1;
    else if (i > 0) break;
  }
  return s;
}

/** Longest run of scheduled completions over the last 365 days (plus today). */
export function bestStreak(habit: StreakHabit, todayKey = today()): number {
  let best = 0;
  let run = 0;
  for (let i = 365; i >= 0; i--) {
    const k = addDays(todayKey, -i);
    if (!isDue(habit, k)) continue;
    if (habit.log[k]) {
      run += 1;
      best = Math.max(best, run);
    } else if (i > 0) {
      run = 0;
    }
  }
  return best;
}
