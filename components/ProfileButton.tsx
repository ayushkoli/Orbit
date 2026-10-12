import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { FONT, useTheme } from '@/lib/theme';
import { useStore } from '@/store/useStore';

export function ProfileButton() {
  const { colors } = useTheme();
  const openProfile = useStore((s) => s.openProfile);
  const userName = useStore((s) => s.userName);
  const scale = useSharedValue(1);

  const initial = userName?.trim() ? userName.trim().charAt(0).toUpperCase() : null;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, {
      damping: 15,
      stiffness: 300,
      reduceMotion: ReduceMotion.System,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
      reduceMotion: ReduceMotion.System,
    });
  };

  return (
    <Pressable
      onPress={openProfile}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel="Open profile and settings"
      style={styles.wrap}
    >
      <Animated.View
        style={[
          styles.btn,
          {
            backgroundColor: colors.card,
            borderColor: colors.ln,
            shadowColor: colors.sh,
          },
          animStyle,
        ]}
      >
        <LinearGradient
          colors={[colors.a1, colors.a2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ring}
        >
          <View style={[styles.inner, { backgroundColor: colors.card }]}>
            {initial ? (
              <Text
                style={[
                  styles.initial,
                  { color: colors.text, fontFamily: FONT.extra },
                ]}
              >
                {initial}
              </Text>
            ) : (
              <Text
                style={[
                  styles.dot,
                  { color: colors.a1, fontFamily: FONT.extra },
                ]}
              >
                ●
              </Text>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 2,
  },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  ring: {
    width: 30,
    height: 30,
    borderRadius: 15,
    padding: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 13,
    lineHeight: 15,
  },
  dot: {
    fontSize: 10,
    lineHeight: 12,
  },
});
