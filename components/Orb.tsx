import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { FONT, mixHex, useTheme } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type OrbProps = {
  overall: number;
  taskRate: number;
  habitRate: number;
  everything: string;
  tasks: string;
  habits: string;
  animKey: string;
};

function Ring({
  r,
  progress,
  grad,
  track,
  animKey,
}: {
  r: number;
  progress: number;
  grad: string;
  track: string;
  animKey: string;
}) {
  const C = 2 * Math.PI * r;
  const offset = useSharedValue(C);
  const prevKey = useRef(animKey);

  useEffect(() => {
    if (prevKey.current !== animKey) {
      prevKey.current = animKey;
      offset.value = C;
    }
    offset.value = withTiming(C * (1 - progress), {
      duration: 600,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      reduceMotion: ReduceMotion.System,
    });
  }, [progress, C, animKey, offset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <>
      <Circle
        cx={100}
        cy={100}
        r={r}
        fill="none"
        stroke={track}
        strokeWidth={12}
      />
      <AnimatedCircle
        cx={100}
        cy={100}
        r={r}
        fill="none"
        stroke={grad}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={`${C} ${C}`}
        rotation={-90}
        originX={100}
        originY={100}
        animatedProps={animatedProps}
      />
    </>
  );
}

export function Orb({
  overall,
  taskRate,
  habitRate,
  everything,
  tasks,
  habits,
  animKey,
}: OrbProps) {
  const { colors } = useTheme();
  const tot = everything.split('/');
  const full = overall === 1 && tot[1] !== '0';
  const cardStart = mixHex(colors.card, '#ffffff', 0.08);

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: colors.ln,
          shadowColor: colors.sh,
        },
      ]}
    >
      <ExpoGradient
        colors={[cardStart, colors.card]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg
        width={172}
        height={172}
        viewBox="0 0 200 200"
        style={
          full
            ? {
                shadowColor: colors.a1,
                shadowOpacity: 0.85,
                shadowRadius: 12,
                elevation: 8,
              }
            : undefined
        }
      >
        <Defs>
          <LinearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.a1} />
            <Stop offset="1" stopColor={colors.a2} />
          </LinearGradient>
          <LinearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.a2} />
            <Stop offset="1" stopColor={colors.a3} />
          </LinearGradient>
          <LinearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.a3} />
            <Stop offset="1" stopColor={colors.a1} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={100}
          cy={100}
          r={98}
          fill="none"
          stroke={colors.muted}
          strokeWidth={1.5}
          strokeDasharray="1 7"
          strokeLinecap="round"
          opacity={0.5}
        />
        <Ring
          r={86}
          progress={overall}
          grad="url(#g1)"
          track={colors.c2}
          animKey={animKey}
        />
        <Ring
          r={67}
          progress={taskRate}
          grad="url(#g2)"
          track={colors.c2}
          animKey={animKey}
        />
        <Ring
          r={48}
          progress={habitRate}
          grad="url(#g3)"
          track={colors.c2}
          animKey={animKey}
        />
        <SvgText
          x={100}
          y={109}
          fill={colors.text}
          fontSize={26}
          fontWeight="800"
          textAnchor="middle"
        >
          {`${Math.round(overall * 100)}%`}
        </SvgText>
      </Svg>
      <View style={styles.legend}>
        <LegendDot color={colors.a1} value={everything} label="everything" />
        <LegendDot color={colors.a2} value={tasks} label="tasks" />
        <LegendDot color={colors.a3} value={habits} label="habits" />
      </View>
    </View>
  );
}

function LegendDot({
  color,
  value,
  label,
}: {
  color: string;
  value: string;
  label: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.legRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={[styles.val, { color: colors.text, fontFamily: FONT.extra }]}>
          {value}
        </Text>
        <Text style={[styles.lab, { color: colors.muted, fontFamily: FONT.regular }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 38,
    paddingVertical: 16,
    paddingRight: 18,
    paddingLeft: 10,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  legend: {
    flex: 1,
    gap: 14,
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 9,
  },
  val: {
    fontSize: 18,
    lineHeight: 20,
  },
  lab: {
    fontSize: 14,
  },
});
