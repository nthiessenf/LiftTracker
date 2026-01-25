# LiftTrack - Project Context & System Prompts

## 1. Project Overview
**LiftTrack** is a "Local First" React Native mobile application designed for planning, logging, and tracking gym workouts.
* **Core Philosophy:** 100% offline capability, zero latency, privacy-focused.
* **Key Mechanic:** Emphasizes progressive overload by referencing past performance during active sessions.
* **User Status:** The user is a non-technical Product Manager using Cursor AI to build the app.

## 2. Tech Stack
* **Framework:** React Native (Managed Workflow via Expo SDK ~54)
* **Language:** TypeScript
* **Navigation:** Expo Router (File-based routing)
* **Styling:** NativeWind (Tailwind CSS for React Native)
* **Data (Content):** `expo-sqlite` (Routines, Workouts, Sets)
* **Data (Prefs):** `AsyncStorage` (Simple settings like Weekly Goals, Onboarding flags, In-Progress Workouts)
* **Visualization:** 
  * `react-native-circular-progress-indicator` (Weekly Goal Ring)
  * `react-native-svg` (Timer countdown ring)
  * `react-native-body-highlighter` (Muscle Recovery Heatmap - planned)
  * `react-native-calendars` (History Calendar View)
  * `react-native-pager-view` (Swipeable onboarding screens)

## 3. Data Architecture (CRITICAL)
The app uses a **Hybrid Data Model**. You must understand where data lives to write correct code.

### A. Static Data (Code)
* **Source:** `data/exercises.ts`
* **Purpose:** Contains definitions (Names, Muscle Groups, Instructions, `primary_focus`).
* **Note:** There is **NO** exercises table in the DB. The DB stores string references (`exercise_id`) which are looked up in this file.

### B. Training Tracks (Code)
* **Source:** `data/tracks.ts`
* **Purpose:** Defines pre-built routine collections for onboarding (Full Body, Push/Pull/Legs, Upper/Lower).
* **Used by:** `seedDatabaseWithTrack()` in `data/database/db.ts` to populate routines during onboarding.
* **Note:** `seedDatabaseWithTrack()` now checks for existing routines before seeding to prevent duplicates.

### C. Routine Templates (Code)
* **Source:** `data/templates.ts`
* **Purpose:** Individual routine templates for the "Quick Add" gallery in routine creation.

### D. Dynamic Data (SQLite)
* **Source:** Local SQLite Database (`routines`, `routine_exercises`, `workouts`, `sets` tables).
* **Purpose:** Stores user-created routines, logs, and history.
* **Migration Status:** As of Jan 2026, the app uses a "Pure SQLite" architecture. Hardcoded JSON templates have been removed.

### E. In-Progress Workout State (AsyncStorage)
* **Key:** `IN_PROGRESS_WORKOUT`
* **Purpose:** Persists active workout state so users can resume if app closes mid-workout.
* **Cleared:** When workout is finished or cancelled.

### F. Database Schema
```sql
-- Table: routines
-- Stores user-defined workout plans.
CREATE TABLE routines (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_temporary INTEGER DEFAULT 0,
  track TEXT                      -- "FULL_BODY", "PPL", "UPPER_LOWER", or NULL for user-created
);

-- Table: routine_exercises
-- Links exercises to routines.
CREATE TABLE routine_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  routine_id TEXT NOT NULL,        -- FK to routines
  exercise_id TEXT NOT NULL,       -- String Ref to data/exercises.ts
  order_index INTEGER NOT NULL,
  FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
);

-- Table: workouts
-- History of completed sessions.
CREATE TABLE workouts (
  id TEXT PRIMARY KEY NOT NULL,
  date TEXT NOT NULL,              -- ISO String (YYYY-MM-DD)
  name TEXT,
  duration_seconds INTEGER,
  routine_id TEXT                  -- FK to routines (Added in Migration v2)
);

-- Table: sets
-- Individual performance logs.
CREATE TABLE sets (
  id TEXT PRIMARY KEY NOT NULL,
  workout_id TEXT NOT NULL,        -- FK to workouts
  exercise_id TEXT NOT NULL,       -- String Ref to data/exercises.ts
  weight REAL,
  reps REAL,
  completed INTEGER NOT NULL DEFAULT 0,  -- Boolean (0 or 1)
  timestamp TEXT,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);
```

