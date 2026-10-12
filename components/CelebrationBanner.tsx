import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { FONT, useTheme, withAlpha } from '@/lib/theme';

type CelebrationBannerProps = {
  habitsDone: number;
  tasksDone: number;
  total: number;
};

export function CelebrationBanner({
  habitsDone,
  tasksDone,
  total,
}: CelebrationBannerProps) {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.duration(280)}
      style={[
        styles.badge,
        {
          backgroundColor: colors.card,
          borderColor: withAlpha(colors.a1, 0.35),
          shadowColor: colors.sh,
        },
      ]}
    >
      <LinearGradient
        colors={[withAlpha(colors.a1, 0.09), withAlpha(colors.card, 0.6)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.left}>
        <View
          style={[
            styles.iconTile,
            { backgroundColor: withAlpha(colors.a1, 0.16) },
          ]}
        >
          <Icon name="check" size={14} color={colors.a1} strokeWidth={2.8} />
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: FONT.semibold }]}>
          Done for the Day
        </Text>
      </View>

      <View
        style={[
          styles.pill,
          {
            backgroundColor: withAlpha(colors.a1, 0.14),
            borderColor: withAlpha(colors.a1, 0.28),
          },
        ]}
      >
        <Text style={[styles.pillText, { color: colors.a1, fontFamily: FONT.extra }]}>
          {`${total}/${total} perfect`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginVertical: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconTile: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    letterSpacing: -0.2,
  },
});
