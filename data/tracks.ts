export type TrainingTrackRoutine = {
  id: string;
  name: string;
  exerciseIds: string[];
};

export type TrainingTrack = {
  key: string;
  name: string;
  description: string;
  routines: TrainingTrackRoutine[];
};

export const TRAINING_TRACKS: Record<string, TrainingTrack> = {
  FULL_BODY: {
    key: 'FULL_BODY',
    name: 'Full Body',
    description: 'Full body workouts covering all muscle groups',
    routines: [
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
    ],
  },
  PPL: {
    key: 'PPL',
    name: 'Push/Pull/Legs',
    description: 'Push, Pull, and Legs split routine',
    routines: [
      {
        id: 'push-a',
        name: 'Push A',
        exerciseIds: ['bench-press', 'overhead-press', 'tricep-pushdown', 'side-lateral-raise'],
      },
      {
        id: 'pull-a',
        name: 'Pull A',
        exerciseIds: ['bent-over-row', 'pull-up', 'bicep-curl', 'face-pull'],
      },
      {
        id: 'legs-a',
        name: 'Legs A',
        exerciseIds: ['barbell-squat', 'deadlift', 'hanging-leg-raise', 'plank'],
      },
    ],
  },
  UPPER_LOWER: {
    key: 'UPPER_LOWER',
    name: 'Upper/Lower',
    description: 'Upper body and lower body split routine',
    routines: [
      {
        id: 'upper-a',
        name: 'Upper A',
        exerciseIds: ['bench-press', 'bent-over-row', 'overhead-press', 'bicep-curl', 'tricep-pushdown'],
      },
      {
        id: 'lower-a',
        name: 'Lower A',
        exerciseIds: ['barbell-squat', 'deadlift', 'hanging-leg-raise', 'plank'],
      },
    ],
  },
};