**Key Points:**
* All IDs are `TEXT` (not INTEGER) - typically timestamp-based strings
* `exercise_id` is a string reference to `data/exercises.ts`, NOT a foreign key
* `is_temporary` flag distinguishes user-created routines from auto-generated ones
* `track` column links routines to their training track (NULL for user-created routines)
* Migrations are handled in `data/database/db.ts` via `migrateDbIfNeeded()`

## 4. Operational Rules for AI Assistant

### Precise Prompts
When generating code, provide step-by-step application instructions. Reference specific file paths and imports.

### Offline First
Never suggest Firebase, Supabase, or remote APIs. All features must work without internet.

### Data Safety
Always respect the "Source of Truth." Do not hardcode new routines in JSON; insert them into SQLite.

### Navigation Logic (Updated Jan 2026)
* **Dashboard (index.tsx):** Reflection & progress stats. Contains bridge CTA to Start tab.
* **Start (workouts.tsx):** THE place to begin any workout. Shows in-progress workout (if exists), recommendation, empty workout option, and routine list.
* **Library (library.tsx):** Exercise reference and knowledge base.
* **History (history.tsx):** Review and edit past workouts.
* **Settings (settings.tsx):** Backup, preferences, testing tools.

### Code Style
* **ALWAYS use functional components** (never class components)
* **NEVER leave the app in a broken state**
* Use TypeScript types consistently
* Follow existing patterns for database queries and state management

## 5. Current Feature Status (Jan 2026)

### Onboarding (`app/onboarding.tsx`)
* **4-screen swipeable flow** using `react-native-pager-view`
* **Screen 1 - Welcome:** App title, tagline, green gradient glow (reuses Dashboard pattern)
* **Screen 2 - Training Style:** Three track options (Full Body, PPL, Upper/Lower) with frequency nudges, skip option
* **Screen 3 - Weekly Goal:** Number picker (1-7, default 3)
* **Screen 4 - Confirmation:** Summary and "Start Training" button
* Uses `HAS_COMPLETED_ONBOARDING` in AsyncStorage to prevent loops
* **Saves `SELECTED_TRACK` to AsyncStorage** ("FULL_BODY", "PPL", "UPPER_LOWER", or "NONE" if skipped)
* Calls `seedDatabaseWithTrack()` to populate routines based on user selection
* Skip option allows users to start with empty routines (freestyle mode)
* **Duplicate prevention:** `seedDatabaseWithTrack()` checks for existing routines with matching track before inserting

### Dashboard (`app/(tabs)/index.tsx`)
* Green "Goal Ring" tracks weekly workouts with streak counter
* **Ring starts at 12 o'clock position** (rotation={0})
* Weekly Progress dots show workout status for current week
* Glass-morphism design with green gradient glow effect
* Simple bridge CTA at bottom: "Ready to train? Start a workout â†’" (links to Start tab)
* **Note:** Recommendation card removed - now lives on Start tab
* **Note:** Body heatmap feature planned for future

### Start Tab (`app/(tabs)/workouts.tsx`)
* **Tab renamed from "Workout" to "Start"**
* **"WORKOUT IN PROGRESS" card (orange)** appears at top when user has an abandoned workout:
  * Shows routine name and time since started
  * "Continue Workout" button (primary action)
  * "Discard workout" button (secondary)
  * Hides recommendation card when present (user should resume, not start new)
* **"Recommended for Today" card** (green) with:
  * Routine name, estimated duration, "last done X days ago" context
  * Green "Start" button (only primary CTA when no in-progress workout)
  * **Rotation logic:** Cycles through routines alphabetically (Aâ†’Bâ†’Aâ†’B), not longest-unused
* **Section structure with clear visual hierarchy:**
  * "TODAY'S RECOMMENDATION" label (green, uppercase)
  * "or" divider (lines with centered text)
  * "YOUR ROUTINES" label (green, uppercase)
* **"Start Empty Workout" card** with subtitle "Add exercises as you go", chevron (no button)
* **Routine cards** with chevrons (no Start buttons), sorted by last used then alphabetically
* **Recommended routine hidden from list** (no duplication)
* **Track-based recommendations (Updated Jan 20, 2026):**
  * Reads `SELECTED_TRACK` from AsyncStorage to determine which routines to recommend
  * Only cycles through routines belonging to the user's selected track
  * FULL_BODY: Full Body A → Full Body B → Full Body A...
  * PPL: Push Day → Pull Day → Legs Day → Push Day...
  * UPPER_LOWER: Upper A → Lower A → Upper A...
