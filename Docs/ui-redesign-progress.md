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

### 8. React Native Can't Do Radial Gradients
Use `expo-linear-gradient` for glow effects, not layered Views with opacity.

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
- `components/WeeklyGoalRing.tsx` - Larger ring, better styling

---

## 🎨 Design Tokens Reference

### Colors
- Background: `#0a0a0a`
- Card Background (default): `rgba(255,255,255,0.06)`
- Card Background (elevated): `rgba(255,255,255,0.18)`
- Card Background (accent): `rgba(16,185,129,0.15)`
- Card Border (default): `rgba(255,255,255,0.2)`
- Card Border (accent): `rgba(16,185,129,0.4)`
- Primary Accent: `#10b981`
- Text Primary: `#FFFFFF`
- Text Secondary: `rgba(255,255,255,0.5)`
- Text Muted: `rgba(255,255,255,0.4)`

### Spacing
- Screen horizontal padding: 24px
- Card padding: 20px
- Card border-radius: 20px
- Card marginBottom: 24px
- Button border-radius: 12px

### Typography
- App Title: 36px, Inter_700Bold, letterSpacing: -1
- Card Title: 22px, fontWeight: 700
- Section Header: 16-18px, fontWeight: 600
- Body: 14-15px, fontWeight: 400
- Caption: 12-13px

---

## ⏭️ Next Steps

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

---

## 🧪 Testing Checklist
After each change:
1. [ ] App loads without crash
2. [ ] Cards display with correct background/border
3. [ ] Buttons are tappable and styled correctly
4. [ ] Navigation still works
5. [ ] Data displays correctly (workout counts, routines, etc.)
