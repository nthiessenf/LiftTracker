import { EXERCISES } from '@/data/exercises';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type RoutineDetail = {
  id: string;
  name: string;
  exerciseIds: string[];
};

export default function RoutineDetailScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<RoutineDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRoutine = useCallback(async () => {
    if (!id) return;

    try {
      // Get routine name
      const routineData = await db.getFirstAsync<{ id: string; name: string }>(
        'SELECT id, name FROM routines WHERE id = ?',
        [id]
      );

      if (!routineData) {
        setLoading(false);
        return;
      }

      // Get exercise IDs
      const exerciseRows = await db.getAllAsync<{ exercise_id: string }>(
        'SELECT exercise_id FROM routine_exercises WHERE routine_id = ? ORDER BY order_index ASC',
        [id]
      );

      setRoutine({
        id: routineData.id,
        name: routineData.name,
        exerciseIds: exerciseRows.map((row) => row.exercise_id),
      });
    } catch (error) {
      console.error('Error loading routine:', error);
    } finally {
      setLoading(false);
    }
  }, [id, db]);

  useEffect(() => {
    loadRoutine();
  }, [loadRoutine]);

  const handleStartWorkout = () => {
    if (!routine) return;

    router.push({
      pathname: '/session/active',
      params: {
        templateId: routine.id,
        exerciseIds: routine.exerciseIds.join(','),
      },
    });
  };

  if (loading) {
    return (
      <View style={{ backgroundColor: '#121212', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={{ backgroundColor: '#121212', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 16 }}>Routine not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: routine.name }} />
      <View style={{ backgroundColor: '#121212', flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* Routine Name */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
              {routine.name}
            </Text>
            <Text style={{ color: '#999', fontSize: 16 }}>
              {routine.exerciseIds.length} {routine.exerciseIds.length === 1 ? 'exercise' : 'exercises'}
            </Text>
          </View>

          {/* Exercise List */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
              Exercises
            </Text>
            {routine.exerciseIds.map((exerciseId, index) => {
              const exercise = EXERCISES.find((ex) => ex.id === exerciseId);
              return (
                <View
                  key={exerciseId}
                  style={{
                    backgroundColor: '#1e1e1e',
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#2a2a2a',
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#10b981',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}>
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                        {exercise?.name || 'Unknown Exercise'}
                      </Text>
                      <Text style={{ color: '#999', fontSize: 14, marginTop: 4 }}>
                        {exercise?.muscleGroup || 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Start Workout Button */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 32,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: '#2a2a2a',
            backgroundColor: '#121212',
          }}>
          <TouchableOpacity
            onPress={handleStartWorkout}
            style={{
              backgroundColor: '#10b981',
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

