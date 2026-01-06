export type RoutineTemplate = {
  id: string;
  name: string;
  description: string;
  exerciseIds: string[];
};

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'full-body-a',
    name: 'Full Body A',
    description: 'Squat, Bench, Row, Core, Arms',
    exerciseIds: [
      'barbell-squat',
      'bench-press',
      'bent-over-row',
      'hanging-leg-raise',
      'bicep-curl',
    ],
  },
  {
    id: 'full-body-b',
    name: 'Full Body B',
    description: 'Deadlift, Press, Pull, Core, Shoulders',
    exerciseIds: [
      'deadlift',
      'overhead-press',
      'pull-up',
      'plank',
      'face-pull',
    ],
  },
  {
    id: 'push',
    name: 'Push Day',
    description: 'Chest, Shoulders, Triceps',
    exerciseIds: [
      'bench-press',
      'overhead-press',
      'tricep-pushdown',
      'side-lateral-raise',
    ],
  },
  {
    id: 'pull',
    name: 'Pull Day',
    description: 'Back, Biceps, Rear Delts',
    exerciseIds: [
      'pull-up',
      'bent-over-row',
      'bicep-curl',
      'face-pull',
    ],
  },
  {
    id: 'legs',
    name: 'Leg Day',
    description: 'Squats, Deadlifts, Leg Accessories',
    exerciseIds: [
      'barbell-squat',
      'deadlift',
      'romanian-deadlift',
      'leg-press',
    ],
  },
];

