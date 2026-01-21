# LiftTrack 🏋️

A local-first fitness tracking app for iOS that helps lifters reduce decision fatigue at the gym through intelligent workout recommendations.

## 🎯 The Problem

Going to the gym shouldn't require making dozens of decisions. Most workout apps are glorified spreadsheets that force users to plan every detail in advance or freestyle completely—creating decision fatigue right when motivation is highest.

## 💡 The Solution

LiftTrack learns your training style during onboarding (Full Body, Push/Pull/Legs, or Upper/Lower) and automatically recommends what to train today based on:
- Your weekly training frequency goals
- Which routines you haven't done recently
- Your established workout patterns

**The core insight:** Training frequency determines optimal routine structure. Someone training 2-3x/week needs full body alternating workouts. Someone training 5-6x/week needs focused splits. LiftTrack builds this logic into the recommendation engine.

## ✨ Key Features

**Smart Recommendations**
- Automatic "Recommended for Today" suggestions based on your training style
- Rotation logic that prevents staleness while maintaining balance
- Contextual nudges ("last done 4 days ago") to inform decisions

**Seamless Tracking**
- Auto-fill from previous sets (progressive overload made easy)
- Built-in rest timer with visual countdown
- Resume abandoned workouts exactly where you left off

**Local-First Architecture**
- 100% offline capability—works in any gym
- Zero latency—instant response to every tap
- Privacy-focused—your data never leaves your device

**Glass-Morphism Design**
- Dark mode optimized for gym lighting
- Apple-inspired UI with subtle depth and transparency
- Warm accent colors (green, not clinical blue)

## 🛠️ Technical Stack

- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **Data:** SQLite + AsyncStorage (hybrid model for optimal performance)
- **Navigation:** Expo Router (file-based routing)
- **Styling:** NativeWind (Tailwind CSS for React Native)

**Architecture Highlight:** Hybrid data model separates static exercise definitions (code) from dynamic user logs (SQLite) for instant lookups without database overhead.

## 📱 Project Status

**Current State:** Feature-complete MVP with TestFlight distribution

**Recently Completed:**
- 4-screen onboarding flow with training style selection
- Workout state persistence (resume after app close)
- Full-screen rest timer with circular countdown
- Recommendation rotation algorithm
- Calendar-based workout history

**In Progress:**
- Repeat Workout feature (one-tap redo past workouts)
- Body heatmap visualization (muscle recovery tracking)
- Demo video for App Store submission

## 🎓 Development Approach

Built by a non-technical Product Manager using Cursor AI as the primary development tool. This project demonstrates:
- **Product thinking:** Building from user needs, not tech constraints
- **AI-assisted development:** Leveraging modern tools to ship without a traditional engineering background
- **Systematic iteration:** Component-first approach with thorough testing between changes

## 📂 Project Structure
```
app/
├── (tabs)/           # Main navigation (Dashboard, Start, Library, History, Settings)
├── session/          # Active workout and rest timer
├── routines/         # Routine creation and management
├── history/          # Workout detail and editing
└── onboarding.tsx    # First-time user flow

data/
├── database/         # SQLite initialization and migrations
├── exercises.ts      # Static exercise definitions (source of truth)
├── tracks.ts         # Training style templates (Full Body, PPL, Upper/Lower)
└── services/         # Backup/restore functionality

components/
└── ui/               # Reusable glass-morphism Card and Button components
```

## 🚀 Local Development
```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start

# iOS Simulator (requires Xcode)
npx expo start --ios

# Physical device via Expo Go
# Scan QR code in Expo Go app
```

## 📋 Key Files

- **`cursorrules.md`** - Complete project context and system prompts for AI development
- **`data/exercises.ts`** - Exercise library (static source of truth)
- **`data/tracks.ts`** - Pre-built routine templates by training style
- **`ui-redesign-progress.md`** - Design decisions and critical learnings

## 🎨 Design Principles

1. **Minimal decisions at the gym** - Recommend don't overwhelm
2. **Glass-morphism with warmth** - Premium feel without sterile coldness
3. **One primary CTA per screen** - Clear hierarchy reduces cognitive load
4. **Contextual learning** - Teach concepts during use, not separate tutorials

## 📖 Lessons Learned

Building this as a non-technical PM taught me:
- **AI tools unlock agency:** Cursor AI made shipping a real product possible without traditional coding
- **Product sense matters more than code:** Understanding user workflows drives better architecture decisions
- **Component-first development:** Building reusable patterns prevents inconsistency at scale
- **Testing in production context:** Expo Go + TestFlight caught issues that local testing missed

## 🔮 Future Vision

- **Community templates:** User-submitted routines with built-in variety
- **Form check integration:** AI-powered video analysis for technique feedback
- **Workout reminders:** Smart notifications based on training patterns (not arbitrary schedules)

## 📬 Contact

Built by Nikolas Thiessen  
https://www.linkedin.com/in/nthiessen/  | niko-thiessen.com

---

**Note:** This is a portfolio project demonstrating product management skills, AI-assisted development, and UX design thinking. Currently available on Test Flight in the App Store.
