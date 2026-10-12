import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import {
  DARK_PRESETS,
  FONT,
  LIGHT_PRESETS,
  type Palette,
  type ThemePresetId,
  useTheme,
  withAlpha,
} from '@/lib/theme';
import { useStore } from '@/store/useStore';

export function ProfileModal() {
  const { colors, preset } = useTheme();
  const insets = useSafeAreaInsets();
  const profileOpen = useStore((s) => s.profileOpen);
  const closeProfile = useStore((s) => s.closeProfile);
  const setThemePreset = useStore((s) => s.setThemePreset);
  const habits = useStore((s) => s.habits);
  const tasks = useStore((s) => s.tasks);
  const userName = useStore((s) => s.userName);
  const setUserName = useStore((s) => s.setUserName);
  const backup = useStore((s) => s.backup);
  const restore = useStore((s) => s.restore);

  const [nameInput, setNameInput] = useState(userName);
  const [themeTab, setThemeTab] = useState<'dark' | 'light'>(
    preset.scheme === 'dark' ? 'dark' : 'light',
  );
  const [statusMsg, setStatusMsg] = useState('');

  const ty = useSharedValue(80);
  const op = useSharedValue(0);

  useEffect(() => {
    if (profileOpen) {
      setNameInput(userName);
      setThemeTab(preset.scheme === 'dark' ? 'dark' : 'light');
      ty.value = 80;
      op.value = 0;
      ty.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      });
      op.value = withTiming(1, {
        duration: 250,
        reduceMotion: ReduceMotion.System,
      });
    }
  }, [profileOpen, userName, preset.scheme, ty, op]);

  useEffect(() => {
    if (!profileOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeProfile();
      return true;
    });
    return () => sub.remove();
  }, [profileOpen, closeProfile]);

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: op.value,
  }));

  if (!profileOpen) return null;

  const handleSelectPreset = (id: ThemePresetId) => {
    void setThemePreset(id);
  };

  const handleNameChange = (text: string) => {
    setNameInput(text);
    void setUserName(text);
  };

  const tasksCompleted = tasks.filter((t) => t.done).length;
  const initial = nameInput.trim() ? nameInput.trim().charAt(0).toUpperCase() : null;

  const activePresets = themeTab === 'dark' ? DARK_PRESETS : LIGHT_PRESETS;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.scrim} onPress={closeProfile} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
        style={styles.kav}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.ln,
              paddingBottom: 24 + insets.bottom,
            },
            slide,
          ]}
        >
        <View style={[styles.grab, { backgroundColor: colors.c2 }]} />

        {/* Minimal Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontFamily: FONT.extra }]}>
            Settings
          </Text>
          <Pressable
            onPress={closeProfile}
            hitSlop={8}
            style={[styles.doneBtn, { backgroundColor: colors.c2 }]}
          >
            <Text style={[styles.doneText, { color: colors.text, fontFamily: FONT.semibold }]}>
              Done
            </Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Section: Profile & Name */}
          <Text style={[styles.sectionHeading, { color: colors.muted, fontFamily: FONT.semibold }]}>
            PROFILE
          </Text>

          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: colors.c2,
                borderColor: colors.ln,
              },
            ]}
          >
            <View style={styles.profileRow}>
              <LinearGradient
                colors={[colors.a1, colors.a2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
                  {initial ? (
                    <Text style={[styles.avatarInitial, { color: colors.text, fontFamily: FONT.extra }]}>
                      {initial}
                    </Text>
                  ) : (
                    <Icon name="user" size={17} color={colors.muted} strokeWidth={2} />
                  )}
                </View>
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.muted, fontFamily: FONT.regular }]}>
                  Your Name
                </Text>
                <TextInput
                  value={nameInput}
                  onChangeText={handleNameChange}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.muted}
                  maxLength={28}
                  style={[
                    styles.nameInput,
                    {
                      color: colors.text,
                      fontFamily: FONT.semibold,
                      backgroundColor: colors.card,
                      borderColor: colors.ln,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.statsRow}>
              <Text style={{ color: colors.muted, fontFamily: FONT.regular, fontSize: 12 }}>
                {`${habits.length} habits active · ${tasksCompleted} tasks completed`}
              </Text>
            </View>
          </View>

          {/* Section: Theme & Appearance */}
          <Text style={[styles.sectionHeading, { color: colors.muted, fontFamily: FONT.semibold, marginTop: 20 }]}>
            APPEARANCE
          </Text>

          {/* Minimal Dark / Light Segmented Switcher */}
          <View style={[styles.themeSegment, { backgroundColor: colors.c2 }]}>
            <Pressable
              onPress={() => setThemeTab('dark')}
              style={[
                styles.themeSegmentBtn,
                themeTab === 'dark' && [
                  styles.themeSegmentBtnActive,
                  { backgroundColor: colors.card, shadowColor: colors.sh },
                ],
              ]}
            >
              <Text
                style={[
                  styles.themeSegmentText,
                  {
                    color: themeTab === 'dark' ? colors.text : colors.muted,
                    fontFamily: themeTab === 'dark' ? FONT.semibold : FONT.regular,
                  },
                ]}
              >
                Dark (3 presets)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setThemeTab('light')}
              style={[
                styles.themeSegmentBtn,
                themeTab === 'light' && [
                  styles.themeSegmentBtnActive,
                  { backgroundColor: colors.card, shadowColor: colors.sh },
                ],
              ]}
            >
              <Text
                style={[
                  styles.themeSegmentText,
                  {
                    color: themeTab === 'light' ? colors.text : colors.muted,
                    fontFamily: themeTab === 'light' ? FONT.semibold : FONT.regular,
                  },
                ]}
              >
                Light (3 presets)
              </Text>
            </Pressable>
          </View>

          {/* Minimal Presets List */}
          <View style={styles.presetsList}>
            {activePresets.map((p) => {
              const active = preset.id === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => handleSelectPreset(p.id)}
                  style={[
                    styles.presetRow,
                    {
                      backgroundColor: p.card,
                      borderColor: active ? colors.text : colors.ln,
                      borderWidth: active ? 1.5 : 1,
                    },
                  ]}
                >
                  {/* Miniature Palette Preview */}
                  <View style={[styles.swatchPill, { backgroundColor: p.bg, borderColor: p.ln }]}>
                    <View style={[styles.swatchDot, { backgroundColor: p.a1 }]} />
                    <View style={[styles.swatchDot, { backgroundColor: p.a2 }]} />
                    <View style={[styles.swatchDot, { backgroundColor: p.a3 }]} />
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.presetName,
                        {
                          color: p.text,
                          fontFamily: active ? FONT.extra : FONT.semibold,
                        },
                      ]}
                    >
                      {p.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.presetDesc, { color: p.muted, fontFamily: FONT.regular }]}
                    >
                      {p.desc}
                    </Text>
                  </View>

                  {/* Active Radio / Check Indicator */}
                  <View
                    style={[
                      styles.indicatorCircle,
                      {
                        borderColor: active ? p.text : p.ln,
                        backgroundColor: active ? p.text : 'transparent',
                      },
                    ]}
                  >
                    {active && <View style={[styles.indicatorDot, { backgroundColor: p.bg }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Section: Data & Backup */}
          <Text style={[styles.sectionHeading, { color: colors.muted, fontFamily: FONT.semibold, marginTop: 20 }]}>
            DATA & BACKUP
          </Text>

          <View style={[styles.cardGroup, { backgroundColor: colors.c2, borderColor: colors.ln, padding: 0 }]}>
            <Pressable
              onPress={() => {
                void backup().catch((e: unknown) => {
                  Alert.alert('Backup failed', e instanceof Error ? e.message : String(e));
                });
              }}
              style={[styles.actionRow, { borderBottomColor: colors.ln, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <Text style={[styles.actionLabel, { color: colors.text, fontFamily: FONT.semibold }]}>
                Export JSON Backup
              </Text>
              <Text style={[styles.actionChevron, { color: colors.muted, fontFamily: FONT.regular }]}>
                ›
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void restore()
                  .then((ok) => {
                    if (ok) setStatusMsg('Backup restored successfully.');
                  })
                  .catch((e: unknown) => {
                    setStatusMsg(e instanceof Error ? e.message : 'Invalid backup format.');
                  });
              }}
              style={styles.actionRow}
            >
              <Text style={[styles.actionLabel, { color: colors.text, fontFamily: FONT.semibold }]}>
                Restore from Backup
              </Text>
              <Text style={[styles.actionChevron, { color: colors.muted, fontFamily: FONT.regular }]}>
                ›
              </Text>
            </Pressable>
          </View>

          {statusMsg ? (
            <Text style={[styles.statusMsg, { color: colors.a3, fontFamily: FONT.semibold }]}>
              {statusMsg}
            </Text>
          ) : null}

          {/* Subtle Footer */}
          <Text style={[styles.footerText, { color: colors.muted, fontFamily: FONT.regular }]}>
            Orbit v1.0.0 · Local-first & Private
          </Text>
        </ScrollView>
      </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
    justifyContent: 'flex-end',
  },
  kav: {
    justifyContent: 'flex-end',
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '92%',
    borderWidth: 1,
  },
  grab: {
    width: 36,
    height: 4.5,
    borderRadius: 9,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  doneText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 7,
    marginHorizontal: 2,
  },
  cardGroup: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
  },
  inputLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 15,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  statsRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  themeSegment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 14,
    marginBottom: 10,
  },
  themeSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSegmentBtnActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  themeSegmentText: {
    fontSize: 12,
  },
  presetsList: {
    gap: 7,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    borderRadius: 16,
  },
  swatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  swatchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  presetName: {
    fontSize: 14,
  },
  presetDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  indicatorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionLabel: {
    fontSize: 14,
  },
  actionChevron: {
    fontSize: 18,
    lineHeight: 18,
  },
  statusMsg: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 12,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 22,
  },
});
