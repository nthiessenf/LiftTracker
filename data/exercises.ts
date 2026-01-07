export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  primary_focus: 'Quads' | 'Hamstrings' | 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Core';
  targetReps: number; // Default target
  alternatives?: string[]; // Array of exercise IDs that can be swapped
};

export const EXERCISES: Exercise[] = [
  // --- Workout A (Main) ---
  { id: 'barbell-squat', name: 'Barbell Squat', muscleGroup: 'Legs', primary_focus: 'Quads', targetReps: 5, alternatives: ['goblet-squat', 'leg-press'] },
  { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest', primary_focus: 'Chest', targetReps: 5, alternatives: ['dumbbell-bench-press', 'push-up'] },
  { id: 'bent-over-row', name: 'Bent-Over Row', muscleGroup: 'Back', primary_focus: 'Back', targetReps: 8, alternatives: ['seated-cable-row', 'dumbbell-row'] },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'Core', primary_focus: 'Core', targetReps: 12, alternatives: ['ab-wheel', 'russian-twist', 'leg-raise'] },
  { id: 'bicep-curl', name: 'Bicep Curl', muscleGroup: 'Arms', primary_focus: 'Biceps', targetReps: 12 },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'Arms', primary_focus: 'Triceps', targetReps: 12 },

  // --- Workout B (Main) ---
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back', primary_focus: 'Hamstrings', targetReps: 5, alternatives: ['romanian-deadlift'] },
  { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders', primary_focus: 'Shoulders', targetReps: 5, alternatives: ['seated-db-press'] },
  { id: 'pull-up', name: 'Pull Up', muscleGroup: 'Back', primary_focus: 'Back', targetReps: 8, alternatives: ['lat-pulldown'] },
  { id: 'plank', name: 'Plank', muscleGroup: 'Core', primary_focus: 'Core', targetReps: 60 },
  { id: 'face-pull', name: 'Face Pull', muscleGroup: 'Shoulders', primary_focus: 'Shoulders', targetReps: 15 },
  { id: 'side-lateral-raise', name: 'Side Lateral Raise', muscleGroup: 'Shoulders', primary_focus: 'Shoulders', targetReps: 12 },

  // --- Alternatives & Accessories ---
  { id: 'goblet-squat', name: 'Goblet Squat', muscleGroup: 'Legs', primary_focus: 'Quads', targetReps: 10 },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Legs', primary_focus: 'Quads', targetReps: 10 },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', muscleGroup: 'Chest', primary_focus: 'Chest', targetReps: 8 },
  { id: 'push-up', name: 'Push Up', muscleGroup: 'Chest', primary_focus: 'Chest', targetReps: 15 },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscleGroup: 'Back', primary_focus: 'Back', targetReps: 10 },
  { id: 'dumbbell-row', name: 'Dumbbell Row', muscleGroup: 'Back', primary_focus: 'Back', targetReps: 10 },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift (RDL)', muscleGroup: 'Legs', primary_focus: 'Hamstrings', targetReps: 8 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back', primary_focus: 'Back', targetReps: 10 },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', muscleGroup: 'Core', primary_focus: 'Core', targetReps: 10 },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroup: 'Core', primary_focus: 'Core', targetReps: 20 },
  { id: 'leg-raise', name: 'Lying Leg Raise', muscleGroup: 'Core', primary_focus: 'Core', targetReps: 15 },
  { id: 'seated-db-press', name: 'Seated DB Overhead Press', muscleGroup: 'Shoulders', primary_focus: 'Shoulders', targetReps: 10 },
];

