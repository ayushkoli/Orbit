const pad = (n: number): string => String(n).padStart(2, '0');

/** Local calendar date as `YYYY-MM-DD` (never UTC ISO). */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(now = new Date()): string {
  return toDateKey(now);
}

export function parseLocalDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseLocalDate(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

/** JS weekday: 0 = Sunday … 6 = Saturday. */
export function weekday(key: string): number {
  return parseLocalDate(key).getDay();
}

/** Days from Monday (0) to this date's weekday. */
export function mondayOffset(key: string): number {
  return (weekday(key) + 6) % 7;
}

export function weekKeys(selected: string): string[] {
  const off = mondayOffset(selected);
  return Array.from({ length: 7 }, (_, i) => addDays(selected, i - off));
}

export function greeting(name?: string, now = new Date()): string {
  const h = now.getHours();
  const base = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const trimmed = name?.trim();
  return trimmed ? `${base}, ${trimmed}` : base;
}

export function formatHeading(key: string): { weekday: string; rest: string } {
  const d = parseLocalDate(key);
  return {
    weekday: d.toLocaleDateString('en-IN', { weekday: 'long' }),
    rest: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }),
  };
}

export function formatDueLabel(due: string | null, todayKey = today()): string {
  if (!due) return '';
  if (due === todayKey) return 'Today';
  if (due === addDays(todayKey, 1)) return 'Tomorrow';
  if (due === addDays(todayKey, -1)) return 'Yesterday';
  return parseLocalDate(due).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatShortDate(key: string): string {
  return parseLocalDate(key).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function monthMatrix(monthKey: string): (string | null)[][] {
  const first = `${monthKey.slice(0, 7)}-01`;
  const start = parseLocalDate(first);
  const year = start.getFullYear();
  const month = start.getMonth();
  const lead = (start.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toDateKey(new Date(year, month, i + 1)),
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function shiftMonth(monthKey: string, delta: number): string {
  const d = parseLocalDate(`${monthKey.slice(0, 7)}-01`);
  d.setMonth(d.getMonth() + delta);
  return toDateKey(d);
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function nowStamp(now = new Date()): string {
  return `${toDateKey(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
