import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Heatmap } from '@/components/Heatmap';
import { Icon } from '@/components/Icon';
import type { Habit } from '@/db/repo';
import { today, weekKeys } from '@/lib/date';
import { lightHaptic, successHaptic } from '@/lib/haptics';
import { bestStreak, currentStreak, isDue } from '@/lib/streak';
import { FONT, mixHex, useTheme, withAlpha } from '@/lib/theme';

const LABELS = 'MTWTFSS';

type HabitCardProps = {
  habit: Habit;
  log: Record<string, true>;
  pop?: boolean;
  viewMode?: 'weekly' | 'heatmap';
  onToggleDay?: (dateKey: string) => void;
  onToggleToday: () => void;
  onEdit: () => void;
};

export function HabitCard({
  habit,
  log,
  pop,
  viewMode = 'weekly',
  onToggleDay,
  onToggleToday,
  onEdit,
}: HabitCardProps) {
  const { colors } = useTheme();
  const t = today();
  const keys = weekKeys(t);
  const start = mixHex(habit.color, colors.card, 0.9);
  const now = currentStreak({ days: habit.days, log }, t);
  const best = bestStreak({ days: habit.days, log }, t);

  const showHeatmap = viewMode === 'heatmap';

  const handleDayPress = (key: string) => {
    void lightHaptic();
    if (onToggleDay) {
      onToggleDay(key);
    } else if (key === t) {
      onToggleToday();
    }
  };

  return (
    <View style={[styles.card, { borderColor: colors.ln, shadowColor: colors.sh }]}>
      <LinearGradient
        colors={[start, colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.hd}>
        <View style={[styles.tile, { backgroundColor: withAlpha(habit.color, 0.17) }]}>
          <Icon name={habit.icon} size={22} color={habit.color} />
        </View>
        <Pressable onPress={onEdit} style={styles.g}>
          <Text
            numberOfLines={1}
            style={[styles.name, { color: colors.text, fontFamily: FONT.semibold }]}
          >
            {habit.name}
          </Text>
          <View style={styles.meta}>
            <View style={styles.fl}>
              <Icon name="flame" size={14} color={colors.a1} />
              <Text style={{ color: colors.muted, fontFamily: FONT.regular, fontSize: 13 }}>
                {`${now} now`}
              </Text>
            </View>
            <Text style={{ color: colors.muted, fontFamily: FONT.regular, fontSize: 13 }}>
              {`best ${best}`}
            </Text>
            {!!habit.reminder && (
              <View style={styles.fl}>
                <Icon name="bell" size={13} color={colors.a2} />
                <Text style={{ color: colors.muted, fontFamily: FONT.regular, fontSize: 13 }}>
                  {habit.reminder}
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            void lightHaptic();
            onEdit();
          }}
          hitSlop={8}
          style={[
            styles.editBtn,
            { backgroundColor: colors.c2, borderColor: colors.ln },
          ]}
        >
          <Icon name="pen" size={13} color={colors.text} />
          <Text
            style={[
              styles.editText,
              { color: colors.text, fontFamily: FONT.semibold },
            ]}
          >
            Edit
          </Text>
        </Pressable>
      </View>

      {/* 7-Box Weekly Row */}
      <View style={styles.wc}>
        {keys.map((k, i) => {
          const dn = !!log[k];
          const future = k > t;
          const due = isDue(habit, k);
          const isToday = k === t;
          const opacity = !due ? 0.3 : future ? 0.45 : 1;
          const inner = (
            <View
              style={[
                styles.cell,
                isToday && styles.cellToday,
                {
                  backgroundColor: dn ? habit.color : colors.c2,
                  opacity,
                },
                isToday && pop && styles.cellPop,
              ]}
            >
              {dn ? (
                <Icon
                  name="check"
                  size={isToday ? 18 : 15}
                  strokeWidth={2.8}
                  color="#ffffff"
                />
              ) : null}
            </View>
          );

          return (
            <View key={k} style={styles.cellWrap}>
              <Text style={{ color: colors.muted, fontFamily: FONT.regular, fontSize: 12 }}>
                {LABELS[i]}
              </Text>
              {!future ? (
                <Pressable
                  onPress={() => handleDayPress(k)}
                  style={isToday ? [styles.todayRing, { borderColor: habit.color }] : styles.dayHit}
                >
                  {inner}
                </Pressable>
              ) : (
                inner
              )}
            </View>
          );
        })}
      </View>

      {/* Optional Heatmap view */}
      {showHeatmap && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <Heatmap color={habit.color} days={habit.days} log={log} todayKey={t} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 3,
  },
  hd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
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
  name: {
    fontSize: 17,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
    alignItems: 'center',
  },
  fl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  editText: {
    fontSize: 12,
  },
  wc: {
    flexDirection: 'row',
    gap: 6,
  },
  cellWrap: {
    flex: 1,
    alignItems: 'center',
  },
  dayHit: {
    width: '100%',
    alignItems: 'center',
  },
  todayRing: {
    marginTop: 5,
    borderWidth: 2,
    borderRadius: 16,
    padding: 2,
    width: '100%',
  },
  cell: {
    height: 40,
    marginTop: 5,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellToday: {
    marginTop: 0,
    height: 36,
  },
  cellPop: {
    transform: [{ scale: 1.08 }],
  },
});
