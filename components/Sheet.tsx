import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
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

import { HABIT_ICONS, Icon } from '@/components/Icon';
import {
  addDays,
  formatShortDate,
  monthMatrix,
  parseLocalDate,
  shiftMonth,
  today,
} from '@/lib/date';
import { lightHaptic, selectionHaptic, successHaptic, warningHaptic } from '@/lib/haptics';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from '@/lib/notifications';
import { FONT, HABIT_COLORS, useTheme } from '@/lib/theme';
import { useStore } from '@/store/useStore';

const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const ORD = [1, 2, 3, 4, 5, 6, 0];

export function Sheet() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheet = useStore((s) => s.sheet);
  const patchSheet = useStore((s) => s.patchSheet);
  const closeSheet = useStore((s) => s.closeSheet);
  const saveSheet = useStore((s) => s.saveSheet);
  const deleteSheet = useStore((s) => s.deleteSheet);
  const inputRef = useRef<TextInput>(null);
  const [month, setMonth] = useState(today());
  const ty = useSharedValue(60);
  const op = useSharedValue(0);

  const open = !!sheet;
  const sheetId = sheet?.id ?? '';
  const sheetType = sheet?.type;
  useEffect(() => {
    if (!open) return;
    setMonth(useStore.getState().sheet?.d || today());
    ty.value = 60;
    op.value = 0;
    ty.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
    op.value = withTiming(1, { duration: 250, reduceMotion: ReduceMotion.System });
    if (!sheetId) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, sheetId, sheetType, ty, op]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet();
      return true;
    });
    return () => sub.remove();
  }, [open, closeSheet]);

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: op.value,
  }));

  if (!sheet) return null;
  const T = sheet.type === 't';
  const editing = !!sheet.id;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.scrim} onPress={closeSheet} />
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
              paddingBottom: 18 + insets.bottom,
            },
            slide,
          ]}
        >
          <View style={[styles.grab, { backgroundColor: colors.c2 }]} />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!editing && (
              <View style={[styles.seg, { backgroundColor: colors.c2 }]}>
                <Seg
                  label="Task"
                  on={T}
                  onPress={() => patchSheet({ type: 't' })}
                />
                <Seg
                  label="Habit"
                  on={!T}
                  onPress={() => patchSheet({ type: 'h' })}
                />
              </View>
            )}
            <TextInput
              ref={inputRef}
              value={sheet.n}
              onChangeText={(n) => patchSheet({ n })}
              placeholder={T ? 'What needs doing?' : 'Name your habit'}
              placeholderTextColor={colors.muted}
              maxLength={80}
              style={[
                styles.input,
                {
                  backgroundColor: colors.c2,
                  color: colors.text,
                  fontFamily: FONT.regular,
                },
              ]}
            />
            {T ? (
              <>
                <Text style={[styles.l, { color: colors.muted, fontFamily: FONT.regular }]}>
                  Priority
                </Text>
                <View style={[styles.seg, { backgroundColor: colors.c2 }]}>
                  {(['Low', 'Medium', 'High'] as const).map((x, i) => (
                    <Seg
                      key={x}
                      label={x}
                      on={sheet.p === i}
                      onPress={() => patchSheet({ p: i as 0 | 1 | 2 })}
                    />
                  ))}
                </View>
                <Text style={[styles.l, { color: colors.muted, fontFamily: FONT.regular }]}>
                  Due
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                >
                  <Chip label="Today" onPress={() => patchSheet({ d: addDays(today(), 0) })} />
                  <Chip label="Tomorrow" onPress={() => patchSheet({ d: addDays(today(), 1) })} />
                  <Chip label="Next week" onPress={() => patchSheet({ d: addDays(today(), 7) })} />
                  <Chip label="No date" onPress={() => patchSheet({ d: '' })} />
                </ScrollView>
                <View style={styles.calHead}>
                  <Pressable onPress={() => setMonth(shiftMonth(month, -1))}>
                    <Text style={{ color: colors.text, fontFamily: FONT.semibold }}>‹</Text>
                  </Pressable>
                  <Text style={{ color: colors.text, fontFamily: FONT.semibold }}>
                    {parseLocalDate(`${month.slice(0, 7)}-01`).toLocaleDateString('en-IN', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <Pressable onPress={() => setMonth(shiftMonth(month, 1))}>
                    <Text style={{ color: colors.text, fontFamily: FONT.semibold }}>›</Text>
                  </Pressable>
                </View>
                <View style={styles.calGrid}>
                  {'MTWTFSS'.split('').map((d, i) => (
                    <Text
                      key={`${d}${i}`}
                      style={[styles.calWd, { color: colors.muted, fontFamily: FONT.regular }]}
                    >
                      {d}
                    </Text>
                  ))}
                  {monthMatrix(month).flatMap((row, rIdx) =>
                    row.map((k, cIdx) =>
                      k ? (
                        <Pressable
                          key={k}
                          onPress={() => {
                            void selectionHaptic();
                            patchSheet({ d: k });
                          }}
                          style={[
                            styles.calDay,
                            sheet.d === k && { backgroundColor: colors.text },
                          ]}
                        >
                          <Text
                            style={{
                              color: sheet.d === k ? colors.bg : colors.text,
                              fontFamily: FONT.regular,
                            }}
                          >
                            {parseLocalDate(k).getDate()}
                          </Text>
                        </Pressable>
                      ) : (
                        <View key={`empty-${rIdx}-${cIdx}`} style={styles.calDay} />
                      ),
                    ),
                  )}
                </View>
                <Text
                  style={{
                    color: colors.muted,
                    fontFamily: FONT.regular,
                    marginBottom: 12,
                    fontSize: 13,
                  }}
                >
                  {sheet.d ? formatShortDate(sheet.d) : 'No date'}
                </Text>

                <View style={styles.sectionHeaderRow}>
                  <Icon name="bell" size={14} color={colors.muted} />
                  <Text style={[styles.l, { color: colors.muted, fontFamily: FONT.regular, marginTop: 0, marginBottom: 0 }]}>
                    Reminder (optional)
                  </Text>
                </View>
                <ReminderPicker
                  value={sheet.reminder}
                  presets={['09:00', '12:00', '17:00', '20:00']}
                  onChange={(val) => {
                    if (val && !sheet.d) {
                      patchSheet({ reminder: val, d: today() });
                    } else {
                      patchSheet({ reminder: val });
                    }
                  }}
                  placeholder="Custom time (HH:MM)"
                />

                <Text style={[styles.l, { color: colors.muted, fontFamily: FONT.regular }]}>
                  Tag
                </Text>
                <TextInput
                  value={sheet.tag}
                  onChangeText={(tag) => patchSheet({ tag })}
                  placeholder="Tag (work, gym, college)"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.c2,
                      color: colors.text,
                      fontFamily: FONT.regular,
                    },
                  ]}
                />
              </>
            ) : (
              <>
                <Text style={[styles.l, { color: colors.muted, fontFamily: FONT.regular }]}>
                  Icon
                </Text>
                <View style={styles.ig}>
                  {HABIT_ICONS.map((n) => {
                    const on = sheet.i === n;
                    return (
                      <Pressable
                        key={n}
                        onPress={() => patchSheet({ i: n })}
                        style={[
                          styles.igb,
                          { backgroundColor: on ? colors.text : colors.c2 },
                        ]}
                      >
                        <Icon name={n} size={22} color={on ? colors.bg : colors.muted} />
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[styles.l, { color: colors.muted, fontFamily: FONT.regular }]}>
                  Colour
                </Text>
                <View style={styles.sw}>
                  {HABIT_COLORS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => patchSheet({ c })}
                      style={[
                        styles.swb,
                        { backgroundColor: c, borderColor: sheet.c === c ? colors.text : 'transparent' },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.l, { color: colors.muted, fontFamily: FONT.regular }]}>
                  Repeats on
                </Text>
                <View style={styles.dys}>
                  {ORD.map((i) => {
                    const on = sheet.days.includes(i);
                    return (
                      <Pressable
                        key={i}
                        onPress={() => {
                          const days = on
                            ? sheet.days.filter((x) => x !== i)
                            : [...sheet.days, i];
                          patchSheet({ days });
                        }}
                        style={[
                          styles.dy,
                          { backgroundColor: on ? colors.a1 : colors.c2 },
                        ]}
                      >
                        <Text
                          style={{
                            color: on ? '#fff' : colors.muted,
                            fontFamily: FONT.semibold,
                          }}
                        >
                          {WD[i]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.sectionHeaderRow}>
                  <Icon name="bell" size={14} color={colors.muted} />
                  <Text style={[styles.l, { color: colors.muted, fontFamily: FONT.regular, marginTop: 0, marginBottom: 0 }]}>
                    Daily Reminder (optional)
                  </Text>
                </View>
                <ReminderPicker
                  value={sheet.reminder}
                  presets={['07:00', '09:00', '13:00', '20:00']}
                  onChange={(val) => patchSheet({ reminder: val })}
                  placeholder="Daily at (HH:MM)"
                />
              </>
            )}
            <View style={styles.acts}>
              {editing ? (
                <Pressable
                  onPress={() => {
                    void warningHaptic();
                    void deleteSheet();
                  }}
                  style={[styles.ghost, { backgroundColor: colors.c2 }]}
                >
                  <Text style={{ color: colors.a1, fontFamily: FONT.extra, fontSize: 16 }}>
                    Delete
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => {
                  void saveSheet().then((ok) => {
                    if (ok) {
                      void successHaptic();
                    } else {
                      void warningHaptic();
                      inputRef.current?.focus();
                    }
                  });
                }}
                style={styles.priHit}
              >
                <LinearGradient
                  colors={[colors.a1, colors.a2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pri}
                >
                  <Text style={{ color: '#fff', fontFamily: FONT.extra, fontSize: 16 }}>
                    Save
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Seg({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        void lightHaptic();
        onPress();
      }}
      style={[styles.segBtn, on && { backgroundColor: colors.text }]}
    >
      <Text
        style={{
          color: on ? colors.bg : colors.muted,
          fontFamily: FONT.semibold,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        void lightHaptic();
        onPress();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.text : colors.card,
          borderColor: colors.ln,
        },
      ]}
    >
      <Text
        style={{
          color: active ? colors.bg : colors.text,
          fontFamily: active ? FONT.semibold : FONT.regular,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ReminderPicker({
  value,
  presets,
  onChange,
  placeholder = 'Custom (HH:MM)',
}: {
  value: string | null;
  presets: string[];
  onChange: (val: string | null) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const [customText, setCustomText] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (value) {
      void getNotificationPermissionStatus().then((granted) => {
        setPermissionDenied(!granted);
      });
    } else {
      setPermissionDenied(false);
    }
  }, [value]);

  const handleSelectTime = async (time: string | null) => {
    onChange(time);
    setCustomText('');
    if (time) {
      const granted = await requestNotificationPermission();
      setPermissionDenied(!granted);
    } else {
      setPermissionDenied(false);
    }
  };

  const handleCustomChange = async (text: string) => {
    setCustomText(text);
    const trimmed = text.trim();
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(trimmed)) {
      const [h, m] = trimmed.split(':');
      const formatted = `${h.padStart(2, '0')}:${m}`;
      onChange(formatted);
      const granted = await requestNotificationPermission();
      setPermissionDenied(!granted);
    } else if (trimmed === '') {
      onChange(null);
      setPermissionDenied(false);
    }
  };

  return (
    <View style={styles.remContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Chip
          label="Off"
          active={!value}
          onPress={() => void handleSelectTime(null)}
        />
        {presets.map((time) => (
          <Chip
            key={time}
            label={time}
            active={value === time}
            onPress={() => void handleSelectTime(time)}
          />
        ))}
      </ScrollView>

      <View style={styles.remInputRow}>
        <TextInput
          value={customText}
          onChangeText={(txt) => void handleCustomChange(txt)}
          placeholder={value ? `Set: ${value} (type HH:MM to change)` : placeholder}
          placeholderTextColor={colors.muted}
          maxLength={5}
          keyboardType="numbers-and-punctuation"
          style={[
            styles.remInput,
            {
              backgroundColor: colors.c2,
              color: colors.text,
              fontFamily: FONT.regular,
            },
          ]}
        />
        {value ? (
          <Pressable
            onPress={() => {
              void lightHaptic();
              void handleSelectTime(null);
            }}
            style={[styles.remClearBtn, { backgroundColor: colors.c2 }]}
          >
            <Text style={{ color: colors.a1, fontFamily: FONT.semibold, fontSize: 13 }}>
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>

      {permissionDenied && (
        <Text style={[styles.permNotice, { color: colors.a1, fontFamily: FONT.regular }]}>
          Notification permission is required for reminders to ring.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0007',
  },
  kav: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 18,
    paddingTop: 12,
    maxHeight: '90%',
    borderWidth: 1,
  },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 9,
    alignSelf: 'center',
    marginBottom: 12,
  },
  input: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    fontSize: 17,
  },
  l: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 6,
    marginHorizontal: 2,
  },
  seg: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
  },
  chips: {
    gap: 6,
    paddingBottom: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 99,
    borderWidth: 1,
    marginRight: 6,
  },
  calHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  calWd: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 4,
  },
  calDay: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  ig: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  igb: {
    width: '14.5%',
    flexGrow: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sw: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  swb: {
    width: 36,
    height: 36,
    borderRadius: 99,
    borderWidth: 3,
  },
  dys: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  dy: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acts: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  ghost: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 18,
    justifyContent: 'center',
  },
  priHit: {
    flex: 1,
  },
  pri: {
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
    marginHorizontal: 2,
  },
  remContainer: {
    marginBottom: 12,
  },
  remInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  remInput: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  remClearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  permNotice: {
    fontSize: 12,
    marginTop: 6,
    marginHorizontal: 4,
    lineHeight: 16,
  },
});
