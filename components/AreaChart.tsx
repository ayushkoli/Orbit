import { useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { formatDueLabel, formatShortDate } from '@/lib/date';
import { lightHaptic } from '@/lib/haptics';
import { chartLayout, type DayPoint } from '@/lib/stats';
import { FONT, useTheme, withAlpha } from '@/lib/theme';

type AreaChartProps = {
  points: DayPoint[];
};

export function AreaChart({ points }: AreaChartProps) {
  const { colors } = useTheme();
  const [chartWidth, setChartWidth] = useState(320);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const H = 160;

  const layout = useMemo(
    () => chartLayout(points, chartWidth, H),
    [points, chartWidth],
  );

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      // Container has 14px padding on each side (total 28px)
      const inner = Math.max(200, Math.floor(w - 28));
      setChartWidth(inner);
    }
  };

  const handleTouch = (e: GestureResponderEvent) => {
    if (!points.length) return;
    const x = e.nativeEvent.locationX;
    const L = layout.left;
    const R = layout.right;
    const clampedX = Math.max(L, Math.min(R, x));
    const ratio = R > L ? (clampedX - L) / (R - L) : 0;
    const index = Math.round(ratio * (points.length - 1));
    if (index >= 0 && index < points.length && index !== selectedIndex) {
      setSelectedIndex(index);
      void lightHaptic();
    }
  };

  if (!points.length) return null;

  const lp = layout.last;
  const startLabel = formatDueLabel(points[0]?.date ?? null) || '';
  const area =
    lp && layout.line
      ? `${layout.line}L${lp[0]},${layout.y(0)}L${layout.left},${layout.y(0)}Z`
      : '';

  const activePoint = selectedIndex !== null ? points[selectedIndex] : null;
  const activeX =
    selectedIndex !== null && points.length > 1
      ? layout.left +
        (layout.right - layout.left) * (selectedIndex / (points.length - 1))
      : null;
  const activeY = activePoint ? layout.y(activePoint.rate) : null;

  return (
    <View
      onLayout={onContainerLayout}
      style={[
        styles.chart,
        {
          backgroundColor: colors.card,
          borderColor: colors.ln,
          shadowColor: colors.sh,
        },
      ]}
    >
      {activePoint && (
        <View
          style={[
            styles.tooltip,
            {
              backgroundColor: colors.c2,
              borderColor: colors.ln,
            },
          ]}
        >
          <Text
            style={[
              styles.tooltipDate,
              { color: colors.muted, fontFamily: FONT.regular },
            ]}
          >
            {formatShortDate(activePoint.date)}
          </Text>
          <Text
            style={[
              styles.tooltipVal,
              { color: colors.a1, fontFamily: FONT.extra },
            ]}
          >
            {`${Math.round(activePoint.rate * 100)}% done`}
          </Text>
        </View>
      )}

      <View
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        onResponderRelease={() => setSelectedIndex(null)}
        onResponderTerminate={() => setSelectedIndex(null)}
        style={styles.svgContainer}
      >
        <Svg
          width={chartWidth}
          height={H}
          viewBox={`0 0 ${chartWidth} ${H}`}
          style={styles.svg}
        >
          <Defs>
            <LinearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.a1} />
              <Stop offset="1" stopColor={colors.a2} />
            </LinearGradient>
            <LinearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.a1} stopOpacity={0.35} />
              <Stop offset="1" stopColor={colors.a2} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {[0, 0.5, 1].map((v) => (
            <Line
              key={v}
              x1={layout.left}
              x2={layout.right}
              y1={layout.y(v)}
              y2={layout.y(v)}
              stroke={colors.ln}
              strokeDasharray="3 5"
            />
          ))}

          {[0, 0.5, 1].map((v) => (
            <SvgText
              key={`t${v}`}
              x={0}
              y={layout.y(v) + 4}
              fill={colors.muted}
              fontSize={10}
              fontFamily={FONT.regular}
            >
              {`${v * 100}%`}
            </SvgText>
          ))}

          {area ? <Path d={area} fill="url(#ar)" /> : null}

          {layout.line ? (
            <Path
              d={layout.line}
              fill="none"
              stroke="url(#lg)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {lp && activeX === null ? (
            <Circle
              cx={lp[0]}
              cy={lp[1]}
              r={5}
              fill={colors.a1}
              stroke={colors.card}
              strokeWidth={2.5}
            />
          ) : null}

          {activeX !== null && activeY !== null && (
            <>
              <Line
                x1={activeX}
                x2={activeX}
                y1={layout.top}
                y2={layout.y(0)}
                stroke={colors.a1}
                strokeWidth={1.5}
                strokeDasharray="2 3"
              />
              <Circle
                cx={activeX}
                cy={activeY}
                r={6}
                fill={colors.a1}
                stroke={colors.card}
                strokeWidth={3}
              />
            </>
          )}

          <SvgText
            x={layout.left}
            y={H - 5}
            fill={colors.muted}
            fontSize={11}
            fontFamily={FONT.regular}
          >
            {startLabel}
          </SvgText>

          <SvgText
            x={layout.right}
            y={H - 5}
            fill={colors.muted}
            fontSize={11}
            textAnchor="end"
            fontFamily={FONT.regular}
          >
            Today
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
    marginBottom: 12,
    alignItems: 'center',
  },
  tooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    alignSelf: 'center',
  },
  tooltipDate: {
    fontSize: 12,
  },
  tooltipVal: {
    fontSize: 12,
  },
  svgContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    overflow: 'hidden',
  },
});
