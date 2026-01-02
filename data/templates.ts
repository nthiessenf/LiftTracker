export type WorkoutTemplate = {
  id: string;
  name: string;
  exerciseIds: string[];
};

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'workout-a',
    name: 'Workout A',
    exerciseIds: ['barbell-squat', 'bench-press', 'bent-over-row', 'hanging-leg-raise', 'bicep-curl'],
  },
  {
    id: 'workout-b',
    name: 'Workout B',
    exerciseIds: ['deadlift', 'overhead-press', 'pull-up', 'plank', 'face-pull'],
  },
];

