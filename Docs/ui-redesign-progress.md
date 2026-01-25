# LiftTrack UI Redesign - Progress & Learnings

## Summary
This document tracks the UI redesign progress and critical learnings to avoid repeating mistakes.

---

## âœ… Completed

### Phase 0: Component Library
Created reusable UI components in `components/ui/`:

- **Card.tsx** - Glass-morphism card with variants (default, elevated, accent)
- **Button.tsx** - Styled button with variants (primary, secondary) and sizes
- **index.ts** - Barrel export file

### Phase 1: Dashboard (`app/(tabs)/index.tsx`)
- âœ… Added greeting based on time of day (Good morning/afternoon/evening)
- âœ… Updated "LiftTrack" title typography
- âœ… Weekly Goal card with new Card component (variant="default")
- âœ… Enlarged WeeklyGoalRing (radius 50, stroke width 10)
- âœ… Fixed ring number styling (large white current count, small dimmed goal)
- âœ… **Fixed ring starting position** - now starts at 12 o'clock (rotation={0})
- âœ… Weekly Progress card with checkmarks for completed days
- âœ… Removed "Recommended for Today" card (moved to Start tab)
- âœ… Added simple bridge CTA: "Ready to train? Start a workout â†’"
- âœ… Removed "Dashboard" header bar
- âœ… Added green gradient glow effect (LinearGradient)
- âœ… Fixed spacing and padding throughout

### Phase 2: Onboarding (`app/onboarding.tsx`)
- âœ… 4-screen swipeable flow using `react-native-pager-view`
- âœ… Screen 1: Welcome with title, tagline, green gradient glow (reuses Dashboard pattern)
- âœ… Screen 2: Training style selection (Full Body, PPL, Upper/Lower) with frequency nudges
- âœ… Screen 3: Weekly goal number picker (1-7, default 3)
- âœ… Screen 4: Confirmation summary with "Start Training" button
- âœ… Page indicator dots at bottom
- âœ… Skip option with reassuring subtext
- âœ… Database seeding via `seedDatabaseWithTrack()` based on user selection
- âœ… Glass-morphism card styling matching app design
- âœ… "Reset Onboarding" button added to Settings for testing
- âœ… **Duplicate prevention** - seedDatabaseWithTrack() checks for existing routines before inserting

### Phase 3: Start Tab UX Restructure (`app/(tabs)/workouts.tsx`)
- âœ… Renamed tab from "Workout" to "Start" (in `_layout.tsx`)
- âœ… Added "Recommended for Today" card at TOP of screen (moved from Dashboard)
- âœ… Card shows: routine name, estimated duration, "last done X days ago" context
- âœ… **Fixed recommendation rotation logic** - now cycles alphabetically (Aâ†’Bâ†’Aâ†’B)
- âœ… Added clear section structure with labels:
  - "TODAY'S RECOMMENDATION" (green, uppercase)
  - "or" divider (horizontal lines with centered text)
  - "YOUR ROUTINES" (green, uppercase)
- âœ… Recommended routine is hidden from "Your Routines" list (no duplication)
- âœ… **Fixed duplicate routines bug** - cleaned up DB duplicates and added prevention
- âœ… Updated "Start Empty Workout" card:
  - Removed plus icon
  - Added subtitle: "Add exercises as you go"
  - Uses chevron (â†’) instead of button
- âœ… Simplified routine card CTAs:
  - Removed green "Start" buttons
  - Added chevrons (â†’) instead
  - Only recommendation card has green "Start" button (clear visual hierarchy)
- âœ… Standardized card borders (consistent brightness)
- âœ… Routines sorted by: Last Used (most recent first), then alphabetically
- âœ… **Added "Continue Workout" feature:**
  - Orange "WORKOUT IN PROGRESS" card appears when user has abandoned workout
  - Shows routine name and time since started
  - "Continue Workout" and "Discard workout" buttons
  - Hides recommendation card when in-progress workout exists

### Phase 4: Active Session Improvements (`app/session/active.tsx`)
- âœ… **Add Set auto-fill** - New sets auto-populate with weight/reps from previous set in same session
- âœ… **Remove sets** - X button on each set row to delete before finishing
- âœ… **Auto-remove empty exercises** - When all sets deleted, exercise card is removed
- âœ… **Workout state persistence** - Saves to AsyncStorage for resume capability
- âœ… Clears saved state on finish or cancel

