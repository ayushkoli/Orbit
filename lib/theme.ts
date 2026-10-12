import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

export type ThemePresetId =
  | 'dark-orbit'
  | 'dark-oled'
  | 'dark-aurora'
  | 'light-orbit'
  | 'light-minimal'
  | 'light-sand';

export type ThemeName = 'light' | 'dark';
export type ThemeMode = 'system' | 'light' | 'dark' | ThemePresetId;

export type Palette = {
  id: ThemePresetId;
  name: string;
  desc: string;
  scheme: ThemeName;
  bg: string;
  card: string;
  c2: string;
  text: string;
  muted: string;
  a1: string;
  a2: string;
  a3: string;
  ln: string;
  sh: string;
  glass: string;
  glassBorder: string;
};

export const THEME_PRESETS: Record<ThemePresetId, Palette> = {
  'dark-orbit': {
    id: 'dark-orbit',
    name: 'Midnight Orbit',
    desc: 'Violet obsidian & neon accents',
    scheme: 'dark',
    bg: '#151022',
    card: '#1f1830',
    c2: '#2b2242',
    text: '#f5f1ff',
    muted: '#9d93b8',
    a1: '#ff7a45',
    a2: '#8f9bff',
    a3: '#5ee0b5',
    ln: '#ffffff14',
    sh: '#00000099',
    glass: '#1f1830cc',
    glassBorder: 'rgba(255, 255, 255, 0.15)',
  },
  'dark-oled': {
    id: 'dark-oled',
    name: 'Deep Space OLED',
    desc: 'Pitch black & electric cyan',
    scheme: 'dark',
    bg: '#000000',
    card: '#111116',
    c2: '#1d1d26',
    text: '#ffffff',
    muted: '#8e8ea0',
    a1: '#00f0ff',
    a2: '#ff5e3a',
    a3: '#00e676',
    ln: '#ffffff1f',
    sh: '#000000',
    glass: '#111116cc',
    glassBorder: 'rgba(255, 255, 255, 0.18)',
  },
  'dark-aurora': {
    id: 'dark-aurora',
    name: 'Aurora Slate',
    desc: 'Nordic midnight & boreal emerald',
    scheme: 'dark',
    bg: '#09131c',
    card: '#122232',
    c2: '#1b3147',
    text: '#f0fdf4',
    muted: '#7fa6bd',
    a1: '#2dd4bf',
    a2: '#38bdf8',
    a3: '#facc15',
    ln: '#ffffff14',
    sh: '#00000088',
    glass: '#122232cc',
    glassBorder: 'rgba(255, 255, 255, 0.14)',
  },
  'light-orbit': {
    id: 'light-orbit',
    name: 'Lavender Pearl',
    desc: 'Soft lilac & vibrant tangerine',
    scheme: 'light',
    bg: '#f4f1fa',
    card: '#ffffff',
    c2: '#e9e5f5',
    text: '#1c1527',
    muted: '#6f6a85',
    a1: '#ff6a33',
    a2: '#6a73ff',
    a3: '#12b886',
    ln: '#1b152614',
    sh: '#3a2a7a30',
    glass: '#ffffffcc',
    glassBorder: 'rgba(255, 255, 255, 0.75)',
  },
  'light-minimal': {
    id: 'light-minimal',
    name: 'Pure Snow',
    desc: 'Minimalist silver & iOS blue',
    scheme: 'light',
    bg: '#f2f4f8',
    card: '#ffffff',
    c2: '#e3e7ee',
    text: '#0f172a',
    muted: '#64748b',
    a1: '#007aff',
    a2: '#6366f1',
    a3: '#10b981',
    ln: '#0f172a14',
    sh: '#0f172a1a',
    glass: '#ffffffd4',
    glassBorder: 'rgba(255, 255, 255, 0.85)',
  },
  'light-sand': {
    id: 'light-sand',
    name: 'Warm Sand',
    desc: 'Champagne linen & terracotta',
    scheme: 'light',
    bg: '#faf5ed',
    card: '#ffffff',
    c2: '#f2e9dc',
    text: '#292524',
    muted: '#78716c',
    a1: '#ea580c',
    a2: '#d97706',
    a3: '#16a34a',
    ln: '#29252414',
    sh: '#443a2824',
    glass: '#ffffffd4',
    glassBorder: 'rgba(255, 255, 255, 0.78)',
  },
};

export const DARK_PRESETS: Palette[] = [
  THEME_PRESETS['dark-orbit'],
  THEME_PRESETS['dark-oled'],
  THEME_PRESETS['dark-aurora'],
];

export const LIGHT_PRESETS: Palette[] = [
  THEME_PRESETS['light-orbit'],
  THEME_PRESETS['light-minimal'],
  THEME_PRESETS['light-sand'],
];

export const palettes: Record<ThemeName, Palette> = {
  light: THEME_PRESETS['light-orbit'],
  dark: THEME_PRESETS['dark-orbit'],
};

export const HABIT_COLORS = [
  '#ff2d3f', // Bright Red
  '#ff6b6b', // Coral Red
  '#ff8e53', // Tangerine
  '#ffc145', // Honey Gold
  '#a3d95b', // Lime Leaf
  '#34d399', // Mint
  '#2dd4bf', // Teal
  '#38bdf8', // Sky
  '#60a5fa', // Cornflower
  '#818cf8', // Periwinkle
  '#a78bfa', // Lavender
  '#c084fc', // Orchid
  '#f472b6', // Bubblegum Pink
  '#fb7185', // Rose
] as const;

export const FONT = {
  regular: 'BricolageGrotesque_400Regular',
  semibold: 'BricolageGrotesque_600SemiBold',
  extra: 'BricolageGrotesque_800ExtraBold',
} as const;

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

export function withAlpha(hex: string, a: number): string {
  if (hex.startsWith('rgba(')) {
    return hex.replace(/[\d\.]+\)$/, `${Math.min(1, Math.max(0, a))})`);
  }
  const { r, g, b } = parseHex(hex);
  const alpha = Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}${alpha}`;
}

export function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[m(pa.r, pb.r), m(pa.g, pb.g), m(pa.b, pb.b)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`;
}

export function resolvePalette(
  mode: ThemeMode,
  systemScheme: unknown,
): Palette {
  if (mode in THEME_PRESETS) {
    return THEME_PRESETS[mode as ThemePresetId];
  }
  if (mode === 'dark') return THEME_PRESETS['dark-orbit'];
  if (mode === 'light') return THEME_PRESETS['light-orbit'];
  const sys = systemScheme === 'dark' ? 'dark' : 'light';
  return sys === 'dark' ? THEME_PRESETS['dark-orbit'] : THEME_PRESETS['light-orbit'];
}

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: ThemeName;
  colors: Palette;
  preset: Palette;
  progress: number;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  mode = 'system',
  progress = 0,
}: {
  children: ReactNode;
  mode?: ThemeMode;
  progress?: number;
}) {
  const system = useSystemColorScheme();
  const palette = useMemo(() => resolvePalette(mode, system), [mode, system]);
  const scheme = palette.scheme;

  const value = useMemo(
    () => ({
      mode,
      scheme,
      colors: palette,
      preset: palette,
      progress,
    }),
    [mode, scheme, palette, progress],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

export function useResolvedScheme(mode: ThemeMode): ThemeName {
  const system = useSystemColorScheme();
  return resolvePalette(mode, system).scheme;
}
