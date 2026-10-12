import { describe, expect, it } from '@jest/globals';

import { filterTasks, tasksForDay, completionTotals } from '@/lib/stats';

const TD = '2026-10-12';

const tasks = [
  { id: 'a', due: TD, done: false, doneAt: null, priority: 2 },
  { id: 'b', due: null, done: false, doneAt: null, priority: 1 },
  { id: 'c', due: '2026-10-10', done: false, doneAt: null, priority: 0 },
  { id: 'd', due: '2026-10-20', done: false, doneAt: null, priority: 2 },
  { id: 'e', due: TD, done: true, doneAt: TD, priority: 1 },
  { id: 'f', due: '2026-10-11', done: true, doneAt: '2026-10-11', priority: 1 },
];

describe('tasksForDay', () => {
  it('shows due today, rolled-over open, and completed today', () => {
    const list = tasksForDay(tasks, TD, TD).map((t) => t.id);
    expect(list).toEqual(['a', 'b', 'c', 'e']);
  });

  it('sorts open first then higher priority', () => {
    const list = tasksForDay(tasks, TD, TD);
    expect(list.map((t) => t.id)).toEqual(['a', 'b', 'c', 'e']);
    expect(list[0].priority).toBe(2);
    expect(list[list.length - 1].done).toBe(true);
  });

  it('on another day only shows due that day or completed that day', () => {
    const list = tasksForDay(tasks, '2026-10-11', TD).map((t) => t.id);
    expect(list).toEqual(['f']);
  });
});

describe('filterTasks', () => {
  it('filters All open / Today / Upcoming / Done', () => {
    expect(filterTasks(tasks, 'open', TD).map((t) => t.id)).toEqual([
      'c',
      'a',
      'd',
      'b',
    ]);
    expect(filterTasks(tasks, 'today', TD).map((t) => t.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
    expect(filterTasks(tasks, 'up', TD).map((t) => t.id)).toEqual(['d']);
    expect(filterTasks(tasks, 'done', TD).map((t) => t.id)).toEqual(['f', 'e']);
  });
});

describe('completionTotals', () => {
  it('averages combined habit completion over the range', () => {
    const habits = [
      {
        id: 'h1',
        days: [1],
        log: { '2026-10-12': 1 as const, '2026-10-05': 1 as const },
      },
      {
        id: 'h2',
        days: [1],
        log: { '2026-10-12': 1 as const },
      },
    ];
    const t = completionTotals(habits, 1, TD);
    expect(t.due).toBe(2);
    expect(t.done).toBe(2);
    expect(t.averagePct).toBe(100);
  });
});
