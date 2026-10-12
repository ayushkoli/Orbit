# Orbit — Project Context, Architecture & Developer Guide

Welcome to **Orbit**! This document provides a complete overview of the codebase, project architecture, data flow, component hierarchy, and guidelines for human developers and AI assistants working on this repository.

---

## 1. Project Overview & Philosophy

**Orbit** is a high-performance, local-first habit and task tracking mobile application built with **React Native**, **Expo SDK 57**, and **Expo Router**.

### Core Pillars
- **Local-First & Private**: All data is stored in an embedded SQLite database on the device. No cloud account or external servers required. Backups can be exported and imported as JSON.
- **iOS-Grade Polish**: Features frosted glassmorphism (`expo-blur`), tactile haptics (`expo-haptics`), spring physics (`react-native-reanimated`), and custom SVG charts.
- **Dynamic Theming**: 6 curated presets (3 dark, 3 light) with live persistence.
- **Consistency Visualizers**: Daily 3-ring completion Orb, 7-day week strips with week-by-week navigation, 7-box weekly habit views, 18-week GitHub-style contribution heatmaps with month hints, 7/30/90-day area charts, and an interactive monthly activity calendar in Stats.

---

## 2. Tech Stack & Key Libraries

| Technology | Purpose |
|---|---|
| **Expo SDK 57** / **React Native 0.86** / **React 19** | Core mobile runtime and framework |
| **Expo Router (`~57.0.26`)** | File-based routing (`app/` directory) |
| **Zustand (`^5.0.15`)** | Lightweight global state management (`store/useStore.ts`) |
| **Expo SQLite (`~57.0.4`)** | Embedded SQL storage for tasks, habits, logs, and settings |
| **React Native Reanimated (`4.5.1`)** | Native-driven 60/120fps spring physics and layout animations |
| **React Native SVG (`15.15.4`)** | Custom geometric vector graphics (Orb rings, Area chart, glyph icons) |
| **Expo Blur (`~57.0.3`)** | Real-time glassmorphism and frosted backdrops |
| **Expo Haptics (`~57.0.3`)** | Tactile vibration feedback (light, medium, success, warning) |
| **Expo Linear Gradient (`~57.0.2`)** | Ambient mesh glows, card accents, and buttons |
| **Bricolage Grotesque** | Google font family (Regular 400, SemiBold 600, ExtraBold 800) |

---

## 3. Directory Structure

```text
orbit/
├── app/                      # Expo Router screens & navigation
│   ├── _layout.tsx           # Root layout: font loading, theme provider, global modals
│   ├── +not-found.tsx        # 404 fallback screen
│   ├── +html.tsx             # Web entry template
│   └── (tabs)/               # Bottom tab navigator group
│       ├── _layout.tsx       # Bottom tabs declaration with custom TabBar
│       ├── index.tsx         # "Today" screen (Orb, week strip, today's habits & tasks)
│       ├── tasks.tsx         # "Tasks" screen (filter chips, task list)
│       ├── habits.tsx        # "Habits" screen (7-box view / 18-week heatmap switcher)
│       └── stats.tsx         # "Stats" screen (Trends area chart & Activity calendar)
├── components/               # Reusable UI & visual components
│   ├── AreaChart.tsx         # Bounded SVG area chart with interactive touch scrubber
│   ├── CelebrationBanner.tsx # Minimal completion badge displaying "Done for the Day"
│   ├── EmptyState.tsx        # Rich dynamic empty state with quick action buttons
│   ├── HabitCard.tsx         # Habit card with 7-day checkboxes, Edit button & optional heatmap
│   ├── HabitRow.tsx          # Compact habit row for Today screen
│   ├── Heatmap.tsx           # 18-week GitHub-style heatmap with month hints & legend
│   ├── Icon.tsx              # Vector glyph icons (SVG-based)
│   ├── Orb.tsx               # Concentric SVG 3-ring progress visualization
│   ├── ProfileButton.tsx     # Top-right frosted avatar button with monogram initial
│   ├── ProfileModal.tsx      # Modal bottom sheet for name editing, 6 themes & backups
│   ├── Sheet.tsx             # Create & edit modal sheet for tasks and habits with reminders
│   ├── StatsCalendar.tsx     # Full interactive monthly calendar heatmap in Stats
│   ├── TabBar.tsx            # Floating glassmorphic bottom nav with spring sliding pill
│   ├── TaskRow.tsx           # Task row with priority styling, reminder badge & animated tickbox
│   └── WeekStrip.tsx         # 7-day strip with week navigation arrows (‹ / ›)
├── constants/                # Project constants
├── db/                       # Local-first persistence layer
│   ├── client.ts             # SQLite connection singleton (`orbit.db`)
│   ├── migrations.ts         # Schema migrations (v2: added reminder columns)
│   └── repo.ts               # CRUD queries, meta store, seed data, and JSON export/import
├── lib/                      # Core business logic & utilities
│   ├── date.ts               # Local calendar date utils (YYYY-MM-DD, week keys, months)
│   ├── haptics.ts            # Haptic vibration wrappers (currently silenced as requested)
│   ├── notifications.ts      # Local scheduled notifications for tasks & daily habits
│   ├── stats.ts              # Aggregations, completion totals, streak math, chart layout
│   ├── streak.ts             # Consecutive day streak calculators (current & best)
│   └── theme.ts              # 6 theme presets (3 dark, 3 light), palettes, ThemeProvider
├── store/                    # State management
│   └── useStore.ts           # Unified Zustand store for data, UI modals, and actions
├── __tests__/                # Jest unit test suites
│   ├── date.test.ts          # Date math & key tests
│   ├── stats.test.ts         # Calculation & completion rate tests
│   └── streak.test.ts        # Streak algorithms verification
├── AGENTS.md                 # Rules & guidance for coding assistants
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript compiler configuration
```