* **Freestyle mode:** Users who skipped track selection (`SELECTED_TRACK = "NONE"`) see no recommendation card
* **Celebration state:** After completing the recommended workout:
  * Recommendation card replaced with "You crushed it!" celebration card
  * Shows until the next calendar day (resets at midnight)
  * Uses `LAST_COMPLETED_RECOMMENDATION_DATE` in AsyncStorage (YYYY-MM-DD format)
* **User-created routines** (track = NULL) appear in "YOUR ROUTINES" but never in recommendations

### Active Session (`app/session/active.tsx`)
* Smart Pre-fill: Queries SQLite for the last session of that specific exercise to fill weight/reps
* **Add Set auto-fill:** New sets auto-populate with weight/reps from previous set in same session
* **Remove sets:** Users can delete sets before finishing workout (X button on each set row)
* **Auto-remove empty exercises:** When all sets are deleted from an exercise, the exercise card is removed
* Saves `routine_id` to history to maintain lineage
* Supports temporary routines (can be saved after completion)
* **Workout state persistence:** Saves to AsyncStorage on every change for resume capability
* Clears saved state on finish or cancel

### Rest Timer (`app/session/timer.tsx`)
* **Full-screen dedicated timer page** (replaced overlay modal)
* Large countdown display (MM:SS format)
* **Circular countdown ring** using react-native-svg that depletes as time runs out
* "Skip" button to end early
* Auto-returns to active session when timer completes
* Vibration alert on completion

### Library (`app/(tabs)/library.tsx`)
* Hybrid view: Shows static instructions + MAX(weight) from history
* Exercise detail view (`app/library/[id].tsx`) shows Personal Records
* Category filtering

### History (`app/(tabs)/history.tsx`)
* Calendar view with marked workout days
* **Calendar updates after deletion:** Marks refresh when workouts are deleted
* Fully editable. Users can add new exercises to past workouts
* Workout detail view (`app/history/[id].tsx`) allows editing sets

### History Detail (`app/history/[id].tsx`)
* **Title without card:** Workout name and date display as plain text (no card background)
* **Hides zero-set exercises:** Only shows exercises where at least one set has weight or reps logged
* Edit functionality for sets

### Routines (`app/routines/`)
* Create routine (`create.tsx`): Template gallery + manual exercise selection
* Routine detail (`detail/[id].tsx`): Preview exercises before starting
* Routine deletion with confirmation

### Backup (`data/services/backupService.ts`)
* JSON Export/Import (Restore) is fully functional
* Includes `routine_exercises` table in exports

### Settings (`app/(tabs)/settings.tsx`)
* **"Reset Onboarding" button** for testing - now also clears:
  * All non-temporary routines from database
  * `SELECTED_TRACK` from AsyncStorage
  * `WEEKLY_GOAL` from AsyncStorage
  * `HAS_COMPLETED_ONBOARDING` from AsyncStorage
* Backup/restore functionality

## 6. Key File Structure

