# LiftTrack UI Redesign - Progress & Learnings

## Summary
This document tracks the UI redesign progress and critical learnings to avoid repeating mistakes.

---

## ✅ Completed

### Phase 0: Component Library
Created reusable UI components in `components/ui/`:

- **Card.tsx** - Glass-morphism card with variants (default, elevated, accent)
- **Button.tsx** - Styled button with variants (primary, secondary) and sizes
- **index.ts** - Barrel export file

### Phase 1: Dashboard (`app/(tabs)/index.tsx`)
- ✅ Added greeting based on time of day (Good morning/afternoon/evening)
- ✅ Updated "LiftTrack" title typography
- ✅ Weekly Goal card with new Card component (variant="default")
- ✅ Enlarged WeeklyGoalRing (radius 50, stroke width 10)
- ✅ Fixed ring number styling (large white current count, small dimmed goal)
- ✅ Weekly Progress card with checkmarks for completed days
- ✅ Recommended for Today card (variant="accent")
- ✅ Removed "Dashboard" header bar
- ✅ Added green gradient glow effect (LinearGradient)
- ✅ Fixed spacing and padding throughout

### Phase 2: Onboarding (`app/onboarding.tsx`)
- ✅ 4-screen swipeable flow using `react-native-pager-view`
- ✅ Screen 1: Welcome with title, tagline, green gradient glow (reuses Dashboard pattern)
- ✅ Screen 2: Training style selection (Full Body, PPL, Upper/Lower) with frequency nudges
- ✅ Screen 3: Weekly goal number picker (1-7, default 3)
- ✅ Screen 4: Confirmation summary with "Start Training" button
- ✅ Page indicator dots at bottom
- ✅ Skip option with reassuring subtext
- ✅ Database seeding via `seedDatabaseWithTrack()` based on user selection
- ✅ Glass-morphism card styling matching app design
- ✅ "Reset Onboarding" button added to Settings for testing

---

## 🔧 Critical Learnings (READ BEFORE MAKING CHANGES)

### 1. Pressable Style Functions DON'T WORK
**Problem:** Dynamic style functions on Pressable break in this codebase (likely NativeWind conflict).

```jsx
// ❌ THIS BREAKS - styles won't apply
<Pressable style={({ pressed }) => [getStyle(pressed), style]}>

// ❌ THIS ALSO BREAKS
<Pressable style={({ pressed }) => ({...getStyle(pressed), ...style})}>

// ✅ THIS WORKS - inline static styles only
<Pressable style={{ backgroundColor: 'red', padding: 20 }}>
```

**Solution:** Use static inline styles. Skip press animations for now (can add later with react-native-reanimated).

### 2. StyleSheet.create Can Be Unreliable
Conditional styles via StyleSheet.create arrays sometimes don't merge correctly.

```jsx
// ❌ Can be unreliable
style={[styles.base, variant === 'primary' && styles.primary]}

// ✅ More reliable - inline with ternary
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

### 4. Test File Changes with Obvious Markers
If changes aren't appearing, add an obvious test (red background, "HELLO WORLD" text) to verify files are being read.

### 5. Compare Working vs Broken
When something breaks, compare with a working screen (Library tab was our reference) and copy the exact pattern.

### 6. One Change at a Time
Don't update multiple screens at once. Update one card, verify it works, then move to the next.

### 7. ScrollView alignItems: 'center' Breaks Cards
This causes cards to shrink to content width instead of stretching full width. Remove it.

### 8. Reuse Existing Patterns for Effects
When implementing visual effects like gradient glows, **always check if the same effect exists elsewhere in the app** and copy that exact implementation. Don't try to recreate from scratch - it often produces different (worse) results.

Example: The green gradient glow on Dashboard should be reused identically for Onboarding Screen 1.

### 9. Less Text is More Readable
When cards feel cluttered, remove secondary/tertiary text rather than adjusting sizes. Users scan quickly - one title + one supporting detail is often enough.

---

## 📁 Files Modified

### New Files Created
- `components/ui/Card.tsx`
- `components/ui/Button.tsx`
- `components/ui/index.ts`
- `design/README.md` (design tokens)
- `design/mockups/ui-redesign-mockup.jsx` (visual reference)

### Files Updated
- `app/(tabs)/index.tsx` - Dashboard redesign
- `app/(tabs)/_layout.tsx` - Hidden Dashboard header
- `app/(tabs)/settings.tsx` - Added Reset Onboarding button (for testing)
- `app/onboarding.tsx` - Complete redesign with 4-screen flow
- `components/WeeklyGoalRing.tsx` - Larger ring, better styling

---

## 🎨 Design Tokens Reference

### Colors
- Background: `#0a0a0a`
- Card Background (default): `rgba(255,255,255,0.06)`
- Card Background (elevated): `rgba(255,255,255,0.18)`
- Card Background (accent): `rgba(16,185,129,0.15)`
- Card Border (default): `rgba(255,255,255,0.1)` or `rgba(255,255,255,0.2)`
- Card Border (accent): `rgba(16,185,129,0.4)`
- Primary Accent: `#10b981`
- Text Primary: `#FFFFFF`
- Text Secondary: `rgba(255,255,255,0.5)`
- Text Muted: `rgba(255,255,255,0.4)`
- Skip/Link Text: `rgba(255,255,255,0.7)`

### Spacing
- Screen horizontal padding: 24px
- Card padding: 20-24px
- Card border-radius: 20px
- Card marginBottom: 16-24px
- Button border-radius: 12px
- Gap between card elements: 8px

### Typography
- App Title: 36px, bold, letterSpacing: -1
- Screen Title: 28px, fontWeight: 700
- Card Title: 20-22px, fontWeight: 700
- Section Header: 16-18px, fontWeight: 600
- Body: 14-15px, fontWeight: 400
- Nudge/Accent Text: 15px, #10b981
- Caption: 12-14px
- Skip Link: 17px, fontWeight: 500

---

## ⭐️ Next Steps

### Workouts Tab (`app/(tabs)/workouts.tsx`)
- ✅ Start Empty Workout card (accent variant) - DONE
- ⬜ Routine cards - need to update with Card component
- ⬜ Section header styling ("Routines")
- ⬜ Add gradient glow effect
- ⬜ Hide header bar

### Library Tab (`app/(tabs)/library.tsx`)
- ⬜ Search bar styling
- ⬜ Filter pills update
- ⬜ Exercise cards with Card component
- ⬜ Add gradient glow effect

### History Tab (`app/(tabs)/history.tsx`)
- ⬜ Calendar card styling
- ⬜ Workout entry cards
- ⬜ Add gradient glow effect

### Settings Tab (`app/(tabs)/settings.tsx`)
- ⬜ Settings cards/rows styling
- ⬜ Remove "Reset Onboarding" button before production release

---

## 🧪 Testing Checklist
After each change:
1. [ ] App loads without crash
2. [ ] Cards display with correct background/border
3. [ ] Buttons are tappable and styled correctly
4. [ ] Navigation still works
5. [ ] Data displays correctly (workout counts, routines, etc.)

### Onboarding-Specific Testing
1. [ ] Reset onboarding via Settings button
2. [ ] All 4 screens display correctly
3. [ ] Swiping between screens works
4. [ ] Page dots update correctly
5. [ ] Track selection stores choice (doesn't navigate immediately)
6. [ ] Weekly goal picker works (1-7 range)
7. [ ] "Start Training" seeds database and navigates to Dashboard
8. [ ] Skip path works (no seeding, just completes onboarding)
9. [ ] Selected track's routines appear in Workouts tab