---

## 4. Key Architectural Patterns & Data Flow

### A. Local Calendar Date Handling (`lib/date.ts`)
* **Strict Rule**: All dates representing calendar days are formatted as `YYYY-MM-DD` strings (e.g., `"2026-10-12"`).
* **Never use UTC ISO strings** for calendar calculations (e.g. `d.toISOString()` will cause timezone date-shifting bugs). Use `toDateKey(date)`, `today()`, `addDays(key, n)`, and `parseLocalDate(key)`.

### B. Database Schema (`db/migrations.ts` & `db/repo.ts`)
The app uses SQLite (`orbit.db`):
- `tasks`: `(id, title, priority, due, tag, done, done_at, created_at, reminder)`
- `habits`: `(id, name, icon, color, days, created_at, reminder)` — where `days` is a JSON array of active weekdays `[0..6]`.
- `habit_logs`: `(habit_id, date)` — composite primary key recording completions on specific dates.
- `meta`: `(key, value)` — key-value store used for theme presets and seeding flags.

### C. State Management (`store/useStore.ts`)
The single Zustand store orchestrates:
- Hydration on launch (`hydrate()` loads SQLite snapshot into memory and calls `reconcileReminders()`).
- Optimistic state updates with immediate background persistence (`updateTask`, `addLog`, etc.).
- Sheet and modal state (`sheet` for task/habit editor, `profileOpen` for theme modal).
- Quick completion animations (`popId` temporary indicator).

### D. Local Scheduled Reminders Engine (`lib/notifications.ts`)
- **Android APK Ready**: Guarded from Expo Go (`isExpoGo()`). Runs in standalone/preview APKs.
- **Dedicated Channel**: Android notification channel `orbit-reminders` with `HIGH` importance.
- **Task Reminders**: Exact date triggers (`SchedulableTriggerInputTypes.DATE`) with past-time skipping.
- **Habit Reminders**: Daily triggers for 7-day habits, or weekly triggers (`SchedulableTriggerInputTypes.WEEKLY`) for specific active weekdays.
- **Full Lifecycle**: Editing, completing, or deleting tasks/habits updates notifications in sync. App launch and backup restore reconcile all reminders against SQLite and cancel orphans.
- **Permissions**: Lazy check and request on reminder creation, non-blocking UI notice if denied.

### D. Theming Engine (`lib/theme.ts`)
Six handcrafted palettes:
- **Dark Presets**:
  1. `dark-orbit` (Midnight Orbit): Flagship dark violet obsidian with neon accents.
  2. `dark-oled` (Deep Space OLED): Pure `#000000` pitch black with electric cyan.
  3. `dark-aurora` (Aurora Slate): Nordic midnight with boreal teal and sky blue.
- **Light Presets**:
  1. `light-orbit` (Lavender Pearl): Soft lilac with tangerine and indigo.
  2. `light-minimal` (Pure Snow): Minimalist silver-white with iOS royal blue.
  3. `light-sand` (Warm Sand): Champagne linen with terracotta and sage.

Each palette exports `bg`, `card`, `c2`, `text`, `muted`, `a1`, `a2`, `a3`, `ln`, `sh`, `glass`, and `glassBorder`.

---

## 5. Screen-by-Screen Breakdown