### Phase 5: Rest Timer Redesign (`app/session/timer.tsx`)
- âœ… **New full-screen timer page** - Replaced overlay/modal approach
- âœ… Large countdown display (MM:SS format)
- âœ… **Circular countdown ring** using react-native-svg
- âœ… Ring depletes as time counts down
- âœ… "Skip" button to end early
- âœ… Auto-returns to active session when complete
- âœ… Vibration alert on completion

### Phase 6: History Tab Fixes (`app/(tabs)/history.tsx` & `app/history/[id].tsx`)
- ✅ **Calendar updates after deletion** - Added delay before router.back() to ensure DB commits
- ✅ **Title without card** - Workout name/date display as plain text in detail view
- ✅ **Hide zero-set exercises** - Only shows exercises with actual logged data (weight or reps)

### Phase 7: Track-Based Recommendations & Celebration (Jan 20, 2026)
- ✅ **Track selection persistence** - `SELECTED_TRACK` saved to AsyncStorage during onboarding
- ✅ **Database migration** - Added `track` column to routines table (Migration v4)
- ✅ **Track-based recommendation logic** - Recommendations only cycle through routines from user's selected track:
  - FULL_BODY: Full Body A → Full Body B → Full Body A...
  - PPL: Push Day → Pull Day → Legs Day → Push Day...
  - UPPER_LOWER: Upper A → Lower A → Upper A...
- ✅ **Freestyle mode** - Users who skip track selection see no recommendation card (just routines list)
- ✅ **User-created routines** - Have `track = NULL`, appear in "YOUR ROUTINES" but not recommendations
- ✅ **Enhanced Reset Onboarding** - Now clears existing routines before re-seeding (fixes migration issues)
- ✅ **Celebration state** - After completing recommended workout:
  - Recommendation card replaced with "You crushed it!" celebration card
  - Persists until next calendar day (uses `LAST_COMPLETED_RECOMMENDATION_DATE` in AsyncStorage)
  - Other sections (Start Empty Workout, YOUR ROUTINES) still visible below

---

## ðŸ”§ Critical Learnings (READ BEFORE MAKING CHANGES)

### 1. Pressable Style Functions DON'T WORK
**Problem:** Dynamic style functions on Pressable break in this codebase (likely NativeWind conflict).

```jsx
// âŒ THIS BREAKS - styles won't apply
<Pressable style={({ pressed }) => [getStyle(pressed), style]}>

// âŒ THIS ALSO BREAKS
<Pressable style={({ pressed }) => ({...getStyle(pressed), ...style})}>

// âœ… THIS WORKS - inline static styles only
<Pressable style={{ backgroundColor: 'red', padding: 20 }}>
```

**Solution:** Use static inline styles. Skip press animations for now (can add later with react-native-reanimated).

### 2. StyleSheet.create Can Be Unreliable
Conditional styles via StyleSheet.create arrays sometimes don't merge correctly.

```jsx
// âŒ Can be unreliable
style={[styles.base, variant === 'primary' && styles.primary]}

// âœ… More reliable - inline with ternary
style={{ backgroundColor: variant === 'primary' ? '#10b981' : 'transparent' }}
```

### 3. Always Kill Old Expo Processes
Before testing changes, ensure no old Metro bundlers are running:

```bash
# Find what's using port 8081
lsof -i :8081

# Kill the process
kill -9 <PID>

# Clear cache and restart
rm -rf .expo node_modules/.cache
npx expo start --clear
```

### 4. Use Tunnel Mode for Reliable Expo Go Connection
If Expo Go keeps disconnecting or won't connect:

```bash
npx expo start --tunnel --clear
```

This is slower but much more reliable, especially when laptop sleeps or network changes.

### 5. Test File Changes with Obvious Markers
If changes aren't appearing, add an obvious test (red background, "HELLO WORLD" text) to verify files are being read.

### 6. Compare Working vs Broken
When something breaks, compare with a working screen (Library tab was our reference) and copy the exact pattern.

### 7. One Change at a Time
Don't update multiple screens at once. Update one card, verify it works, then move to the next.

### 8. ScrollView alignItems: 'center' Breaks Cards
This causes cards to shrink to content width instead of stretching full width. Remove it.

### 9. Reuse Existing Patterns for Effects
When implementing visual effects like gradient glows, **always check if the same effect exists elsewhere in the app** and copy that exact implementation. Don't try to recreate from scratch - it often produces different (worse) results.

### 10. Less Text is More Readable
When cards feel cluttered, remove secondary/tertiary text rather than adjusting sizes. Users scan quickly - one title + one supporting detail is often enough.

