import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { ProfileModal } from '@/components/ProfileModal';
import { Sheet } from '@/components/Sheet';
import { today } from '@/lib/date';
import { initNotifications } from '@/lib/notifications';
import { attachLogs, dayOrbStats } from '@/lib/stats';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { useStore } from '@/store/useStore';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_800ExtraBold,
  });
  const ready = useStore((s) => s.ready);
  const hydrate = useStore((s) => s.hydrate);
  const themeMode = useStore((s) => s.themeMode);
  const habits = useStore((s) => s.habits);
  const tasks = useStore((s) => s.tasks);
  const logs = useStore((s) => s.logs);
  const selectedDate = useStore((s) => s.selectedDate);
  const [bootError, setBootError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    void initNotifications();
  }, []);

  useEffect(() => {
    void hydrate().catch((e: unknown) => {
      setBootError(e instanceof Error ? e : new Error(String(e)));
    });
  }, [hydrate]);

  useEffect(() => {
    if (loaded && ready) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, ready]);

  const progress = useMemo(() => {
    const td = today();
    return dayOrbStats(attachLogs(habits, logs), tasks, selectedDate, td).overall;
  }, [habits, logs, tasks, selectedDate]);

  if (bootError) throw bootError;
  if (!loaded || !ready) return null;

  return (
    <ThemeProvider mode={themeMode} progress={progress}>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { colors, scheme, progress } = useTheme();
  const glowOpacity = 0.12 + progress * 0.3;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View pointerEvents="none" style={[styles.mesh, { opacity: glowOpacity }]}>
        <LinearGradient
          colors={[colors.a1, 'transparent']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.55, y: 0.45 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', colors.a2]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 0.35 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      <Sheet />
      <ProfileModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mesh: {
    ...StyleSheet.absoluteFill,
  },
});
