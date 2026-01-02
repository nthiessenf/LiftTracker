export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  targetReps: number; // Default target
  alternatives?: string[]; // Array of exercise IDs that can be swapped
};

export const EXERCISES: Exercise[] = [
  // --- Workout A (Main) ---
  { id: 'barbell-squat', name: 'Barbell Squat', muscleGroup: 'Legs', targetReps: 5, alternatives: ['goblet-squat', 'leg-press'] },
  { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest', targetReps: 5, alternatives: ['dumbbell-bench-press', 'push-up'] },
  { id: 'bent-over-row', name: 'Bent-Over Row', muscleGroup: 'Back', targetReps: 8, alternatives: ['seated-cable-row', 'dumbbell-row'] },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'Core', targetReps: 12, alternatives: ['ab-wheel', 'russian-twist', 'leg-raise'] },
  { id: 'bicep-curl', name: 'Bicep Curl', muscleGroup: 'Arms', targetReps: 12 },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'Arms', targetReps: 12 },

  // --- Workout B (Main) ---
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back', targetReps: 5, alternatives: ['romanian-deadlift'] },
  { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders', targetReps: 5, alternatives: ['seated-db-press'] },
  { id: 'pull-up', name: 'Pull Up', muscleGroup: 'Back', targetReps: 8, alternatives: ['lat-pulldown'] },
  { id: 'plank', name: 'Plank', muscleGroup: 'Core', targetReps: 60 },
  { id: 'face-pull', name: 'Face Pull', muscleGroup: 'Shoulders', targetReps: 15 },
  { id: 'side-lateral-raise', name: 'Side Lateral Raise', muscleGroup: 'Shoulders', targetReps: 12 },

  // --- Alternatives & Accessories ---
  { id: 'goblet-squat', name: 'Goblet Squat', muscleGroup: 'Legs', targetReps: 10 },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Legs', targetReps: 10 },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', muscleGroup: 'Chest', targetReps: 8 },
  { id: 'push-up', name: 'Push Up', muscleGroup: 'Chest', targetReps: 15 },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscleGroup: 'Back', targetReps: 10 },
  { id: 'dumbbell-row', name: 'Dumbbell Row', muscleGroup: 'Back', targetReps: 10 },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift (RDL)', muscleGroup: 'Legs', targetReps: 8 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back', targetReps: 10 },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', muscleGroup: 'Core', targetReps: 10 },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroup: 'Core', targetReps: 20 },
  { id: 'leg-raise', name: 'Lying Leg Raise', muscleGroup: 'Core', targetReps: 15 },
  { id: 'seated-db-press', name: 'Seated DB Overhead Press', muscleGroup: 'Shoulders', targetReps: 10 },
];

