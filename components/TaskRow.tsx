import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import type { Task } from '@/db/repo';
import { formatDueLabel, today } from '@/lib/date';
import { lightHaptic, successHaptic } from '@/lib/haptics';
import { FONT, mixHex, useTheme, type Palette, withAlpha } from '@/lib/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function priorityColor(p: number, colors: Palette): string {
  if (p === 2) return colors.a1;
  if (p === 1) return colors.a2;
  return colors.muted;
}

export function TickBox({
  on,
  locked,
  color,
  pop,
  size = 34,
  radius = 12,
  icon = 18,
  onPress,
}: {
  on: boolean;
  locked?: boolean;
  color: string;
  pop?: boolean;
  size?: number;
  radius?: number;
  icon?: number;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const dash = useSharedValue(on ? 0 : 24);

  useEffect(() => {
    if (pop) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 175, reduceMotion: ReduceMotion.System }),
        withTiming(1, { duration: 175, reduceMotion: ReduceMotion.System }),
      );
      dash.value = 24;
      dash.value = withTiming(on ? 0 : 24, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      });
    } else {
      dash.value = on ? 0 : 24;
    }
  }, [on, pop, dash, scale]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: dash.value,
  }));

  return (
    <Pressable onPress={onPress} disabled={locked || !onPress}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: 2,
            borderColor: on ? color : withAlpha(color, 0.65),
            backgroundColor: on ? color : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: locked ? 0.4 : 1,
          },
          boxStyle,
        ]}
      >
        <Svg width={icon} height={icon} viewBox="0 0 24 24" fill="none">
          <AnimatedPath
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke={on ? colors.bg : 'transparent'}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="24 24"
            animatedProps={pathProps}
          />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

type TaskRowProps = {
  task: Task;
  pop?: boolean;
  onToggle: () => void;
  onEdit: () => void;
};

export function TaskRow({ task, pop, onToggle, onEdit }: TaskRowProps) {
  const { colors } = useTheme();
  const c = priorityColor(task.priority, colors);
  const td = today();
  const late = !task.done && !!task.due && task.due < td;
  const due = formatDueLabel(task.due, td);
  const start = mixHex(c, colors.card, 0.91);

  return (
    <View style={[styles.row, { borderColor: colors.ln, shadowColor: colors.sh }]}>
      <LinearGradient
        colors={[start, colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ marginVertical: 9, marginLeft: 9, marginRight: 8 }}>
        <TickBox
          on={task.done}
          color={c}
          pop={pop}
          size={28}
          radius={9}
          icon={16}
          onPress={() => {
            void successHaptic();
            onToggle();
          }}
        />
      </View>
      <Pressable
        onPress={() => {
          void lightHaptic();
          onEdit();
        }}
        style={styles.g}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            {
              color: task.done ? colors.muted : colors.text,
              fontFamily: FONT.semibold,
              textDecorationLine: task.done ? 'line-through' : 'none',
            },
          ]}
        >
          {task.title}
        </Text>
        {!!(due || task.tag || task.reminder) && (
          <View style={styles.meta}>
            {!!due && (
              <Text
                style={{
                  color: late ? colors.a1 : colors.muted,
                  fontFamily: FONT.regular,
                  fontSize: 13,
                }}
              >
                {due}
              </Text>
            )}
            {!!task.reminder && (
              <View style={styles.rem}>
                <Icon name="bell" size={12} color={colors.a2} />
                <Text
                  style={{
                    color: colors.muted,
                    fontFamily: FONT.regular,
                    fontSize: 13,
                  }}
                >
                  {task.reminder}
                </Text>
              </View>
            )}
            {!!task.tag && (
              <Text
                style={{
                  color: colors.muted,
                  fontFamily: FONT.regular,
                  fontSize: 13,
                }}
              >
                {`#${task.tag}`}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    marginBottom: 9,
    borderWidth: 1,
    overflow: 'hidden',
    paddingRight: 14,
    minHeight: 56,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  },
  g: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
  },
  title: {
    fontSize: 15,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
    alignItems: 'center',
  },
  rem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
