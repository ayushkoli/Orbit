import { usePathname } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CelebrationBanner } from '@/components/CelebrationBanner';
import { EmptyState } from '@/components/EmptyState';
import { HabitRow } from '@/components/HabitRow';
import { Orb } from '@/components/Orb';
import { ProfileButton } from '@/components/ProfileButton';
import { TaskRow } from '@/components/TaskRow';
import { WeekStrip } from '@/components/WeekStrip';
import { formatHeading, greeting, today, weekKeys } from '@/lib/date';
import { attachLogs, dayOrbStats } from '@/lib/stats';
import { isDue } from '@/lib/streak';
import { FONT, useTheme } from '@/lib/theme';
import { useStore } from '@/store/useStore';

export default function TodayScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const focused = pathname === '/' || pathname.endsWith('index');
  const selected = useStore((s) => s.selectedDate);
  const setSelectedDate = useStore((s) => s.setSelectedDate);
  const habits = useStore((s) => s.habits);
  const tasks = useStore((s) => s.tasks);
  const logs = useStore((s) => s.logs);
  const popId = useStore((s) => s.popId);
  const toggleHabitDate = useStore((s) => s.toggleHabitDate);
  const toggleTask = useStore((s) => s.toggleTask);
  const openEditHabit = useStore((s) => s.openEditHabit);
  const openEditTask = useStore((s) => s.openEditTask);
  const openCreate = useStore((s) => s.openCreate);
  const userName = useStore((s) => s.userName);
  const td = today();
  const heading = formatHeading(selected);
  const withLog = useMemo(() => attachLogs(habits, logs), [habits, logs]);
  const stats = dayOrbStats(withLog, tasks, selected, td);
  const dots = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const k of weekKeys(selected)) {
      const due = habits.filter((h) => isDue(h, k));
      map[k] = due.length > 0 && due.every((h) => logs[h.id]?.[k]);
    }
    return map;
  }, [habits, logs, selected]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        { paddingTop: insets.top + 16, paddingBottom: 130 + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topHeader}>
        <View style={styles.top}>
          <Text style={[styles.kicker, { color: colors.muted, fontFamily: FONT.regular }]}>
            {selected === td ? greeting(userName) : 'Viewing'}
          </Text>
          <Text style={[styles.title, { color: colors.text, fontFamily: FONT.extra }]}>
            {`${heading.weekday},\n${heading.rest}`}
          </Text>
        </View>
        <ProfileButton />
      </View>

      <WeekStrip selected={selected} dots={dots} onSelect={setSelectedDate} />
      <Orb
        overall={stats.overall}
        taskRate={stats.taskRate}
        habitRate={stats.habitRate}
        everything={`${stats.habitsDone + stats.tasksDone}/${stats.total}`}
        tasks={`${stats.tasksDone}/${stats.tasks.length}`}
        habits={`${stats.habitsDone}/${stats.habitsDue.length}`}
        animKey={`${focused ? 'on' : 'off'}-${selected}`}
      />
      {stats.total > 0 && stats.overall === 1 ? (
        <CelebrationBanner
          habitsDone={stats.habitsDone}
          tasksDone={stats.tasksDone}
          total={stats.total}
        />
      ) : null}
      {stats.habitsDue.length ? (
        <>
          <View style={styles.h3}>
            <Text style={[styles.h3t, { color: colors.text, fontFamily: FONT.extra }]}>
              Habits
            </Text>
            <Text style={[styles.h3s, { color: colors.muted, fontFamily: FONT.regular }]}>
              {`${stats.habitsDone} of ${stats.habitsDue.length}`}
            </Text>
          </View>
          {stats.habitsDue.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              log={logs[h.id] ?? {}}
              selected={selected}
              todayKey={td}
              pop={popId === h.id}
              onToggle={() => void toggleHabitDate(h.id, selected)}
              onEdit={() => openEditHabit(h.id)}
            />
          ))}
        </>
      ) : null}
      {stats.tasks.length ? (
        <>
          <View style={styles.h3}>
            <Text style={[styles.h3t, { color: colors.text, fontFamily: FONT.extra }]}>
              Tasks
            </Text>
            <Text style={[styles.h3s, { color: colors.muted, fontFamily: FONT.regular }]}>
              {`${stats.tasksDone} of ${stats.tasks.length}`}
            </Text>
          </View>
          {stats.tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              pop={popId === t.id}
              onToggle={() => void toggleTask(t.id)}
              onEdit={() => openEditTask(t.id)}
            />
          ))}
        </>
      ) : null}
      {!stats.total ? (
        <EmptyState
          icon="orb"
          title="Your orbit is clear"
          description="No habits or tasks scheduled for this day. Take a breather or start something new."
          primaryAction={{
            label: 'Add Task',
            icon: 'plus',
            onPress: () => openCreate('t', selected),
          }}
          secondaryAction={{
            label: 'New Habit',
            icon: 'plus',
            onPress: () => openCreate('h', selected),
          }}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 16,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  top: {
    flex: 1,
  },
  kicker: {
    fontSize: 15,
    marginBottom: 5,
  },
  title: {
    fontSize: 34,
    letterSpacing: -1.2,
    lineHeight: 38,
  },
  h3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 22,
    marginBottom: 10,
    marginHorizontal: 2,
  },
  h3t: {
    fontSize: 17,
  },
  h3s: {
    fontSize: 14,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    fontSize: 15,
    lineHeight: 20,
  },
});
