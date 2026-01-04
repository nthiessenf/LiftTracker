# Liftrack - Local-First Workout Tracker

An offline-first workout tracking application built with **React Native**, **Expo**, and **SQLite**.

Unlike most fitness apps that require subscriptions and cloud accounts, this project is designed for complete data sovereignty. All data lives on the device, belongs to the user, and can be exported at any time.

## 🚀 Key Features

### 🏋️ Active Workout Tracking
- **Real-time Logging:** Log sets, reps, and weights with an optimized, distraction-free UI.
- **Auto-Timer:** Configurable rest timer that auto-starts after logging a set.
- **Exercise Library:** searchable database of exercises.

### 📝 History & Editing (Deep Edit)
- **Complete Control:** Fix mistakes in past workouts anytime.
- **Deep Editing:** Edit individual set details (weight/reps), rename sessions, or change dates.
- **Smart Date Handling:** Custom date parsing ensures your workout history is accurate regardless of timezone changes.

### 🔒 Data & Privacy
- **Offline First:** No internet connection required. No account creation needed.
- **Local Database:** Powered by SQLite for instant loading and robust data integrity.
- **JSON Export:** Full database export feature allows you to back up your data to a raw JSON file for safekeeping or analysis.

---

## 🛠 Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) (via [Expo SDK 52](https://expo.dev/))
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/)

---

## ⚡ Getting Started

### Prerequisites
- Node.js installed
- Expo Go app installed on your physical device (iOS/Android) or a Simulator

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
   cd your-repo-name
