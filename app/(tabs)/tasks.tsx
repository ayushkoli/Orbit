import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ProfileButton } from '@/components/ProfileButton';
import { TaskRow } from '@/components/TaskRow';
import { today } from '@/lib/date';
import { lightHaptic } from '@/lib/haptics';
import { filterTasks, type TaskFilter } from '@/lib/stats';
import { FONT, useTheme } from '@/lib/theme';
import { useStore } from '@/store/useStore';

const FILTERS: { id: TaskFilter; label: string }[] = [
  { id: 'open', label: 'All open' },
  { id: 'today', label: 'Today' },
  { id: 'up', label: 'Upcoming' },
  { id: 'done', label: 'Done' },
];

export default function TasksScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tasks = useStore((s) => s.tasks);
  const flt = useStore((s) => s.taskFilter);
  const setTaskFilter = useStore((s) => s.setTaskFilter);
  const popId = useStore((s) => s.popId);
  const toggleTask = useStore((s) => s.toggleTask);
  const openEditTask = useStore((s) => s.openEditTask);
  const openCreate = useStore((s) => s.openCreate);
  const list = filterTasks(tasks, flt, today());

  const handleFilterPress = (filterId: TaskFilter) => {
    void lightHaptic();
    setTaskFilter(filterId);
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        { paddingTop: insets.top + 16, paddingBottom: 130 + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topHeader}>
        <Text style={[styles.title, { color: colors.text, fontFamily: FONT.extra }]}>
          Tasks
        </Text>
        <ProfileButton />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {FILTERS.map((f) => {
          const on = flt === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => handleFilterPress(f.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? colors.text : colors.card,
                  borderColor: colors.ln,
                },
              ]}
            >
              <Text
                style={{
                  color: on ? colors.bg : colors.text,
                  fontFamily: on ? FONT.extra : FONT.regular,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {list.length ? (
        list.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            pop={popId === t.id}
            onToggle={() => void toggleTask(t.id)}
            onEdit={() => openEditTask(t.id)}
          />
        ))
      ) : (
        <EmptyState
          icon={flt === 'done' ? 'check' : 'task'}
          title={
            flt === 'done'
              ? 'No completed tasks yet'
              : flt === 'today'
                ? 'Nothing due today'
                : flt === 'up'
                  ? 'No upcoming tasks'
                  : 'All clear'
          }
          description={
            flt === 'done'
              ? 'Mark tasks complete as you finish them and they will show up here.'
              : flt === 'today'
                ? 'No tasks scheduled for today. Enjoy your focus time or plan ahead.'
                : flt === 'up'
                  ? 'You don’t have any upcoming tasks lined up.'
                  : 'No open tasks right now. You’re completely up to date!'
          }
          primaryAction={
            flt !== 'done'
              ? {
                  label: 'Add Task',
                  icon: 'plus',
                  onPress: () => openCreate('t', today()),
                }
              : undefined
          }
        />
      )}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    letterSpacing: -1.2,
    lineHeight: 38,
  },
  chips: {
    gap: 6,
    marginBottom: 14,
    paddingBottom: 2,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 99,
    borderWidth: 1,
    marginRight: 6,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    fontSize: 15,
  },
});
