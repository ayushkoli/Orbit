import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays, formatShortDate, parseLocalDate, today, weekKeys } from '@/lib/date';
import { lightHaptic, selectionHaptic } from '@/lib/haptics';
import { FONT, useTheme } from '@/lib/theme';

const LABELS = 'MTWTFSS';

type WeekStripProps = {
  selected: string;
  dots: Record<string, boolean>;
  onSelect: (key: string) => void;
};

export function WeekStrip({ selected, dots, onSelect }: WeekStripProps) {
  const { colors } = useTheme();
  const td = today();
  const keys = weekKeys(selected);
  const startDay = keys[0];
  const endDay = keys[keys.length - 1];

  const currentWeekKeys = weekKeys(td);
  const isCurrentWeek = keys[0] === currentWeekKeys[0];

  const handleDayPress = (key: string) => {
    void selectionHaptic();
    onSelect(key);
  };

  const handlePrevWeek = () => {
    void lightHaptic();
    // Shift selected date back by 7 days
    onSelect(addDays(selected, -7));
  };

  const handleNextWeek = () => {
    void lightHaptic();
    // Shift selected date forward by 7 days
    onSelect(addDays(selected, 7));
  };

  const handleJumpToToday = () => {
    void lightHaptic();
    onSelect(td);
  };

  return (
    <View style={styles.container}>
      {/* Week Header info with quick Today jump */}
      <View style={styles.headerRow}>
        <Text style={[styles.rangeText, { color: colors.muted, fontFamily: FONT.semibold }]}>
          {`${formatShortDate(startDay)} – ${formatShortDate(endDay)}`}
        </Text>
        {!isCurrentWeek && (
          <Pressable
            onPress={handleJumpToToday}
            hitSlop={8}
            style={[styles.todayChip, { backgroundColor: colors.c2 }]}
          >
            <Text
              style={[
                styles.todayChipText,
                { color: colors.a1, fontFamily: FONT.semibold },
              ]}
            >
              Back to Today
            </Text>
          </Pressable>
        )}
      </View>

      {/* Week Row with Navigation Arrows */}
      <View style={styles.row}>
        {/* Previous Week Arrow */}
        <Pressable
          onPress={handlePrevWeek}
          hitSlop={6}
          style={({ pressed }) => [
            styles.navBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.ln,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Previous week"
        >
          <Text style={[styles.arrowText, { color: colors.text, fontFamily: FONT.semibold }]}>
            ‹
          </Text>
        </Pressable>

        {/* 7 Days of the Week */}
        <View style={styles.daysRow}>
          {keys.map((key, i) => {
            const on = key === selected;
            const isToday = key === td;
            return (
              <Pressable
                key={key}
                onPress={() => handleDayPress(key)}
                style={({ pressed }) => [
                  styles.day,
                  {
                    backgroundColor: on ? colors.text : colors.card,
                    borderColor: on
                      ? colors.text
                      : isToday
                      ? colors.a1
                      : colors.ln,
                    borderWidth: isToday && !on ? 1.5 : 1,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.wd,
                    {
                      color: on ? colors.bg : isToday ? colors.a1 : colors.muted,
                      fontFamily: isToday ? FONT.semibold : FONT.regular,
                    },
                  ]}
                >
                  {LABELS[i]}
                </Text>
                <Text
                  style={[
                    styles.num,
                    {
                      color: on ? colors.bg : colors.text,
                      fontFamily: on ? FONT.extra : FONT.semibold,
                    },
                  ]}
                >
                  {parseLocalDate(key).getDate()}
                </Text>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: colors.a3, opacity: dots[key] ? 1 : 0 },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Next Week Arrow */}
        <Pressable
          onPress={handleNextWeek}
          hitSlop={6}
          style={({ pressed }) => [
            styles.navBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.ln,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Next week"
        >
          <Text style={[styles.arrowText, { color: colors.text, fontFamily: FONT.semibold }]}>
            ›
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  rangeText: {
    fontSize: 13,
  },
  todayChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  todayChipText: {
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    width: 28,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  arrowText: {
    fontSize: 20,
    lineHeight: 22,
  },
  daysRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  day: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  wd: {
    fontSize: 11,
    lineHeight: 12,
  },
  num: {
    fontSize: 15,
    lineHeight: 18,
  },
  dot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 9,
    marginTop: 1,
  },
});