```
app/
â”œâ”€â”€ (tabs)/
â”‚   â”œâ”€â”€ index.tsx          # Dashboard / Progress (reflection-focused)
â”‚   â”œâ”€â”€ workouts.tsx       # Start Tab - begin workouts here
â”‚   â”œâ”€â”€ _layout.tsx        # Tab configuration (renamed Workoutâ†’Start)
â”‚   â”œâ”€â”€ library.tsx        # Exercise Library
â”‚   â”œâ”€â”€ history.tsx        # Past Workouts List (Calendar View)
â”‚   â””â”€â”€ settings.tsx       # Settings & Backup
â”œâ”€â”€ history/
â”‚   â””â”€â”€ [id].tsx           # Workout Detail / Edit View
â”œâ”€â”€ library/
â”‚   â””â”€â”€ [id].tsx           # Exercise Detail View
â”œâ”€â”€ routines/
â”‚   â”œâ”€â”€ create.tsx         # Routine Builder
â”‚   â”œâ”€â”€ [id].tsx           # Routine Editor
â”‚   â””â”€â”€ detail/
â”‚       â””â”€â”€ [id].tsx       # Routine Preview
â”œâ”€â”€ session/
â”‚   â”œâ”€â”€ active.tsx         # Active Workout Logger
â”‚   â””â”€â”€ timer.tsx          # Full-screen rest timer with countdown ring
â”œâ”€â”€ onboarding.tsx         # 4-screen onboarding flow
â””â”€â”€ _layout.tsx            # Root layout with SQLiteProvider

components/
â”œâ”€â”€ ui/
â”‚   â”œâ”€â”€ Card.tsx           # Glass-morphism card component
â”‚   â”œâ”€â”€ Button.tsx         # Styled button component
â”‚   â””â”€â”€ index.ts           # Barrel exports
â””â”€â”€ WeeklyGoalRing.tsx     # Circular progress indicator

data/
â”œâ”€â”€ database/
â”‚   â””â”€â”€ db.ts              # SQLite Initialization, Migrations & Helpers
â”œâ”€â”€ exercises.ts           # STATIC Source of Truth for Exercises
â”œâ”€â”€ templates.ts           # STATIC Source for "Quick Add" gallery
â”œâ”€â”€ tracks.ts              # Training track definitions for onboarding
â””â”€â”€ services/
    â””â”€â”€ backupService.ts   # Export/Import functionality
```

## 7. Important Functions & Helpers

### Database Helpers (`data/database/db.ts`)
* `migrateDbIfNeeded()` - Handles schema migrations
* `seedDatabaseWithTrack()` - Populates routines from a training track (used in onboarding). **Checks for existing routines with matching track before seeding. Sets the `track` column on created routines.**
* `getLastTrainedDateByMuscleGroup()` - Returns muscle recovery dates
* `getRoutineDurationEstimate()` - Calculates estimated workout time
* `generateSmartRoutine()` - Creates routine based on muscle freshness
* `createEmptyRoutine()` - Creates blank session template
* `cleanupTemporaryRoutines()` - Removes auto-generated routines
* `deleteRoutine()` - Cascading delete for routines

### Exercise Data (`data/exercises.ts`)
* `EXERCISES` array contains all exercise definitions
* Each exercise has: `id`, `name`, `muscleGroup`, `primary_focus`, `targetReps`
* `primary_focus` is used for muscle recovery tracking

### Training Tracks (`data/tracks.ts`)
* `TRAINING_TRACKS` object with three tracks:
  * `FULL_BODY` - Workout A, Workout B (ideal for 2-3x/week)
  * `PPL` - Push A, Pull A, Legs A (ideal for 3-6x/week)
  * `UPPER_LOWER` - Upper A, Lower A (ideal for 3-4x/week)

### AsyncStorage Keys
* `HAS_COMPLETED_ONBOARDING` - Boolean flag for onboarding completion
* `WEEKLY_GOAL` - Number (1-7) for weekly workout target
* `IN_PROGRESS_WORKOUT` - JSON object with workout state for resume functionality
* `SELECTED_TRACK` - User's chosen training track ("FULL_BODY", "PPL", "UPPER_LOWER", or "NONE" for freestyle)
* `LAST_COMPLETED_RECOMMENDATION_DATE` - Date string (YYYY-MM-DD) tracking when user completed the daily recommendation

## 8. Design Principles

### Dark Mode Default
* Background: `#0a0a0a` (screens), `#121212` (alt)
* Card Background: `rgba(255,255,255,0.06)`
* Card Border: `rgba(255,255,255,0.15)` or `rgba(255,255,255,0.2)`
* Card Border (accent): `rgba(16,185,129,0.3)` (green), `rgba(245,158,11,0.3)` (orange for in-progress)
* Primary Accent: `#10b981` (green)
* Warning/In-Progress Accent: `#f59e0b` (orange)
* Section Labels: `#10b981` (green, uppercase, 13px)
* Divider Lines: `rgba(255,255,255,0.2)`
* Text Primary: `#FFFFFF`
* Text Secondary: `rgba(255,255,255,0.5)`
* Text Muted: `rgba(255,255,255,0.4)`

### Glass-morphism UI
* Subtle transparency with rgba backgrounds
* Soft borders with low opacity
* Green gradient glow effects (use LinearGradient from expo-linear-gradient)
* Card-based design with 20px border-radius

