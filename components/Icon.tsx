import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export const HABIT_ICONS = [
  'drop',
  'dumb',
  'code',
  'book',
  'moon',
  'bolt',
  'heart',
  'leaf',
  'cup',
  'pen',
  'sun',
  'music',
  'bike',
  'run',
  'walk',
  'target',
  'wallet',
  'nobeer',
  'nocig',
  'nophone',
  'study',
] as const;

export type HabitIconName = (typeof HABIT_ICONS)[number];

export type IconName =
  | HabitIconName
  | 'flame'
  | 'check'
  | 'plus'
  | 'orb'
  | 'task'
  | 'loop'
  | 'bars'
  | 'bell'
  | 'sparkle'
  | 'chart'
  | 'calendar'
  | 'weekly'
  | 'grid'
  | 'user';

type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
};

function Glyph({ name }: { name: IconName }) {
  switch (name) {
    case 'drop':
      return (
        <Path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3z" />
      );
    case 'dumb':
      return <Path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />;
    case 'code':
      return <Path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />;
    case 'book':
      return (
        <Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5zM4 5.5v16" />
      );
    case 'moon':
      return <Path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />;
    case 'bolt':
      return <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
    case 'heart':
      return (
        <Path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />
      );
    case 'leaf':
      return <Path d="M17 8C8 10 5.9 16.2 4 21c7-1 12-4 13-13M17 8l4-4M17 8l-3 3" />;
    case 'cup':
      return (
        <Path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2" />
      );
    case 'pen':
      return (
        <Path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19zM14 7l3 3" />
      );
    case 'sun':
      return (
        <G>
          <Circle cx="12" cy="12" r="5" />
          <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </G>
      );
    case 'music':
      return (
        <G>
          <Path d="M9 18V6l10-2v12" />
          <Circle cx="7" cy="18" r="2.5" />
          <Circle cx="17" cy="16" r="2.5" />
        </G>
      );
    case 'bike':
      return (
        <G>
          <Circle cx="5.5" cy="16.5" r="3.5" />
          <Circle cx="18.5" cy="16.5" r="3.5" />
          <Path d="M5.5 16.5l4-7h5l4 7M9.5 9.5l3 7M8 6h3" />
        </G>
      );
    case 'run':
      return (
        <G>
          <Circle cx="15.5" cy="4.5" r="2" />
          <Path d="M14 8.5L11 14.5l4 2.5-1.5 4M11 14.5L7.5 18 4 17M14 9l3.5 2.5 2.5-2M14 9l-4-.5-2.5 3" />
        </G>
      );
    case 'walk':
      return (
        <G>
          <Circle cx="13" cy="4" r="2" />
          <Path d="M12.5 8.5L11 13l3 3-1 5M11 13l-2 8M12.5 9l3 2.5M12 9.5l-3 2" />
        </G>
      );
    case 'target':
      return (
        <G>
          <Circle cx="12" cy="12" r="9" />
          <Circle cx="12" cy="12" r="5" />
          <Circle cx="12" cy="12" r="1.5" />
        </G>
      );
    case 'wallet':
      return (
        <G>
          <Rect x="3" y="6" width="18" height="13" rx="2.5" />
          <Path d="M3 10h18M15 13.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0z" />
        </G>
      );
    case 'nobeer':
      return (
        <G>
          <Path d="M6 8h9v11H6zM15 10h2.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H15M6 8c0-2 2-3 4.5-3S15 6 15 8" />
          <Path d="M3 3l18 18" />
        </G>
      );
    case 'nocig':
      return (
        <G>
          <Path d="M3 15h13v3H3zM12 15v3M19 15v3M18 11c0-1.5 2-1.5 2-3.5" />
          <Path d="M3 3l18 18" />
        </G>
      );
    case 'nophone':
      return (
        <G>
          <Rect x="7" y="3" width="10" height="18" rx="2" />
          <Path d="M11 18h2" />
          <Path d="M3 3l18 18" />
        </G>
      );
    case 'study':
      return (
        <Path d="M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6" />
      );
    case 'flame':
      return (
        <Path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 1.5 1.5 2 2 2 0-3-1-5 1-8z" />
      );
    case 'check':
      return <Path d="M5 12.5l4.5 4.5L19 7.5" />;
    case 'plus':
      return <Path d="M12 5v14M5 12h14" />;
    case 'orb':
      return (
        <G>
          <Circle cx="12" cy="12" r="8" />
          <Circle cx="12" cy="12" r="3.5" />
        </G>
      );
    case 'task':
      return (
        <G>
          <Rect x="4" y="4" width="16" height="16" rx="5" />
          <Path d="M8.5 12l2.5 2.5 4.5-5" />
        </G>
      );
    case 'loop':
      return (
        <Path d="M4 11a8 8 0 0 1 14-4l2 2M20 4v5h-5M20 13a8 8 0 0 1-14 4l-2-2M4 20v-5h5" />
      );
    case 'bars':
      return <Path d="M5 20v-7M12 20V5M19 20v-10" />;
    case 'bell':
      return (
        <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
      );
    case 'sparkle':
      return (
        <Path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
      );
    case 'chart':
      return (
        <G>
          <Path d="M3 3v18h18" />
          <Path d="M7 15l4.5-5 3.5 3 6-7" />
        </G>
      );
    case 'calendar':
      return (
        <G>
          <Rect x="3" y="4" width="18" height="18" rx="3" />
          <Path d="M16 2v4M8 2v4M3 10h18" />
        </G>
      );
    case 'weekly':
      return (
        <G>
          <Rect x="3" y="7" width="4.8" height="10" rx="2" />
          <Rect x="9.6" y="7" width="4.8" height="10" rx="2" />
          <Rect x="16.2" y="7" width="4.8" height="10" rx="2" />
        </G>
      );
    case 'grid':
      return (
        <G>
          <Rect x="3" y="3" width="7" height="7" rx="1.5" />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" />
        </G>
      );
    case 'user':
      return (
        <G>
          <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </G>
      );
  }
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
  color = '#1b1526',
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Glyph name={name} />
    </Svg>
  );
}