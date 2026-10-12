import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutRectangle,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { lightHaptic, mediumHaptic } from '@/lib/haptics';
import { FONT, useTheme, withAlpha } from '@/lib/theme';
import { useStore } from '@/store/useStore';

type TabItem = {
  name: string;
  label: string;
  icon: IconName;
  index: number;
};

const TABS: TabItem[] = [
  { name: 'index', label: 'Today', icon: 'orb', index: 0 },
  { name: 'tasks', label: 'Tasks', icon: 'task', index: 1 },
  { name: 'habits', label: 'Habits', icon: 'loop', index: 2 },
  { name: 'stats', label: 'Stats', icon: 'bars', index: 3 },
];

// Stiff + heavily damped = fast, snappy, no wobble
const PILL_SPRING = {
  damping: 28,
  stiffness: 520,
  mass: 0.6,
  reduceMotion: ReduceMotion.System,
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const [tabLayouts, setTabLayouts] = useState<Record<number, LayoutRectangle>>({});

  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  const activeIndex = state.index;
  const prevIndex = useRef(activeIndex);

  const pillX = useSharedValue(0);
  const pillY = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillHeight = useSharedValue(0);
  const pillOpacity = useSharedValue(0);
  const pillStretchX = useSharedValue(1);
  const pillStretchY = useSharedValue(1);

  const fabScale = useSharedValue(1);

  useEffect(() => {
    const layout = tabLayouts[activeIndex];
    if (!layout) return;

    if (pillOpacity.value === 0) {
      // First appearance: place instantly, fade in
      pillX.value = layout.x;
      pillY.value = layout.y;
      pillWidth.value = layout.width;
      pillHeight.value = layout.height;
      pillOpacity.value = withTiming(1, { duration: 160 });
    } else {
      const changed = prevIndex.current !== activeIndex;

      pillX.value = withSpring(layout.x, PILL_SPRING);
      pillWidth.value = withSpring(layout.width, PILL_SPRING);
      pillY.value = layout.y;
      pillHeight.value = layout.height;

      if (changed) {
        // Quick subtle stretch, then a clean ease back (no bounce)
        pillStretchX.value = withSequence(
          withTiming(1.07, { duration: 80, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }),
        );
        pillStretchY.value = withSequence(
          withTiming(0.95, { duration: 80, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }),
        );
      }
    }

    prevIndex.current = activeIndex;
  }, [
    activeIndex,
    tabLayouts,
    pillX,
    pillY,
    pillWidth,
    pillHeight,
    pillOpacity,
    pillStretchX,
    pillStretchY,
  ]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: pillX.value,
    top: pillY.value,
    width: pillWidth.value,
    height: pillHeight.value,
    opacity: pillOpacity.value,
    transform: [{ scaleX: pillStretchX.value }, { scaleY: pillStretchY.value }],
  }));

  const go = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;

    void lightHaptic();

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented && state.routes[state.index]?.name !== routeName) {
      navigation.navigate(routeName);
    }
  };

  const openCreate = useStore((s) => s.openCreate);
  const selectedDate = useStore((s) => s.selectedDate);

  const handleFabPressIn = () => {
    fabScale.value = withSpring(0.9, {
      damping: 15,
      stiffness: 300,
      reduceMotion: ReduceMotion.System,
    });
  };

  const handleFabPressOut = () => {
    fabScale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
      reduceMotion: ReduceMotion.System,
    });
  };

  const onAdd = () => {
    void mediumHaptic();
    const tab = state.routes[state.index]?.name;
    openCreate(tab === 'habits' ? 'h' : 't', tab === 'index' ? selectedDate : '');
  };

  const animatedFabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: 14 + insets.bottom }]}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 85 : 55}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        blurMethod={Platform.OS === 'android' ? 'none' : undefined}
        style={[
          styles.bar,
          {
            backgroundColor: Platform.OS === 'android' ? colors.card : colors.glass,
            borderColor: colors.glassBorder,
            shadowColor: colors.sh,
          },
        ]}
      >
        {/* Animated Sliding Pill Indicator (rounded-squircle with soft accent tint) */}
        <Animated.View
          pointerEvents="none"
          style={[
            animatedPillStyle,
            styles.pill,
            {
              backgroundColor: colors.c2,
              borderColor: withAlpha(colors.ln, 0.5),
            },
          ]}
        >
          <LinearGradient
            colors={[withAlpha(colors.a1, 0.16), withAlpha(colors.a2, 0.06)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.pillGloss}
          />
        </Animated.View>

        {/* Left Tabs */}
        {left.map((tab) => (
          <TabButton
            key={tab.name}
            label={tab.label}
            icon={tab.icon}
            active={state.routes[state.index]?.name === tab.name}
            onPress={() => go(tab.name)}
            color={colors.text}
            muted={colors.muted}
            onLayout={(layout) => {
              setTabLayouts((prev) => ({ ...prev, [tab.index]: layout }));
            }}
          />
        ))}

        {/* Center Add Button with Spring Bounce & Glowing Gradient */}
        <Pressable
          onPress={onAdd}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          accessibilityRole="button"
          accessibilityLabel="Add task or habit"
          style={styles.fabHit}
        >
          <Animated.View style={animatedFabStyle}>
            <LinearGradient
              colors={[colors.a1, colors.a2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.fab, { shadowColor: colors.a1 }]}
            >
              <Icon name="plus" size={26} strokeWidth={2.4} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
        </Pressable>

        {/* Right Tabs */}
        {right.map((tab) => (
          <TabButton
            key={tab.name}
            label={tab.label}
            icon={tab.icon}
            active={state.routes[state.index]?.name === tab.name}
            onPress={() => go(tab.name)}
            color={colors.text}
            muted={colors.muted}
            onLayout={(layout) => {
              setTabLayouts((prev) => ({ ...prev, [tab.index]: layout }));
            }}
          />
        ))}
      </BlurView>
    </View>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
  color,
  muted,
  onLayout,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
  color: string;
  muted: string;
  onLayout: (layout: LayoutRectangle) => void;
}) {
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(active ? 1.06 : 1, {
      damping: 22,
      stiffness: 420,
      reduceMotion: ReduceMotion.System,
    });
    lift.value = withSpring(active ? -1.5 : 0, {
      damping: 22,
      stiffness: 420,
      reduceMotion: ReduceMotion.System,
    });
  }, [active, scale, lift]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));

  const tint = active ? color : muted;

  return (
    <Pressable
      onPress={onPress}
      onLayout={(e) => onLayout(e.nativeEvent.layout)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={styles.tab}
    >
      <Animated.View style={[styles.tabInner, animStyle]}>
        <Icon name={icon} size={21} strokeWidth={active ? 2.2 : 1.8} color={tint} />
        <Text
          style={[
            styles.label,
            {
              color: tint,
              fontFamily: active ? FONT.extra : FONT.regular,
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    padding: 6,
    borderRadius: 99,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 14,
  },
  pill: {
    borderRadius: 45,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pillGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  tab: {
    width: 65,
    height: 65,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    lineHeight: 12,
  },
  fabHit: {
    marginHorizontal: 5,
    zIndex: 3,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
});