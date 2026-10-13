import React from 'react';
import {
  FlexWidget,
  TextWidget,
  SvgWidget,
} from 'react-native-android-widget';

/* ──────────── colours ──────────── */
const BG = '#151022';
const CARD = '#1f1830';
const MUTED = '#9d93b8';
const TEXT = '#f5f1ff';
const A1 = '#ff7a45';
const CHECK_ON = '#3ddc97';
const BORDER = '#2b2242';

/* ──────────── SVG paths ──────────── */
const CHECK_PATH = 'M5 12.5l4.5 4.5L19 7.5';
const FLAME_PATH =
  'M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 1.5 1.5 2 2 2 0-3-1-5 1-8z';
const ORB_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="${A1}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/></svg>`;

/* ──────────── types ──────────── */
export type WidgetData = {
  habits: {
    id: string;
    name: string;
    color: string;
    done: boolean;
    streak: number;
  }[];
  tasks: {
    id: string;
    title: string;
    done: boolean;
    priority: number;
  }[];
};

/* ──────────── helpers ──────────── */
function priorityColor(p: number): string {
  if (p === 2) return A1;
  if (p === 1) return '#8f9bff';
  return MUTED;
}

/* ──────────── tick box ──────────── */
function TickIcon({ on, color }: { on: boolean; color: string }) {
  return (
    <FlexWidget
      style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: on ? (color as `#${string}`) : '#4a3f66',
        backgroundColor: on ? (color as `#${string}`) : 'transparent' as unknown as `#${string}`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {on && (
        <SvgWidget
          svg={`<svg viewBox="0 0 24 24" fill="none" stroke="${BG}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="${CHECK_PATH}"/></svg>`}
          style={{ width: 12, height: 12 }}
        />
      )}
    </FlexWidget>
  );
}

/* ──────────── habit item ──────────── */
function HabitItem({
  name,
  color,
  done,
  streak,
  habitId,
}: {
  name: string;
  color: string;
  done: boolean;
  streak: number;
  habitId: string;
}) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        flexGap: 10,
        paddingHorizontal: 10,
        paddingVertical: 7,
        backgroundColor: CARD,
        borderRadius: 14,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: BORDER,
      }}
      clickAction="TOGGLE_HABIT"
      clickActionData={{ habitId }}
    >
      <TickIcon on={done} color={color} />
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget
          text={name}
          style={{
            fontSize: 13,
            color: TEXT,
            fontWeight: '600',
          }}
          maxLines={1}
          truncate="END"
        />
        {streak > 0 && (
          <FlexWidget
            style={{ flexDirection: 'row', alignItems: 'center', flexGap: 3, marginTop: 1 }}
          >
            <SvgWidget
              svg={`<svg viewBox="0 0 24 24" fill="none" stroke="${A1}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${FLAME_PATH}"/></svg>`}
              style={{ width: 10, height: 10 }}
            />
            <TextWidget
              text={`${streak}`}
              style={{ fontSize: 10, color: MUTED }}
            />
          </FlexWidget>
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

/* ──────────── task item ──────────── */
function TaskItem({
  title,
  done,
  priority,
  taskId,
}: {
  title: string;
  done: boolean;
  priority: number;
  taskId: string;
}) {
  const c = priorityColor(priority);
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        flexGap: 10,
        paddingHorizontal: 10,
        paddingVertical: 7,
        backgroundColor: CARD,
        borderRadius: 14,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: BORDER,
      }}
      clickAction="TOGGLE_TASK"
      clickActionData={{ taskId }}
    >
      <TickIcon on={done} color={c} />
      <TextWidget
        text={title}
        style={{
          fontSize: 13,
          color: done ? MUTED : TEXT,
          fontWeight: '600',
        }}
        maxLines={1}
        truncate="END"
      />
    </FlexWidget>
  );
}

/* ──────────── main widget ──────────── */
export function OrbitTodayWidget({ data }: { data: WidgetData }) {
  const total = data.habits.length + data.tasks.length;
  const doneCount =
    data.habits.filter((h) => h.done).length +
    data.tasks.filter((t) => t.done).length;
  const allDone = total > 0 && doneCount === total;

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: BG,
        borderRadius: 24,
        padding: 12,
      }}
      clickAction="OPEN_APP"
    >
      {/* header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          width: 'match_parent',
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', flexGap: 6 }}>
          <SvgWidget svg={ORB_SVG} style={{ width: 16, height: 16 }} />
          <TextWidget
            text="orbit"
            style={{ fontSize: 14, color: TEXT, fontWeight: '700' }}
          />
        </FlexWidget>
        <TextWidget
          text={allDone ? '✓ done' : `${doneCount}/${total}`}
          style={{ fontSize: 11, color: allDone ? CHECK_ON : MUTED }}
        />
      </FlexWidget>

      {/* items */}
      {data.habits.map((h) => (
        <HabitItem
          key={h.id}
          habitId={h.id}
          name={h.name}
          color={h.color}
          done={h.done}
          streak={h.streak}
        />
      ))}
      {data.tasks.map((t) => (
        <TaskItem
          key={t.id}
          taskId={t.id}
          title={t.title}
          done={t.done}
          priority={t.priority}
        />
      ))}
      {total === 0 && (
        <FlexWidget
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TextWidget
            text="Your orbit is clear"
            style={{ fontSize: 13, color: MUTED }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
