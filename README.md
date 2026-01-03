LiftTrack - Project Context Summary

1. Project Overview
LiftTrack is a "Local First" React Native mobile application built to help users plan, log, and track gym workouts. The app emphasizes progressive overload by referencing past performance during active sessions. It is designed for offline-first personal use, with data stored securely on the device.

2. Tech Stack
  Framework: React Native (Managed Workflow via Expo).
  Language: TypeScript.
  Navigation: Expo Router (File-based routing).
  Styling: NativeWind (Tailwind CSS for React Native).
  Data Engine (Content): SQLite (expo-sqlite) for Routines, Workouts, and Sets.
  Data Engine (Preferences): AsyncStorage for simple settings (e.g., Weekly Workout Goal).
  Visualization: react-native-circular-progress-indicator and react-native-gifted-charts.

3. Architecture & Database Decisions
  Why SQLite? We explicitly chose SQLite over a remote database (like PostgreSQL/Supabase) to ensure 100% offline capability, zero network latency, and long-term privacy.
  Migration Path: The app was refactored from AsyncStorage to SQLite in Jan 2026. AsyncStorage code has been removed from core flows.
  Future Sync: The architecture supports a future "Sync Engine" update if cloud backup is needed, but the core app remains local-only.

4. Workflow Context (Crucial for AI Assistants)
User Environment: Non-technical product manager building this app using Cursor AI (Composer/Agent).
Requirement: Provide PRECISE PROMPTS for Cursor Composer. Do not just output code blocks; output instructions on how to apply the code.
Prompt Style: Prompts should be step-by-step, referencing specific file paths and imports, to minimize AI hallucinations.

5. Data Architecture (Critical)
Static Data (Code):
Exercises: Defined in data/exercises.ts. There is NO exercises table in the DB. We store exercise_id in the DB and look up details from this file.
Starter Templates: Hardcoded "Workout A/B" in data/templates.ts.
Dynamic Data (SQLite):
Custom Routines: User-created routines stored in the routines table.
History: Completed logs stored in workouts and sets tables.

6. Current Feature Set (Status: Live)
Dashboard (index.tsx):
Goal Ring: Visual progress ring (Green) showing weekly count vs. goal.
Streak Counter: Calculates consecutive weeks of activity from SQLite history.
Weekly Dots: Visualizes daily consistency (Mon-Sun).
Goal Editing: Users can update their weekly goal (persisted via AsyncStorage).
Active Session Logger (active.tsx):
Entry Points: Supports starting from a specific Routine/Template OR an Empty Session.
Smart Pre-fill: Auto-fills weights/reps from the last specific exercise session (queried via SQL).
Tools: Rest Timer (90s) & Exercise Swapping.
Save: Commits full workout + sets to SQLite in a single transaction.
Routine Management (routines/ & workouts.tsx):
Hybrid List: Displays both hardcoded Starter Templates AND custom Database Routines.
Create: Build custom routines from the static exercise list.
Edit: Full modification via routines/[id].tsx.
Delete: Remove custom routines with confirmation.
History (history/):
List View: Chronological feed of past workouts.
Detail View: Tap any workout to see grouped sets/reps (history/[id].tsx).

7. Database Schema (SQLite)
routines: id (PK), name, created_at.
routine_exercises: id (PK), routine_id (FK), exercise_id (String ref), order_index.
workouts: id (PK), date, name, duration_seconds.
sets: id (PK), workout_id (FK), exercise_id (String ref), weight, reps, completed (0/1).

8. Critical File Paths
data/database/db.ts (Schema & Migration)
data/exercises.ts (The "Source of Truth" for Exercise definitions)
app/(tabs)/index.tsx (Dashboard logic)
app/session/active.tsx (Core logging logic)
app/(tabs)/workouts.tsx (Routine selection)

Appendix: Current File Structure
app/
  (tabs)/
    _layout.tsx
    history.tsx
    index.tsx (Dashboard)
    settings.tsx (Planned)
    workouts.tsx
  history/
    [id].tsx (Detail View)
  routines/
    create.tsx
    [id].tsx (Edit View)
  session/
    active.tsx (Logger)
  _layout.tsx (Providers)
components/
  WeeklyGoalRing.tsx
  Charts/ (Planned)
data/
  database/
    db.ts (SQLite Init)
  exercises.ts (Static JSON)
  templates.ts (Static JSON)

Appendix: Key Dependencies (Package.json)
(Reference for API compatibility)
expo: ~52.0.0
expo-router: ~4.0.0
expo-sqlite: (Latest)
nativewind: ^4.0.0
react-native-gifted-charts: (Latest)
react-native-circular-progress-indicator: (Latest)



