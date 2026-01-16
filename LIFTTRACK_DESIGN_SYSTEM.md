# LiftTrack Design System

## Overview

A premium, Apple-inspired dark mode design system for a gym/workout tracking mobile app built with React Native. Follows "radical minimalism" principles optimized for dark gym environments and practical one-handed use.

---

## Design Philosophy

1. **Functional Minimalism** - Every element serves a purpose. No decorative clutter.
2. **Depth Through Layers** - Use elevation and subtle borders to create hierarchy (shadows don't work in dark mode).
3. **Glows Over Shadows** - Replace drop shadows with subtle color glows for emphasis.
4. **High Contrast for Glanceability** - Key stats should be readable in 0.5 seconds.
5. **Thumb-Friendly** - Primary actions within easy thumb reach, minimum 44x44px tap targets.

---

## Color Palette

### Core Colors

```javascript
const colors = {
  // Backgrounds (layered depth)
  background: '#000000',        // Level 0 - App background (pure black for OLED)
  surface: '#1c1c1e',           // Level 1 - Cards, bottom sheets
  surfaceElevated: '#2c2c2e',   // Level 2 - Modals, elevated cards
  surfacePressed: '#3a3a3c',    // Level 3 - Pressed states, inputs

  // Text hierarchy
  textPrimary: '#ffffff',       // Headlines, important numbers
  textSecondary: '#8e8e93',     // Body text, descriptions
  textTertiary: '#636366',      // Captions, timestamps, disabled

  // Accent (Green - energy, health, progress)
  accent: '#22c55e',            // Primary actions, progress indicators
  accentMuted: '#16a34a',       // Secondary green elements
  accentGlow: 'rgba(34, 197, 94, 0.15)',  // Glow effects
  accentSubtle: 'rgba(34, 197, 94, 0.08)', // Backgrounds

  // Semantic colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Borders & Dividers
  border: 'rgba(255, 255, 255, 0.06)',
  borderLight: 'rgba(255, 255, 255, 0.04)',
  divider: 'rgba(255, 255, 255, 0.08)',
};
```

### When to Use Each Color

| Element | Color |
|---------|-------|
| App background | `background` (#000000) |
| Cards, sheets | `surface` (#1c1c1e) |
| Modals, popovers | `surfaceElevated` (#2c2c2e) |
| Buttons, inputs | `surfacePressed` (#3a3a3c) |
| Headlines, stats | `textPrimary` (#ffffff) |
| Descriptions | `textSecondary` (#8e8e93) |
| Labels, captions | `textTertiary` (#636366) |
| CTAs, progress | `accent` (#22c55e) |

---

## Typography

### Font Stack

```javascript
const typography = {
  // Use system fonts for performance and native feel
  fontFamily: {
    regular: 'System', // SF Pro on iOS, Roboto on Android
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Type scale
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: -0.03,  // Headlines
    tight: -0.01,    // Subheadings
    normal: 0,       // Body
    wide: 0.05,      // Captions, labels
  },
};
```

### Text Styles

```javascript
const textStyles = {
  // Large stat numbers (e.g., "3" in "3 Workouts")
  statLarge: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.03,
    fontVariant: ['tabular-nums'],
  },
  
  // Card titles
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.01,
  },
  
  // Section headers
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 0.05,
    textTransform: 'uppercase',
  },
  
  // Body text
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  
  // Captions
  caption: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textTertiary,
  },
};
```

---

## Spacing & Layout

### Spacing Scale

```javascript
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};
```

### Layout Guidelines

```javascript
const layout = {
  // Screen padding
  screenPadding: 16,
  
  // Card internal padding
  cardPadding: 16,
  
  // Minimum tap target
  minTapTarget: 44,
  
  // Border radius scale
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
};
```

---

## Component Styles

### Cards

```javascript
const cardStyles = {
  // Base card
  base: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  
  // Elevated card (modals, important items)
  elevated: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    // React Native shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    // Android elevation
    elevation: 8,
  },
  
  // Interactive card (pressable)
  interactive: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  
  // Pressed state
  interactivePressed: {
    backgroundColor: colors.surfaceElevated,
    transform: [{ scale: 0.98 }],
  },
  
  // Card with accent glow (featured/active items)
  glowing: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    padding: 16,
    // Glow effect
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
};
```

### Buttons

```javascript
const buttonStyles = {
  // Primary button (main CTA)
  primary: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '600',
  },
  primaryPressed: {
    backgroundColor: colors.accentMuted,
    transform: [{ scale: 0.98 }],
  },
  
  // Secondary button
  secondary: {
    backgroundColor: colors.surfacePressed,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  
  // Ghost button (text only)
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  ghostText: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '600',
  },
  
  // Icon button
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
};
```

### Progress Indicators

```javascript
const progressStyles = {
  // Circular progress ring
  ring: {
    trackColor: 'rgba(255, 255, 255, 0.08)',
    progressColor: colors.accent,
    strokeWidth: 8,
    // Add glow to progress
    progressShadow: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
  },
  
  // Linear progress bar
  bar: {
    track: {
      height: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 3,
    },
    progress: {
      height: 6,
      backgroundColor: colors.accent,
      borderRadius: 3,
    },
  },
  
  // Weekly dots (like your current design)
  weekDot: {
    size: 32,
    inactive: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 16,
    },
    active: {
      backgroundColor: colors.accent,
      borderRadius: 16,
    },
    today: {
      borderWidth: 2,
      borderColor: colors.accent,
    },
  },
};
```

### Input Fields

```javascript
const inputStyles = {
  // Text input
  textInput: {
    backgroundColor: colors.surfacePressed,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textInputFocused: {
    borderColor: colors.accent,
  },
  textInputPlaceholder: {
    color: colors.textTertiary,
  },
  
  // Number input (for weights, reps)
  numberInput: {
    backgroundColor: colors.surfacePressed,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  numberInputText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
};
```

### Lists & Rows

```javascript
const listStyles = {
  // List item row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  
  // Separator
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 16,
  },
  
  // Grouped list container
  groupedList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
};
```

---

## Animation Guidelines

### Timing

```javascript
const animation = {
  // Durations
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  // Easing curves
  easing: {
    default: 'cubic-bezier(0.25, 0.1, 0.25, 1)',     // Smooth
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.1)', // Bouncy
    enter: 'cubic-bezier(0, 0, 0.2, 1)',             // Decelerate
    exit: 'cubic-bezier(0.4, 0, 1, 1)',              // Accelerate
  },
  
  // React Native Reanimated spring config
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
};
```

### Common Animations

```javascript
// Press feedback
const pressAnimation = {
  scale: 0.97,
  duration: 100,
};

// Card enter
const cardEnter = {
  from: { opacity: 0, translateY: 20 },
  to: { opacity: 1, translateY: 0 },
  duration: 300,
};

// Success pulse
const successPulse = {
  scale: [1, 1.05, 1],
  duration: 300,
};

// Shake (error)
const shake = {
  translateX: [0, -8, 8, -8, 8, 0],
  duration: 400,
};
```

---

## Iconography

### Guidelines

- Use SF Symbols on iOS, Material Icons on Android (or a cross-platform set like Lucide)
- Icon size: 20-24px for most UI, 28-32px for tab bars
- Icon weight: Regular for most, Semibold for selected states
- Color: `textSecondary` for inactive, `textPrimary` or `accent` for active

### Common Icons

```javascript
const icons = {
  // Navigation
  home: 'house.fill',
  workouts: 'dumbbell.fill',
  progress: 'chart.line.uptrend.xyaxis',
  settings: 'gearshape.fill',
  
  // Actions
  add: 'plus',
  edit: 'pencil',
  delete: 'trash',
  check: 'checkmark',
  close: 'xmark',
  
  // Workout
  timer: 'timer',
  rest: 'pause.circle',
  play: 'play.fill',
  complete: 'checkmark.circle.fill',
};
```

---

## Dark Mode Best Practices

### Do's ✅

1. **Use pure black (#000) for OLED screens** - Saves battery, true blacks look premium
2. **Create depth with layered surfaces** - Each layer slightly lighter
3. **Add subtle borders** - `rgba(255,255,255,0.06)` separates elements without harsh lines
4. **Use glows for emphasis** - Replace shadows with colored glows
5. **Keep text slightly off-white** - Pure white (#fff) can be harsh; use #f5f5f7 for large text
6. **Make numbers tabular** - Use `fontVariant: ['tabular-nums']` so numbers don't jump
7. **Generous tap targets** - Minimum 44x44px, ideally 48x48px
8. **High contrast for key stats** - Glanceable in dark environments

### Don'ts ❌

1. **Don't use gray backgrounds** - Too flat, loses depth
2. **Don't use pure white everywhere** - Too harsh, causes eye strain
3. **Don't overuse green glow** - Reserve for important elements
4. **Don't use thin fonts** - Hard to read in dark mode
5. **Don't rely on shadows alone** - They disappear in dark mode
6. **Don't forget pressed states** - Critical for touch feedback

---

## Quick Reference: Component Snippets

### Basic Card

```jsx
<View style={{
  backgroundColor: '#1c1c1e',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.06)',
  padding: 16,
}}>
  <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '600' }}>
    Card Title
  </Text>
  <Text style={{ color: '#8e8e93', fontSize: 15, marginTop: 4 }}>
    Card description goes here
  </Text>
</View>
```

### Primary Button

```jsx
<Pressable 
  style={({ pressed }) => ({
    backgroundColor: pressed ? '#16a34a' : '#22c55e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    transform: [{ scale: pressed ? 0.98 : 1 }],
  })}
>
  <Text style={{ color: '#000', fontSize: 17, fontWeight: '600', textAlign: 'center' }}>
    Start Workout
  </Text>
</Pressable>
```

### Stat Display

```jsx
<View style={{ alignItems: 'center' }}>
  <Text style={{ 
    fontSize: 48, 
    fontWeight: '700', 
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  }}>
    3
  </Text>
  <Text style={{ fontSize: 13, color: '#8e8e93', marginTop: 4 }}>
    Workouts
  </Text>
</View>
```

### Section Header

```jsx
<Text style={{
  fontSize: 13,
  fontWeight: '600',
  color: '#22c55e',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  marginBottom: 12,
}}>
  WEEKLY PROGRESS
</Text>
```

---

## File Organization

```
src/
├── theme/
│   ├── colors.ts       # Color palette
│   ├── typography.ts   # Text styles
│   ├── spacing.ts      # Spacing scale
│   └── index.ts        # Export all
├── components/
│   ├── Card.tsx
│   ├── Button.tsx
│   ├── ProgressRing.tsx
│   └── ...
└── screens/
    └── ...
```

---

## Usage in Claude Projects

When working on LiftTrack in Claude, reference this document and use prompts like:

> "Following the LiftTrack Design System, create a [component name] that [description]. Use the dark mode color palette with the green accent for interactive elements."

Or for specific fixes:

> "Update this component to match the LiftTrack Design System. Use surface (#1c1c1e) for the card background, accent (#22c55e) for the progress indicator, and add proper pressed state feedback."
