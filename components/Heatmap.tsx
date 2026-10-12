import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { parseLocalDate } from '@/lib/date';
import { heatmapRange } from '@/lib/stats';
import { isDue } from '@/lib/streak';
import { FONT, useTheme, withAlpha } from '@/lib/theme';

type HeatmapProps = {
  color: string;
  days: number[];
  log: Record<string, true>;
  todayKey: string;
};

export function Heatmap({ color, days, log, todayKey }: HeatmapProps) {
  const { colors } = useTheme();
  const keys = useMemo(() => heatmapRange(todayKey), [todayKey]);

  const cols: string[][] = useMemo(() => {
    const list: string[][] = [];
    for (let i = 0; i < keys.length; i += 7) {
      list.push(keys.slice(i, i + 7));
    }
    return list;
  }, [keys]);

  const n = useMemo(
    () => keys.filter((k) => log[k]).length,
    [keys, log],
  );

  // Month label positions across columns
  const monthLabels = useMemo(() => {
    const labels: { colIndex: number; label: string }[] = [];
    let prevMonth = -1;
    cols.forEach((col, ci) => {
      if (!col[0]) return;
      const d = parseLocalDate(col[0]);
      const m = d.getMonth();
      if (m !== prevMonth) {
        if (
          labels.length === 0 ||
          ci - labels[labels.length - 1].colIndex >= 3
        ) {
          labels.push({
            colIndex: ci,
            label: d.toLocaleDateString('en-IN', { month: 'short' }),
          });
          prevMonth = m;
        }
      }
    });
    return labels;
  }, [cols]);

  return (
    <View style={styles.container}>
      {/* Month hints header */}
      <View style={styles.monthRow}>
        {cols.map((col, ci) => {
          const mInfo = monthLabels.find((ml) => ml.colIndex === ci);
          return (
            <View key={ci} style={styles.monthCol}>
              {mInfo ? (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.monthText,
                    { color: colors.muted, fontFamily: FONT.semibold },
                  ]}
                >
                  {mInfo.label}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Heatmap Grid */}
      <View style={styles.grid}>
        {cols.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map((k) => {
              const done = !!log[k];
              return (
                <View
                  key={k}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: done ? color : colors.c2,
                      opacity: done || isDue({ days }, k) ? 1 : 0.25,
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Heatmap Map Legend and Summary */}
      <View style={styles.footer}>
        <Text style={[styles.hn, { color: colors.muted, fontFamily: FONT.regular }]}>
          {`${n} days done in last 18 weeks`}
        </Text>
        <View style={styles.legend}>
          <Text style={[styles.legendText, { color: colors.muted, fontFamily: FONT.regular }]}>
            Less
          </Text>
          <View style={[styles.legendDot, { backgroundColor: colors.c2 }]} />
          <View style={[styles.legendDot, { backgroundColor: withAlpha(color, 0.45) }]} />
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={[styles.legendText, { color: colors.muted, fontFamily: FONT.regular }]}>
            More
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
  },
  monthRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 4,
    height: 14,
  },
  monthCol: {
    flex: 1,
    overflow: 'visible',
    position: 'relative',
  },
  monthText: {
    fontSize: 10,
    lineHeight: 12,
    position: 'absolute',
    left: 0,
    width: 32,
  },
  grid: {
    flexDirection: 'row',
    gap: 3,
  },
  col: {
    flex: 1,
    gap: 3,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 3.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  hn: {
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 10,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
});