### 11. CTA Hierarchy Matters
The more buttons on a screen, the less powerful each one becomes. Use:
- **Primary CTA (colored button):** Only ONE per screen, for the main action
- **Secondary actions (chevrons):** For alternative paths, tappable cards
- This creates clear visual hierarchy and reduces decision fatigue

### 12. LayoutAnimation Doesn't Work in Lists
`LayoutAnimation` from React Native doesn't work reliably inside ScrollView or FlatList. For list item animations, you need `react-native-reanimated` - it's more complex but the only reliable solution.

### 13. Database Deletion Timing
When deleting data and navigating back, add a small delay (100ms) before `router.back()` to ensure the database transaction commits before the previous screen reloads:

```javascript
await deleteWorkout(db, id);
await new Promise(resolve => setTimeout(resolve, 100));
router.back();
```

### 14. Circular Progress Ring Rotation
For `react-native-circular-progress-indicator`, use `rotation={0}` to start at 12 o'clock. The default or `rotation={-90}` may not work as expected depending on library version.

### 15. Database Migrations Don't Populate Existing Rows
When adding a new column via migration (e.g., `ALTER TABLE routines ADD COLUMN track TEXT`), existing rows will have `NULL` for that column. If your logic depends on the new column having a value, you need to either:
- **Update existing rows** in the migration with default values, OR
- **Clear and re-seed** the data (what we did with Reset Onboarding)

Also, duplicate prevention checks need to account for the new column. For example, checking "do any routines exist?" vs "do any routines with this track exist?" are different queries with different outcomes.

### 16. Debug Logging is Your Friend
When features don't work after implementation, add `console.log('DEBUG: ...')` statements at key points to trace data flow. Check:
1. Is data being saved correctly?
2. Is data being read correctly?
3. Is the query returning expected results?

Remember to remove debug logs after fixing the issue.

---

## ðŸ“ Files Modified

### New Files Created
- `components/ui/Card.tsx`
- `components/ui/Button.tsx`
- `components/ui/index.ts`
- `design/README.md` (design tokens)
- `design/mockups/ui-redesign-mockup.jsx` (visual reference)
- `app/session/timer.tsx` (full-screen rest timer)

### Files Updated
- `app/(tabs)/index.tsx` - Dashboard redesign, ring rotation fix, bridge CTA
- `app/(tabs)/workouts.tsx` - Complete restructure, recommendation rotation fix, continue workout feature
- `app/(tabs)/_layout.tsx` - Renamed "Workout" tab to "Start", hidden Dashboard header
- `app/(tabs)/settings.tsx` - Reset Onboarding button
- `app/(tabs)/history.tsx` - Calendar refresh after deletion
- `app/history/[id].tsx` - Title styling, hide zero-set exercises
- `app/session/active.tsx` - Add set auto-fill, remove sets, workout state persistence
- `app/onboarding.tsx` - Complete redesign with 4-screen flow
- `components/WeeklyGoalRing.tsx` - Larger ring, rotation fix
- `data/database/db.ts` - Duplicate prevention in seedDatabaseWithTrack()

---

## ðŸŽ¨ Design Tokens Reference

### Colors
- Background: `#0a0a0a`
- Card Background (default): `rgba(255,255,255,0.06)`
- Card Background (elevated): `rgba(255,255,255,0.18)`
- Card Background (accent green): `rgba(16,185,129,0.15)`
- Card Background (accent orange): `rgba(245,158,11,0.15)`
- Card Border (default): `rgba(255,255,255,0.15)` or `rgba(255,255,255,0.2)`
- Card Border (accent green): `rgba(16,185,129,0.3)`
- Card Border (accent orange): `rgba(245,158,11,0.3)`
- Primary Accent: `#10b981` (green)
- Warning/In-Progress Accent: `#f59e0b` (orange)
- Section Labels: `#10b981` (green, uppercase)
- Divider Lines: `rgba(255,255,255,0.2)`
- Text Primary: `#FFFFFF`
- Text Secondary: `rgba(255,255,255,0.5)`
- Text Muted: `rgba(255,255,255,0.4)`
- Skip/Link Text: `rgba(255,255,255,0.7)`
- Delete/Remove: `#ef4444` (red)

### Spacing
- Screen horizontal padding: 24px
- Card padding: 20-24px
- Card border-radius: 20px
- Card marginBottom: 12-16px
- Section label marginBottom: 12px
- "or" divider marginVertical: 24px
- Button border-radius: 12px
- Gap between card elements: 8px

