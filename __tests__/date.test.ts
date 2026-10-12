import { describe, expect, it } from '@jest/globals';

import { addDays, mondayOffset, today, toDateKey, weekday } from '@/lib/date';

describe('date helpers (local YYYY-MM-DD)', () => {
  it('formats a local Date without UTC shift', () => {
    expect(toDateKey(new Date(2026, 9, 12))).toBe('2026-10-12');
    expect(toDateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('walks across month and year boundaries', () => {
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-12', 0)).toBe('2026-10-12');
  });

  it('uses Sunday=0 weekdays and Monday-first offset', () => {
    expect(weekday('2026-10-11')).toBe(0);
    expect(weekday('2026-10-12')).toBe(1);
    expect(mondayOffset('2026-10-12')).toBe(0);
    expect(mondayOffset('2026-10-11')).toBe(6);
  });

  it('today() matches the local calendar date', () => {
    expect(today(new Date(2026, 9, 12, 23, 59, 59))).toBe('2026-10-12');
  });
});
