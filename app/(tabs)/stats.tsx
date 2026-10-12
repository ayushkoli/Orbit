import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AreaChart } from '@/components/AreaChart';
import { Icon } from '@/components/Icon';
import { ProfileButton } from '@/components/ProfileButton';
import { StatsCalendar } from '@/components/StatsCalendar';
import { lightHaptic, selectionHaptic } from '@/lib/haptics';
import {
  attachLogs,
  combinedDailyRates,
  completionTotals,
  habitRates,
  longestStreakAmong,
} from '@/lib/stats';
import { FONT, mixHex, useTheme, withAlpha } from '@/lib/theme';
import { useStore } from '@/store/useStore';

type ViewMode = 'trends' | 'calendar';

export default function StatsScreen() {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const habits = useStore((s) => s.habits);
  const tasks = useStore((s) => s.tasks);
  const logs = useStore((s) => s.logs);
  const rng = useStore((s) => s.statsRange);
  const setStatsRange = useStore((s) => s.setStatsRange);
  const backup = useStore((s) => s.backup);
  const restore = useStore((s) => s.restore);
  const openProfile = useStore((s) => s.openProfile);
  const [viewMode, setViewMode] = useState<ViewMode>('trends');
  const [msg, setMsg] = useState('');

  const withLog = useMemo(() => attachLogs(habits, logs), [habits, logs]);
  const points = useMemo(
    () => combinedDailyRates(withLog, rng),
    [withLog, rng],
  );
  const totals = useMemo(
    () => completionTotals(withLog, rng),
    [withLog, rng],
  );
  const perHabit = useMemo(() => habitRates(withLog, rng), [withLog, rng]);
  const longest = longestStreakAmong(withLog);
  const tasksDone = tasks.filter((t) => t.done).length;

  const handleTabChange = (mode: ViewMode) => {
    void selectionHaptic();
    setViewMode(mode);
  };

  const handleRangeChange = (n: 7 | 30 | 90) => {
    void lightHaptic();
    setStatsRange(n);
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        { paddingTop: insets.top + 16, paddingBottom: 130 + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Top Header with Title and Profile Button */}
      <View style={styles.topHeader}>
        <Text style={[styles.title, { color: colors.text, fontFamily: FONT.extra }]}>
          Stats
        </Text>
        <ProfileButton />
      </View>

      {/* iOS Segmented Control Switcher */}
      <View style={[styles.segmentWrap, { backgroundColor: colors.c2 }]}>
        <Pressable
          onPress={() => handleTabChange('trends')}
          style={[
            styles.segmentBtn,
            viewMode === 'trends' && [
              styles.segmentBtnActive,
              {
                backgroundColor: colors.card,
                shadowColor: colors.sh,
              },
            ],
          ]}
        >
          <View style={styles.segmentInner}>
            <Icon
              name="chart"
              size={15}
              color={viewMode === 'trends' ? colors.text : colors.muted}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color: viewMode === 'trends' ? colors.text : colors.muted,
                  fontFamily: viewMode === 'trends' ? FONT.extra : FONT.semibold,
                },
              ]}
            >
              Chart
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleTabChange('calendar')}
          style={[
            styles.segmentBtn,
            viewMode === 'calendar' && [
              styles.segmentBtnActive,
              {
                backgroundColor: colors.card,
                shadowColor: colors.sh,
              },
            ],
          ]}
        >
          <View style={styles.segmentInner}>
            <Icon
              name="calendar"
              size={15}
              color={viewMode === 'calendar' ? colors.text : colors.muted}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color: viewMode === 'calendar' ? colors.text : colors.muted,
                  fontFamily: viewMode === 'calendar' ? FONT.extra : FONT.semibold,
                },
              ]}
            >
              Calendar
            </Text>
          </View>
        </Pressable>
      </View>

      {viewMode === 'trends' ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          {/* Day range chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {([7, 30, 90] as const).map((n) => {
              const on = rng === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => handleRangeChange(n)}
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
                    {`${n} days`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Area Chart */}
          {habits.length ? (
            <AreaChart points={points} />
          ) : (
            <Text style={[styles.empty, { color: colors.muted, fontFamily: FONT.regular }]}>
              Add habits to see analytics.
            </Text>
          )}

          {/* Habit Completion Metrics */}
          <View style={styles.h3}>
            <Text style={[styles.h3t, { color: colors.text, fontFamily: FONT.extra }]}>
              Habit completion
            </Text>
            <Text style={[styles.h3s, { color: colors.muted, fontFamily: FONT.regular }]}>
              all habits combined
            </Text>
          </View>

          <View style={styles.sc}>
            <StatCard value={`${totals.averagePct}%`} label="average" />
            <StatCard value={`${longest}`} label="longest streak" />
            <StatCard value={`${tasksDone}`} label="tasks done" />
            <StatCard value={`${habits.length}`} label="active habits" />
          </View>

          {/* By Habit Breakdown */}
          <View style={styles.h3}>
            <Text style={[styles.h3t, { color: colors.text, fontFamily: FONT.extra }]}>
              By habit
            </Text>
            <Text style={[styles.h3s, { color: colors.muted, fontFamily: FONT.regular }]}>
              {`last ${rng} days`}
            </Text>
          </View>

          {habits.map((h) => {
            const r = perHabit[h.id];
            const p = r?.due ? Math.round((r.done / r.due) * 100) : 0;
            const start = mixHex(h.color, colors.card, 0.91);
            return (
              <View
                key={h.id}
                style={[
                  styles.br,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.ln,
                  },
                ]}
              >
                <View style={[styles.tile, { backgroundColor: withAlpha(h.color, 0.17) }]}>
                  <Icon name={h.icon} size={18} color={h.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      marginBottom: 5,
                      fontFamily: FONT.semibold,
                      color: colors.text,
                    }}
                  >
                    {h.name}
                  </Text>
                  <View style={[styles.bt, { backgroundColor: colors.c2 }]}>
                    <LinearGradient
                      colors={[start, h.color]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: `${Math.max(2, p)}%`, height: '100%', borderRadius: 9 }}
                    />
                  </View>
                </View>
                <Text
                  style={{
                    width: 44,
                    textAlign: 'right',
                    color: colors.text,
                    fontFamily: FONT.extra,
                  }}
                >
                  {`${p}%`}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          {/* Calendar View in Stats */}
          <StatsCalendar habits={habits} tasks={tasks} logs={logs} />
        </Animated.View>
      )}

      {/* Data and Settings Section */}
      <View style={styles.h3}>
        <Text style={[styles.h3t, { color: colors.text, fontFamily: FONT.extra }]}>
          Device Data & Profile
        </Text>
      </View>

      <View style={styles.btns}>
        <Btn
          label="Backup"
          onPress={() => {
            void lightHaptic();
            void backup().catch((e: unknown) =>
              Alert.alert('Backup failed', e instanceof Error ? e.message : String(e)),
            );
          }}
        />
        <Btn
          label="Restore"
          onPress={() => {
            void lightHaptic();
            void restore()
              .then((ok) => {
                if (ok) setMsg('Restored successfully.');
              })
              .catch((e: unknown) => {
                setMsg(e instanceof Error ? e.message : 'Invalid backup text.');
              });
          }}
        />
        <Btn
          label="Theme Presets"
          onPress={() => {
            void lightHaptic();
            openProfile();
          }}
        />
      </View>

      {msg ? (
        <Text style={{ color: colors.a3, fontFamily: FONT.semibold, marginTop: 8 }}>
          {msg}
        </Text>
      ) : null}

      <Text
        style={{
          color: colors.muted,
          fontFamily: FONT.regular,
          marginTop: 10,
          fontSize: 13,
          lineHeight: 18,
        }}
      >
        Data lives strictly on this device. Back up anytime before clearing app cache or uninstalling.
      </Text>
    </ScrollView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  const start = mixHex(colors.card, '#ffffff', 0.08);
  return (
    <View
      style={[
        styles.scCard,
        {
          borderColor: colors.ln,
          shadowColor: colors.sh,
          overflow: 'hidden',
          backgroundColor: colors.card,
        },
      ]}
    >
      <LinearGradient
        colors={[start, colors.card]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.scVal, { color: colors.text, fontFamily: FONT.extra }]}>
        {value}
      </Text>
      <Text style={{ color: colors.muted, fontFamily: FONT.regular }}>{label}</Text>
    </View>
  );
}

function Btn({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.btn,
        {
          backgroundColor: colors.card,
          borderColor: colors.ln,
          shadowColor: colors.sh,
        },
      ]}
    >
      <Text style={{ color: colors.text, fontFamily: FONT.semibold }}>{label}</Text>
    </Pressable>
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
  chips: {
    gap: 6,
    marginBottom: 12,
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
    fontSize: 15,
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
  sc: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  scCard: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 2,
  },
  scVal: {
    fontSize: 30,
    letterSpacing: -1,
    lineHeight: 34,
  },
  br: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  tile: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bt: {
    height: 8,
    borderRadius: 9,
    overflow: 'hidden',
  },
  btns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
});
