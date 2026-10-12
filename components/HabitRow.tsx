import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { TickBox } from '@/components/TaskRow';
import type { Habit } from '@/db/repo';
import { lightHaptic, successHaptic } from '@/lib/haptics';
import { currentStreak } from '@/lib/streak';
import { FONT, mixHex, useTheme, withAlpha } from '@/lib/theme';

type HabitRowProps = {
  habit: Habit;
  log: Record<string, true>;
  selected: string;
  todayKey: string;
  pop?: boolean;
  onToggle: () => void;
  onEdit: () => void;
};

export function HabitRow({
  habit,
  log,
  selected,
  todayKey,
  pop,
  onToggle,
  onEdit,
}: HabitRowProps) {
  const { colors } = useTheme();
  // Habits can be logged for today or past days (locked only for future)
  const locked = selected > todayKey;
  const start = mixHex(habit.color, colors.card, 0.91);
  const streak = currentStreak({ days: habit.days, log }, todayKey);

  return (
    <View style={[styles.row, { borderColor: colors.ln, shadowColor: colors.sh }]}>
      <LinearGradient
        colors={[start, colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.tile,
          { backgroundColor: withAlpha(habit.color, 0.17) },
        ]}
      >
        <Icon name={habit.icon} size={22} color={habit.color} />
      </View>
      <Pressable onPress={onEdit} style={styles.g}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.text, fontFamily: FONT.semibold }]}
        >
          {habit.name}
        </Text>
        <View style={styles.fl}>
          <Icon name="flame" size={14} color={colors.a1} />
          <Text style={{ color: colors.muted, fontFamily: FONT.regular, fontSize: 13 }}>
            {`${streak} day streak`}
          </Text>
          {!!habit.reminder && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8 }}>
              <Icon name="bell" size={12} color={colors.a2} />
              <Text style={{ color: colors.muted, fontFamily: FONT.regular, fontSize: 13 }}>
                {habit.reminder}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
      <TickBox
        on={!!log[selected]}
        locked={locked}
        color={habit.color}
        pop={pop}
        onPress={
          locked
            ? undefined
            : () => {
                void successHaptic();
                onToggle();
              }
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    marginBottom: 9,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  },
  tile: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  g: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
  },
  fl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
});
