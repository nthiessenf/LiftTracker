import { EXERCISES } from '@/data/exercises';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

type PersonalRecord = {
  pr: number | null;
  reps: number | null;
};

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [personalRecord, setPersonalRecord] = useState<PersonalRecord | null>(null);

  // Find exercise from static data
  const exercise = EXERCISES.find((ex) => ex.id === id);

  // Load personal record from database
  useEffect(() => {
    const loadPersonalRecord = async () => {
      if (!id) return;

      try {
        const result = await db.getFirstAsync<{ pr: number | null; reps: number | null }>(
          'SELECT MAX(weight) as pr, MAX(reps) as reps FROM sets WHERE exercise_id = ?',
          [id]
        );

        if (result) {
          setPersonalRecord({
            pr: result.pr,
            reps: result.reps,
          });
        } else {
          setPersonalRecord({ pr: null, reps: null });
        }
      } catch (error) {
        console.error('Error loading personal record:', error);
        setPersonalRecord({ pr: null, reps: null });
      }
    };

    loadPersonalRecord();
  }, [id, db]);

  if (!exercise) {
    return (
      <>
        <Stack.Screen options={{ title: 'Exercise Not Found' }} />
        <View style={{ backgroundColor: '#121212', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18 }}>Exercise not found</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: exercise.name }} />
      <ScrollView
        style={{ backgroundColor: '#121212', flex: 1 }}
        contentContainerStyle={{ padding: 16 }}>
        {/* Exercise Title */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
            {exercise.name}
          </Text>
          <Text style={{ color: '#999', fontSize: 16 }}>{exercise.muscleGroup}</Text>
        </View>

        {/* Personal Record Card */}
        <View
          style={{
            backgroundColor: '#1e1e1e',
            padding: 20,
            borderRadius: 12,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#2a2a2a',
          }}>
          <Text style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>All-Time Best</Text>
          {personalRecord?.pr ? (
            <View>
              <Text style={{ color: '#10b981', fontSize: 32, fontWeight: 'bold', marginBottom: 4 }}>
                {personalRecord.pr} lbs
              </Text>
              {personalRecord.reps && (
                <Text style={{ color: '#999', fontSize: 14 }}>Best Reps: {personalRecord.reps}</Text>
              )}
            </View>
          ) : (
            <Text style={{ color: '#666', fontSize: 18, fontStyle: 'italic' }}>No records yet</Text>
          )}
        </View>

        {/* Exercise Info */}
        <View
          style={{
            backgroundColor: '#1e1e1e',
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#2a2a2a',
          }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Exercise Details
          </Text>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>Muscle Group</Text>
            <Text style={{ color: 'white', fontSize: 16 }}>{exercise.muscleGroup}</Text>
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>Target Reps</Text>
            <Text style={{ color: 'white', fontSize: 16 }}>{exercise.targetReps}</Text>
          </View>
          {exercise.alternatives && exercise.alternatives.length > 0 && (
            <View>
              <Text style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>Alternatives</Text>
              {exercise.alternatives.map((altId) => {
                const altExercise = EXERCISES.find((ex) => ex.id === altId);
                return altExercise ? (
                  <Text key={altId} style={{ color: '#10b981', fontSize: 14, marginBottom: 4 }}>
                    • {altExercise.name}
                  </Text>
                ) : null;
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