### 1. Today Screen (`app/(tabs)/index.tsx`)
- **Top Header**: Personalized greeting ("Good morning, [Name]" / "Good afternoon, [Name]" / "Good evening, [Name]" based on the user's configured name, or "Viewing" on other dates), localized date heading, and top-right `ProfileButton`.
- **Week Strip (`components/WeekStrip.tsx`)**:
  - Displays Monday–Sunday pills with completion dots.
  - Features **`‹` and `›` arrows** allowing the user to navigate to past or future weeks right on the Today screen.
  - Features a **"Back to Today"** button when browsing other weeks.
- **The Orb (`components/Orb.tsx`) & 100% Celebration (`components/CelebrationBanner.tsx`)**:
  - Animated 3-ring SVG graphic representing overall %, task %, and habit % for the selected day.
  - When all habits and tasks for today are 100% complete, a glowing **Celebration Card** appears celebrating the achievement with animated sparkle badge and perfect-score pill.
- **Habit & Task Lists**:
  - Shows items due on that day. Past and present items can be checked/unchecked.
  - When no habits or tasks are due on that day, displays the rich **Empty State Card** (`components/EmptyState.tsx`) with quick `+ Add Task` and `+ New Habit` buttons.

### 2. Tasks Screen (`app/(tabs)/tasks.tsx`)
- Filter chips: `All open`, `Today`, `Upcoming`, `Done`.
- Priority-coded task cards with due dates, tags, optional reminder bell indicators (`🔔 09:00`), and tickbox animations.
- Contextual rich **Empty State Card** with quick `+ Add Task` button when no tasks match the filter.
- Top-right `ProfileButton`.

### 3. Habits Screen (`app/(tabs)/habits.tsx`)
- **View Mode Switcher**:
  - `Weekly`: Clean, compact 7-day checkboxes with SVG icon.
  - `Heatmap`: Expanded view displaying the 18-week contribution heatmap with month hints (`Jun`, `Jul`, `Aug`, etc.), intensity legend, and SVG icon.
- **Habit Card Header**:
  - Displays habit title, current and best streaks, optional daily reminder time (`🔔 08:00`), and a dedicated **`Edit`** button to re-edit the habit.
- Contextual rich **Empty State Card** with `+ New Habit` button when no habits exist.
- Tapping any day cell up to today marks or unmarks the habit log.

### 4. Stats Screen (`app/(tabs)/stats.tsx`)
- **iOS Segmented Switcher**:
  - `Chart`:
    - 7 / 30 / 90 days selector chips with SVG chart icon.
    - `AreaChart.tsx`: Bounded SVG chart that stays strictly within the card, featuring an interactive touch scrubber showing date and completion %.
    - Metric summary cards (Average, Longest streak, Tasks done, Active habits).
    - Progress bars per habit.
  - `Calendar` (`components/StatsCalendar.tsx`):
    - Full monthly heatmap grid with completion color coding (100% days, 50-99%, 1-49%, 0%) with SVG calendar icon.
    - Month navigation (`‹` / `›` / "Current").
    - Monthly summary stats (Month average %, 100% perfect days, logged days).
    - Interactive day inspector: tap any day to inspect its habits and tasks.

### 5. Navigation Bar (`components/TabBar.tsx`)
- Floating glassmorphic bar using `BlurView` (`intensity=85`), frosted backdrop, and specular border highlight.
- Smooth **iPhone-like sliding pill indicator** that glides under the active tab using Reanimated spring physics (`withSpring`).
- Center Add button with spring bounce and glowing gradient.

### 6. Profile & Settings Modal (`components/ProfileModal.tsx`)
- Triggered by `ProfileButton.tsx` in the top right of any screen (displays the user's initial monogram).
- Minimalist, professional iOS Settings-style layout:
  - Editable display name with instant SQLite persistence.
  - Clean Dark / Light segmented selector with live color swatches across all 6 presets.
  - Grouped JSON backup export and restore actions.

---

## 6. Critical Rules for Future Developers & AI Assistants

1. **Avoid `transform: undefined` in styles**:
   - In React Native, passing `transform: condition ? [{ scale: 1 }] : undefined` can cause internal stylesheet diffing to pass `transform = null` to `processTransform.js`, triggering `TypeError: Cannot read property 'forEach' of null`.
   - **Solution**: Always use conditional StyleSheet entries like `condition && styles.myTransform`, or use Reanimated's `useAnimatedStyle`.

2. **Never edit `android/` or `ios/` folders**:
   - The app uses Expo Continuous Native Generation (CNG). Configure native settings in `app.json`.

3. **Install dependencies through Expo CLI**:
   - Always run `npx expo install <package>` rather than `npm install <package>` to guarantee compatibility with SDK 57.

4. **Verify before finishing tasks**:
   - Typecheck: `npx tsc --noEmit`
   - Test suite: `npx jest`
   - Dependency health: `npx expo-doctor`
   *(On Windows PowerShell, use `npx.cmd` if PowerShell execution policy restricts script wrappers).*

5. **Local Date Math**:
   - Always import date helpers from `@/lib/date`. Do not parse dates with bare `new Date("YYYY-MM-DD")` as browsers and native engines treat that as UTC midnight. Use `parseLocalDate(key)`.

---

## 7. Useful Terminal Commands

```bash
# Start development server
npx expo start

# Run TypeScript typechecker
npx.cmd tsc --noEmit

# Run Jest unit tests
npx.cmd jest

# Run Expo Doctor dependency & config checks
npx.cmd expo-doctor

# Fix package patch mismatches
npx.cmd expo install --fix
```