### CTA Hierarchy (IMPORTANT)
* **Primary CTA (colored button):** Only ONE per screen, for the main action
* **Secondary actions (chevrons â†’):** For alternative paths, entire card is tappable
* This reduces decision fatigue and creates clear visual hierarchy

### Spacing
* Screen horizontal padding: 24px
* Card padding: 20-24px
* Card marginBottom: 12-16px
* Section label marginBottom: 12px
* "or" divider marginVertical: 24px
* Button border-radius: 12px

### Typography
* App Title: 36px, bold, letterSpacing: -1
* Card Title: 20-22px, fontWeight: 700
* Section Label: 13px, fontWeight: 600, letterSpacing: 1, uppercase, #10b981
* Section Header: 16-18px, fontWeight: 600
* Body: 14-15px, fontWeight: 400
* Caption: 12-14px

### Accessibility
* Touch targets minimum 44px height
* Clear visual hierarchy
* Readable font sizes

## 9. Common Patterns

### Loading Data
```typescript
useFocusEffect(
  useCallback(() => {
    loadData();
  }, [loadData])
);
```

### Database Queries
```typescript
const db = useSQLiteContext();
const results = await db.getAllAsync<Type>('SELECT ...', [params]);
```

### AsyncStorage
```typescript
await AsyncStorage.setItem('key', 'value');
const value = await AsyncStorage.getItem('key');
```

### Navigation
```typescript
router.push({ pathname: '/route', params: { id: '123' } });
router.replace('/(tabs)'); // Use replace to prevent back navigation
```

### Sorting Routines (Last Used, Then Alphabetically)
```sql
SELECT r.*, 
  (SELECT MAX(date) FROM workouts WHERE routine_id = r.id) as last_used_date 
FROM routines r 
WHERE r.is_temporary = 0 
ORDER BY last_used_date DESC NULLS LAST, r.name ASC
```

### Recommendation Rotation (Track-Based Cycling)
```sql
-- Get routines for the user's selected track, ordered alphabetically
SELECT id, name FROM routines 
WHERE track = ? AND is_temporary = 0 
ORDER BY name ASC
-- Then find last workout's routine from that track and pick the next one (wrapping around)
-- If SELECTED_TRACK is "NONE", no recommendation is shown (freestyle mode)
```

## 10. Troubleshooting Notes

* **Onboarding Loop:** Check `HAS_COMPLETED_ONBOARDING` flag in AsyncStorage
* **Test Onboarding:** Use "Reset Onboarding" button in Settings, or manually clear the flag
* **Missing Data:** Verify migrations have run (`PRAGMA user_version`)
* **Temporary Routines:** Check `is_temporary = 1` flag in routines table
* **Exercise Lookups:** Always reference `data/exercises.ts`, never query DB for exercises
* **Gradient Effects:** Reuse the Dashboard's green gradient glow pattern; don't create new implementations
* **Pressable Styling:** Don't use dynamic style functions - use static inline styles only (NativeWind conflict)
* **LayoutAnimation:** Doesn't work reliably in ScrollView/FlatList - use react-native-reanimated for list animations
* **Expo Go Connectivity:** If connection drops, use `npx expo start --tunnel --clear` for more reliable connection
* **Calendar Not Updating:** After deleting workouts, ensure a small delay before router.back() so database commits
* **No Recommendations Showing:** Check `SELECTED_TRACK` in AsyncStorage; if "NONE", user is in freestyle mode. Also verify routines have the `track` column populated.
* **Celebration Card Stuck:** Check `LAST_COMPLETED_RECOMMENDATION_DATE` in AsyncStorage; clear it to reset
* **Track Routines Missing:** After resetting onboarding, existing routines may have NULL track. Use "Reset Onboarding" in Settings which now clears old routines before re-seeding.

## 11. Known Issues & Planned Work

### Planned Features (Priority Backlog)
* **Repeat Workout:** Button in History detail to redo a past workout with one tap
* **Body Heatmap:** Visual muscle recovery indicator on Dashboard (replace bridge CTA area)

### UI Polish Remaining
* Library tab styling updates
* History tab styling updates  
* Settings tab styling updates
* List item deletion animations (requires react-native-reanimated)

### Pre-App Store Checklist
* Consider hiding "Reset Onboarding" behind a gesture (tap version 5 times)
* Remove any remaining debug buttons
* Test full onboarding flow
* Create demo videos for portfolio
