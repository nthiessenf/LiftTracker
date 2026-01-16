import { EXERCISES } from '@/data/exercises';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card, Button } from '@/components/ui';

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
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ backgroundColor: '#121212', flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 60,
            paddingHorizontal: 24,
            paddingBottom: 48,
          }}
          showsVerticalScrollIndicator={false}>
        {/* Custom Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
          }}>
          <Text style={{ fontSize: 24, color: '#10b981', marginRight: 8 }}>←</Text>
          <Text style={{ fontSize: 16, color: '#10b981', fontWeight: '500' }}>Back</Text>
        </TouchableOpacity>

        {/* Routine Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 32,
            fontWeight: '700',
            letterSpacing: -0.5,
            color: '#fff',
          }}>
            {routine.name}
          </Text>
          <Text style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 4,
          }}>
            {routine.exerciseIds.length} {routine.exerciseIds.length === 1 ? 'exercise' : 'exercises'}
          </Text>
        </View>

        {/* Exercise List */}
        {routine.exerciseIds.map((exerciseId, index) => {
          const exercise = EXERCISES.find((ex) => ex.id === exerciseId);
          return (
            <Card
              key={exerciseId}
              variant="default"
              style={{ marginBottom: 12 }}>
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
                  <Text style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: '#fff',
                  }}>
                    {exercise?.name || 'Unknown Exercise'}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: 4,
                  }}>
                    {exercise?.muscleGroup || 'Unknown'}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}

        {/* Start Workout Button */}
        <Button
          title="Start Workout"
          onPress={handleStartWorkout}
          variant="primary"
          size="default"
          style={{ marginTop: 32 }}
        />
        </ScrollView>
      </View>
    </>
  );
}
