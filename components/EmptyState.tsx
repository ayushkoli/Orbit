import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { lightHaptic } from '@/lib/haptics';
import { FONT, useTheme, withAlpha } from '@/lib/theme';

type ActionConfig = {
  label: string;
  onPress: () => void;
  icon?: IconName;
};

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description: string;
  primaryAction?: ActionConfig;
  secondaryAction?: ActionConfig;
};

export function EmptyState({
  icon = 'orb',
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

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
      <LinearGradient
        colors={[withAlpha(colors.a1, 0.06), withAlpha(colors.c2, 0.45)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: withAlpha(colors.a1, 0.14),
            borderColor: withAlpha(colors.a1, 0.25),
          },
        ]}
      >
        <Icon name={icon} size={28} color={colors.a1} />
      </View>
      <Text style={[styles.title, { color: colors.text, fontFamily: FONT.extra }]}>
        {title}
      </Text>
      <Text style={[styles.desc, { color: colors.muted, fontFamily: FONT.regular }]}>
        {description}
      </Text>

      {(primaryAction || secondaryAction) && (
        <View style={styles.actions}>
          {primaryAction && (
            <Pressable
              onPress={() => {
                void lightHaptic();
                primaryAction.onPress();
              }}
              style={styles.btnHit}
            >
              <LinearGradient
                colors={[colors.a1, colors.a2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                {primaryAction.icon && (
                  <Icon name={primaryAction.icon} size={15} color="#ffffff" />
                )}
                <Text
                  style={[
                    styles.primaryBtnText,
                    { fontFamily: FONT.semibold, color: '#ffffff' },
                  ]}
                >
                  {primaryAction.label}
                </Text>
              </LinearGradient>
            </Pressable>
          )}

          {secondaryAction && (
            <Pressable
              onPress={() => {
                void lightHaptic();
                secondaryAction.onPress();
              }}
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.c2, borderColor: colors.ln },
              ]}
            >
              {secondaryAction.icon && (
                <Icon name={secondaryAction.icon} size={15} color={colors.text} />
              )}
              <Text
                style={[
                  styles.secondaryBtnText,
                  { color: colors.text, fontFamily: FONT.semibold },
                ]}
              >
                {secondaryAction.label}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 22,
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 2,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  btnHit: {
    minWidth: 120,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  primaryBtnText: {
    fontSize: 14,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 120,
  },
  secondaryBtnText: {
    fontSize: 14,
  },
});
