import { EXERCISES } from '@/data/exercises';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

type ExerciseGroup = {
  exerciseId: string;
  exerciseName: string;
  sets: { weight: number | null; reps: number | null; completed: number }[];
};

type Workout = {
  id: string;
  date: string;
  name: string | null;
  duration_seconds: number | null;
};

export default function WorkoutDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkout = async () => {
      if (!id) return;

      try {
        // Query 1: Get workout details
        const workoutData = await db.getFirstAsync<Workout>(
          'SELECT * FROM workouts WHERE id = ?',
          [id]
        );

        if (!workoutData) {
          setLoading(false);
          return;
        }

        setWorkout(workoutData);

        // Query 2: Get all sets for this workout
        const sets = await db.getAllAsync<{
          id: string;
          workout_id: string;
          exercise_id: string;
          weight: number | null;
          reps: number | null;
          completed: number;
          timestamp: string | null;
        }>('SELECT * FROM sets WHERE workout_id = ? ORDER BY timestamp ASC', [id]);

        // Group sets by exercise_id
        const groupedMap = new Map<string, { weight: number | null; reps: number | null; completed: number }[]>();

        sets.forEach((set) => {
          if (!groupedMap.has(set.exercise_id)) {
            groupedMap.set(set.exercise_id, []);
          }
          groupedMap.get(set.exercise_id)!.push({
            weight: set.weight,
            reps: set.reps,
            completed: set.completed,
          });
        });

        // Convert map to array and add exercise names
        const grouped: ExerciseGroup[] = Array.from(groupedMap.entries()).map(([exerciseId, sets]) => {
          const exercise = EXERCISES.find((ex) => ex.id === exerciseId);
          return {
            exerciseId,
            exerciseName: exercise?.name || 'Unknown Exercise',
            sets,
          };
        });

        setExerciseGroups(grouped);
      } catch (error) {
        console.error('Error loading workout:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, [id, db]);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds || seconds === 0) {
      return 'No duration';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes} min`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    return `${dayName}, ${month} ${day}, ${year}`;
  };

  if (loading) {
    return (
      <View style={{ backgroundColor: '#121212', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={{ backgroundColor: '#121212', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 16 }}>Workout not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: formatDate(workout.date) }} />
      <ScrollView style={{ backgroundColor: '#121212', flex: 1 }}>
        {/* Workout Summary Card */}
        <View
          style={{
            backgroundColor: '#1e1e1e',
            marginHorizontal: 16,
            marginTop: 16,
            marginBottom: 16,
            padding: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#2a2a2a',
          }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
            {workout.name || 'Untitled Workout'}
          </Text>
          <Text style={{ color: '#E5E5E5', fontSize: 14, marginBottom: 4 }}>
            {formatDate(workout.date)}
          </Text>
          <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '600' }}>
            Duration: {formatDuration(workout.duration_seconds)}
          </Text>
        </View>

        {/* Exercise Cards */}
        {exerciseGroups.map((group) => (
          <View
            key={group.exerciseId}
            style={{
              backgroundColor: '#1e1e1e',
              marginHorizontal: 16,
              marginBottom: 16,
              padding: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#2a2a2a',
            }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
              {group.exerciseName}
            </Text>
            {group.sets.map((set, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 6,
                  borderBottomWidth: index < group.sets.length - 1 ? 1 : 0,
                  borderBottomColor: '#2a2a2a',
                }}>
                <Text style={{ color: '#E5E5E5', fontSize: 14, flex: 1 }}>
                  Set {index + 1}:
                </Text>
                <Text style={{ color: '#E5E5E5', fontSize: 14, flex: 1, textAlign: 'right' }}>
                  {set.weight !== null ? `${set.weight} lbs` : '—'} × {set.reps !== null ? `${set.reps} reps` : '—'}
                  {set.completed === 1 && (
                    <Text style={{ color: '#10b981', marginLeft: 8 }}>✓</Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {exerciseGroups.length === 0 && (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 14 }}>No exercises recorded for this workout</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

