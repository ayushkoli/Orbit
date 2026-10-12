import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { HabitCard } from '@/components/HabitCard';
import { Icon } from '@/components/Icon';
import { ProfileButton } from '@/components/ProfileButton';
import { today } from '@/lib/date';
import { selectionHaptic } from '@/lib/haptics';
import { FONT, useTheme } from '@/lib/theme';
import { useStore } from '@/store/useStore';

export default function HabitsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const habits = useStore((s) => s.habits);
  const logs = useStore((s) => s.logs);
  const popId = useStore((s) => s.popId);
  const toggleHabitDate = useStore((s) => s.toggleHabitDate);
  const toggleHabitToday = useStore((s) => s.toggleHabitToday);
  const openEditHabit = useStore((s) => s.openEditHabit);
  const openCreate = useStore((s) => s.openCreate);

  const [viewMode, setViewMode] = useState<'weekly' | 'heatmap'>('weekly');

  const handleModeChange = (mode: 'weekly' | 'heatmap') => {
    void selectionHaptic();
    setViewMode(mode);
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
          Habits
        </Text>
        <ProfileButton />
      </View>

      {/* Segmented Switcher: Weekly (7 boxes) vs Heatmap */}
      <View style={[styles.segmentWrap, { backgroundColor: colors.c2 }]}>
        <Pressable
          onPress={() => handleModeChange('weekly')}
          style={[
            styles.segmentBtn,
            viewMode === 'weekly' && [
              styles.segmentBtnActive,
              { backgroundColor: colors.card, shadowColor: colors.sh },
            ],
          ]}
        >
          <View style={styles.segmentInner}>
            <Icon
              name="weekly"
              size={15}
              color={viewMode === 'weekly' ? colors.text : colors.muted}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color: viewMode === 'weekly' ? colors.text : colors.muted,
                  fontFamily: viewMode === 'weekly' ? FONT.extra : FONT.semibold,
                },
              ]}
            >
              Weekly
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleModeChange('heatmap')}
          style={[
            styles.segmentBtn,
            viewMode === 'heatmap' && [
              styles.segmentBtnActive,
              { backgroundColor: colors.card, shadowColor: colors.sh },
            ],
          ]}
        >
          <View style={styles.segmentInner}>
            <Icon
              name="grid"
              size={15}
              color={viewMode === 'heatmap' ? colors.text : colors.muted}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color: viewMode === 'heatmap' ? colors.text : colors.muted,
                  fontFamily: viewMode === 'heatmap' ? FONT.extra : FONT.semibold,
                },
              ]}
            >
              Heatmap
            </Text>
          </View>
        </Pressable>
      </View>

      {habits.length ? (
        habits.map((h) => (
          <HabitCard
            key={h.id}
            habit={h}
            log={logs[h.id] ?? {}}
            pop={popId === h.id}
            viewMode={viewMode}
            onToggleDay={(dayKey) => void toggleHabitDate(h.id, dayKey)}
            onToggleToday={() => void toggleHabitToday(h.id)}
            onEdit={() => openEditHabit(h.id)}
          />
        ))
      ) : (
        <EmptyState
          icon="loop"
          title="Build your first habit"
          description="Consistent daily routines build long-term momentum. Start tracking today."
          primaryAction={{
            label: 'New Habit',
            icon: 'plus',
            onPress: () => openCreate('h', today()),
          }}
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
  segmentWrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentText: {
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    fontSize: 15,
  },
});
