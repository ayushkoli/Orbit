import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import type { Habit, Task } from '@/db/repo';
import {
  formatShortDate,
  monthMatrix,
  parseLocalDate,
  shiftMonth,
  today,
} from '@/lib/date';
import { lightHaptic, selectionHaptic } from '@/lib/haptics';
import { attachLogs, dayOrbStats } from '@/lib/stats';
import { FONT, mixHex, useTheme, withAlpha } from '@/lib/theme';
import { useStore } from '@/store/useStore';

type StatsCalendarProps = {
  habits: Habit[];
  tasks: Task[];
  logs: Record<string, Record<string, true>>;
};

export function StatsCalendar({ habits, tasks, logs }: StatsCalendarProps) {
  const { colors, scheme } = useTheme();
  const td = today();
  const [currentMonth, setCurrentMonth] = useState(td.slice(0, 7) + '-01');
  const [selectedDay, setSelectedDay] = useState<string>(td);
  const toggleHabitDate = useStore((s) => s.toggleHabitDate);
  const toggleTask = useStore((s) => s.toggleTask);

  const withLog = useMemo(() => attachLogs(habits, logs), [habits, logs]);

  const monthRows = useMemo(() => monthMatrix(currentMonth), [currentMonth]);

  const monthDate = parseLocalDate(currentMonth);
  const monthTitle = monthDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate day stats for all days in this month
  const dayStatsMap = useMemo(() => {
    const map: Record<
      string,
      {
        total: number;
        habitsDone: number;
        habitsDue: number;
        tasksDone: number;
        tasksTotal: number;
        rate: number;
      }
    > = {};

    for (const row of monthRows) {
      for (const k of row) {
        if (!k) continue;
        const st = dayOrbStats(withLog, tasks, k, td);
        map[k] = {
          total: st.total,
          habitsDone: st.habitsDone,
          habitsDue: st.habitsDue.length,
          tasksDone: st.tasksDone,
          tasksTotal: st.tasks.length,
          rate: st.overall,
        };
      }
    }
    return map;
  }, [withLog, tasks, monthRows, td]);

  // Monthly summary
  const monthSummary = useMemo(() => {
    let perfectDays = 0;
    let activeDays = 0;
    let sumRate = 0;
    for (const k of Object.keys(dayStatsMap)) {
      if (k > td) continue; // don't count future
      const s = dayStatsMap[k];
      if (s.total > 0) {
        activeDays++;
        sumRate += s.rate;
        if (s.rate === 1) perfectDays++;
      }
    }
    const avg = activeDays > 0 ? Math.round((sumRate / activeDays) * 100) : 0;
    return { perfectDays, avg, activeDays };
  }, [dayStatsMap, td]);

  // Selected day details
  const selectedDetails = useMemo(() => {
    if (!selectedDay) return null;
    return dayOrbStats(withLog, tasks, selectedDay, td);
  }, [withLog, tasks, selectedDay, td]);

  const handlePrevMonth = () => {
    void lightHaptic();
    setCurrentMonth((m) => shiftMonth(m, -1));
  };

  const handleNextMonth = () => {
    void lightHaptic();
    setCurrentMonth((m) => shiftMonth(m, 1));
  };

  const handleTodayMonth = () => {
    void lightHaptic();
    setCurrentMonth(td.slice(0, 7) + '-01');
    setSelectedDay(td);
  };

  const handleSelectDay = (key: string) => {
    void selectionHaptic();
    setSelectedDay(key);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.ln,
          shadowColor: colors.sh,
        },
      ]}
    >
      {/* Month Header */}
      <View style={styles.header}>
        <View style={styles.monthTitleWrap}>
          <Text style={[styles.monthTitle, { color: colors.text, fontFamily: FONT.extra }]}>
            {monthTitle}
          </Text>
          <Pressable
            onPress={handleTodayMonth}
            style={[styles.todayChip, { backgroundColor: colors.c2 }]}
          >
            <Text style={[styles.todayChipText, { color: colors.muted, fontFamily: FONT.semibold }]}>
              Current
            </Text>
          </Pressable>
        </View>

        <View style={styles.navRow}>
          <Pressable
            onPress={handlePrevMonth}
            hitSlop={8}
            style={[styles.navBtn, { backgroundColor: colors.c2 }]}
          >
            <Text style={{ color: colors.text, fontSize: 18, lineHeight: 20 }}>‹</Text>
          </Pressable>
          <Pressable
            onPress={handleNextMonth}
            hitSlop={8}
            style={[styles.navBtn, { backgroundColor: colors.c2 }]}
          >
            <Text style={{ color: colors.text, fontSize: 18, lineHeight: 20 }}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Monthly Summary Badges */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: colors.c2 }]}>
          <Text style={[styles.badgeVal, { color: colors.a1, fontFamily: FONT.extra }]}>
            {`${monthSummary.avg}%`}
          </Text>
          <Text style={[styles.badgeLabel, { color: colors.muted, fontFamily: FONT.regular }]}>
            Month Avg
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.c2 }]}>
          <Text style={[styles.badgeVal, { color: colors.a3, fontFamily: FONT.extra }]}>
            {`${monthSummary.perfectDays}`}
          </Text>
          <Text style={[styles.badgeLabel, { color: colors.muted, fontFamily: FONT.regular }]}>
            100% Days
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.c2 }]}>
          <Text style={[styles.badgeVal, { color: colors.a2, fontFamily: FONT.extra }]}>
            {`${monthSummary.activeDays}`}
          </Text>
          <Text style={[styles.badgeLabel, { color: colors.muted, fontFamily: FONT.regular }]}>
            Logged Days
          </Text>
        </View>
      </View>

      {/* Weekday Labels */}
      <View style={styles.weekLabels}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((wd, i) => (
          <Text
            key={i}
            style={[styles.weekLabel, { color: colors.muted, fontFamily: FONT.semibold }]}
          >
            {wd}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {monthRows.map((row, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.gridRow}>
            {row.map((dayKey, cIdx) => {
              if (!dayKey) {
                return <View key={`empty-${rIdx}-${cIdx}`} style={styles.cell} />;
              }

              const isSelected = dayKey === selectedDay;
              const isToday = dayKey === td;
              const isFuture = dayKey > td;
              const stats = dayStatsMap[dayKey];
              const rate = stats?.rate ?? 0;
              const hasItems = (stats?.total ?? 0) > 0;
              const dayNum = parseLocalDate(dayKey).getDate();

              let cellBg = 'transparent';
              let textColor = isFuture ? colors.muted : colors.text;

              if (hasItems && !isFuture) {
                if (rate === 1) {
                  cellBg = colors.a3;
                  textColor = '#ffffff';
                } else if (rate >= 0.5) {
                  cellBg = withAlpha(colors.a1, 0.25);
                  textColor = colors.text;
                } else if (rate > 0) {
                  cellBg = withAlpha(colors.a2, 0.18);
                  textColor = colors.text;
                }
              }

              return (
                <Pressable
                  key={dayKey}
                  onPress={() => handleSelectDay(dayKey)}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: cellBg,
                      borderColor: isSelected
                        ? colors.text
                        : isToday
                        ? colors.a1
                        : 'transparent',
                      borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: textColor,
                        fontFamily: isSelected || isToday ? FONT.extra : FONT.semibold,
                      },
                    ]}
                  >
                    {dayNum}
                  </Text>
                  {hasItems && !isFuture && rate === 1 && (
                    <View style={[styles.dotIndicator, { backgroundColor: '#ffffff' }]} />
                  )}
                  {hasItems && !isFuture && rate > 0 && rate < 1 && (
                    <View style={[styles.dotIndicator, { backgroundColor: colors.a1 }]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Selected Day Inspector */}
      {selectedDetails && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.inspector,
            {
              backgroundColor: colors.c2,
              borderColor: colors.ln,
            },
          ]}
        >
          <View style={styles.inspectorHead}>
            <View>
              <Text style={[styles.inspectorDate, { color: colors.text, fontFamily: FONT.extra }]}>
                {selectedDay === td ? `Today (${formatShortDate(selectedDay)})` : formatShortDate(selectedDay)}
              </Text>
              <Text style={{ color: colors.muted, fontFamily: FONT.regular, fontSize: 13 }}>
                {selectedDetails.total === 0
                  ? 'No habits or tasks on this day'
                  : `${selectedDetails.habitsDone}/${selectedDetails.habitsDue.length} habits • ${selectedDetails.tasksDone}/${selectedDetails.tasks.length} tasks`}
              </Text>
            </View>
            <View
              style={[
                styles.ratePill,
                {
                  backgroundColor:
                    selectedDetails.overall === 1
                      ? colors.a3
                      : selectedDetails.overall > 0
                      ? colors.a1
                      : colors.card,
                },
              ]}
            >
              <Text
                style={{
                  color: selectedDetails.overall > 0 ? '#ffffff' : colors.muted,
                  fontFamily: FONT.extra,
                  fontSize: 13,
                }}
              >
                {`${Math.round(selectedDetails.overall * 100)}%`}
              </Text>
            </View>
          </View>

          {/* Habit breakdown for selected day */}
          {selectedDetails.habitsDue.length > 0 && (
            <View style={styles.itemSection}>
              {selectedDetails.habitsDue.map((h) => {
                const done = !!logs[h.id]?.[selectedDay];
                return (
                  <Pressable
                    key={h.id}
                    onPress={() => {
                      if (selectedDay <= td) {
                        void selectionHaptic();
                        void toggleHabitDate(h.id, selectedDay);
                      }
                    }}
                    style={[styles.itemRow, { borderBottomColor: colors.ln }]}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: withAlpha(h.color, 0.15) }]}>
                      <Icon name={h.icon} size={15} color={h.color} />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.itemName,
                        {
                          color: colors.text,
                          fontFamily: FONT.semibold,
                          textDecorationLine: done ? 'line-through' : 'none',
                          opacity: done ? 0.75 : 1,
                        },
                      ]}
                    >
                      {h.name}
                    </Text>
                    <View
                      style={[
                        styles.checkBadge,
                        {
                          backgroundColor: done ? h.color : 'transparent',
                          borderColor: h.color,
                        },
                      ]}
                    >
                      {done && <Icon name="check" size={12} strokeWidth={2.8} color="#ffffff" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Tasks for selected day */}
          {selectedDetails.tasks.length > 0 && (
            <View style={styles.itemSection}>
              {selectedDetails.tasks.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    void selectionHaptic();
                    void toggleTask(t.id);
                  }}
                  style={[styles.itemRow, { borderBottomColor: colors.ln }]}
                >
                  <View style={[styles.itemIcon, { backgroundColor: colors.card }]}>
                    <Icon name="task" size={15} color={colors.a2} />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.itemName,
                      {
                        color: colors.text,
                        fontFamily: FONT.semibold,
                        textDecorationLine: t.done ? 'line-through' : 'none',
                        opacity: t.done ? 0.75 : 1,
                      },
                    ]}
                  >
                    {t.title}
                  </Text>
                  <View
                    style={[
                      styles.checkBadge,
                      {
                        backgroundColor: t.done ? colors.a2 : 'transparent',
                        borderColor: colors.a2,
                      },
                    ]}
                  >
                    {t.done && <Icon name="check" size={12} strokeWidth={2.8} color="#ffffff" />}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitle: {
    fontSize: 20,
    letterSpacing: -0.5,
  },
  todayChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  todayChipText: {
    fontSize: 11,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  badgeVal: {
    fontSize: 17,
    lineHeight: 20,
  },
  badgeLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  weekLabels: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  grid: {
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 13,
  },
  dotIndicator: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  inspector: {
    marginTop: 14,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  inspectorHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inspectorDate: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  ratePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemSection: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