### Typography
- App Title: 36px, bold, letterSpacing: -1
- Screen Title: 28px, fontWeight: 700
- Card Title: 20-22px, fontWeight: 700
- Section Label: 13px, fontWeight: 600, letterSpacing: 1, uppercase, green
- Section Header: 16-18px, fontWeight: 600
- Body: 14-15px, fontWeight: 400
- "or" divider text: 14px, rgba(255,255,255,0.5)
- Nudge/Accent Text: 15px, #10b981
- Caption: 12-14px
- Skip Link: 17px, fontWeight: 500
- Timer Display: 72-80px, fontWeight: 700, tabular-nums

---

## â³ Backlog / Next Steps

### Priority Features
- â¬œ **Repeat Workout** - Button in History detail to redo a past workout with one tap
- â¬œ **Body Heatmap** - Visual muscle recovery indicator on Dashboard (replace bridge CTA area)

### UI Polish Remaining
- â¬œ Library tab styling updates
- â¬œ History tab styling updates
- â¬œ Settings tab styling updates
- â¬œ List item deletion animations (requires react-native-reanimated)

### Pre-App Store
- â¬œ Hide "Reset Onboarding" behind gesture (tap version 5 times)
- â¬œ Final testing of all flows
- â¬œ Create demo videos for portfolio

---

## ðŸ§ª Testing Checklist
After each change:
1. [ ] App loads without crash
2. [ ] Cards display with correct background/border
3. [ ] Buttons are tappable and styled correctly
4. [ ] Navigation still works
5. [ ] Data displays correctly (workout counts, routines, etc.)

### Start Tab Testing
1. [ ] "WORKOUT IN PROGRESS" card appears when there's an abandoned workout
2. [ ] "Continue Workout" resumes the saved state
3. [ ] "Discard workout" clears state and shows recommendation
4. [ ] "TODAY'S RECOMMENDATION" label visible (green) when no in-progress workout
5. [ ] Recommendation card shows routine name, duration, last done context
6. [ ] Recommendation rotates alphabetically (Aâ†’Bâ†’A)
7. [ ] "or" divider visible between recommendation and alternatives
8. [ ] "Start Empty Workout" shows subtitle, has chevron, no plus icon
9. [ ] "YOUR ROUTINES" label visible (green)
10. [ ] Recommended routine does NOT appear in routines list
11. [ ] No duplicate routines in list
12. [ ] Routine cards have chevrons, not Start buttons
13. [ ] Routines sorted by last used, then alphabetically
14. [ ] Tapping any card navigates correctly

### Active Session Testing
1. [ ] Add Set copies weight/reps from previous set
2. [ ] X button removes individual sets
3. [ ] Removing all sets removes the exercise
4. [ ] Swiping back preserves workout state
5. [ ] Returning to Start shows "Continue Workout" card
6. [ ] Finishing clears the in-progress state
7. [ ] Cancelling clears the in-progress state

### Timer Testing
1. [ ] Timer opens as full screen (not overlay)
2. [ ] Countdown ring depletes smoothly
3. [ ] Timer auto-returns when complete
4. [ ] Skip button works
5. [ ] Vibration on completion

### History Testing
1. [ ] Deleting workout updates calendar (dot disappears)
2. [ ] Workout detail shows title without card background
3. [ ] Exercises with zero logged sets are hidden

---

## ðŸ“ UX Architecture Reference

### User Mindsets When Opening App
1. **"Continue what I started"** â†’ In-progress workout card (highest priority)
2. **"Decide for me"** â†’ Recommendation card (primary CTA)
3. **"I'll wing it"** â†’ Start Empty Workout (secondary)
4. **"I know what I want"** â†’ Your Routines list (secondary)

### Tab Purposes
| Tab | Purpose | Primary Action |
|-----|---------|----------------|
| Dashboard | Reflection & progress | View stats, then navigate to Start |
| Start | Begin a workout | Resume, start recommended, empty, or chosen routine |
| Library | Reference & learning | Look up exercises, view PRs |
| History | Review past work | View/edit past workouts |
| Settings | Configuration | Backup, preferences, testing |

### Information Hierarchy on Start Tab
1. **WORKOUT IN PROGRESS** - Resume abandoned workout (orange, only when exists)
2. **TODAY'S RECOMMENDATION** - The app's best suggestion (green, primary)
3. **"or" divider** - Visual break signaling alternatives
4. **Start Empty Workout** - Freestyle option (secondary)
5. **YOUR ROUTINES** - Manual selection (secondary)
