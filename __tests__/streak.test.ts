import { describe, expect, it } from '@jest/globals';

import { bestStreak, currentStreak, type StreakHabit } from '@/lib/streak';

const TD = '2026-10-12'; // Monday

function habit(days: number[], dates: string[]): StreakHabit {
  const log: Record<string, 1> = {};
  for (const d of dates) log[d] = 1;
  return { days, log };
}

describe('current streak', () => {
  it('does not break when today is scheduled and not yet done', () => {
    const h = habit([1, 2, 3, 4, 5], ['2026-10-08', '2026-10-09']);
    expect(currentStreak(h, TD)).toBe(2);
  });

  it('includes today when it is done', () => {
    const h = habit([1, 2, 3, 4, 5], ['2026-10-08', '2026-10-09', '2026-10-12']);
    expect(currentStreak(h, TD)).toBe(3);
  });

  it('breaks on a missed scheduled day', () => {
    const h = habit([1, 2, 3, 4, 5], ['2026-10-07', '2026-10-12']);
    expect(currentStreak(h, TD)).toBe(1);
  });

  it('skips unscheduled days (weekend for Mon-Fri habit)', () => {
    const h = habit(
      [1, 2, 3, 4, 5],
      ['2026-10-09', '2026-10-08', '2026-10-07'],
    );
    expect(currentStreak(h, TD)).toBe(3);
  });
});

describe('best streak', () => {
  it('finds the longest scheduled run in the last 365 days', () => {
    const h = habit(
      [1, 2, 3, 4, 5],
      [
        '2026-09-28',
        '2026-09-29',
        '2026-09-30',
        '2026-10-01',
        '2026-10-02',
        '2026-10-08',
        '2026-10-09',
      ],
    );
    expect(bestStreak(h, TD)).toBe(5);
  });

  it('does not reset the best run when today is not done yet', () => {
    const h = habit(
      [1, 2, 3, 4, 5],
      ['2026-10-07', '2026-10-08', '2026-10-09'],
    );
    expect(bestStreak(h, TD)).toBe(3);
    expect(currentStreak(h, TD)).toBe(3);
  });
});
