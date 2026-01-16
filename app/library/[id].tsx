import { EXERCISES } from '@/data/exercises';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '@/components/ui';

type PersonalRecord = {
  pr: number | null;
  reps: number | null;
};

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const navigation = useNavigation();
  const [personalRecord, setPersonalRecord] = useState<PersonalRecord | null>(null);

  // Hide native header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

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
      <View style={{ backgroundColor: '#121212', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 18 }}>Exercise not found</Text>
      </View>
    );
  }

  // Get alternative exercise names
  const alternativeNames = exercise.alternatives
    ? exercise.alternatives
        .map((altId) => EXERCISES.find((ex) => ex.id === altId)?.name)
        .filter((name): name is string => name !== undefined)
    : [];

  return (
    <View style={{ backgroundColor: '#121212', flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
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

        {/* Exercise Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 32,
            fontWeight: '700',
            color: '#fff',
            letterSpacing: -0.5,
          }}>
            {exercise.name}
          </Text>
          <Text style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 4,
          }}>
            {exercise.muscleGroup}
          </Text>
        </View>

        {/* Personal Record Card */}
        <Card variant="accent" style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#10b981',
            marginBottom: 12,
          }}>
            Personal Record
          </Text>
          {personalRecord?.pr ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 }}>
                <Text style={{
                  fontSize: 32,
                  fontWeight: '700',
                  color: '#10b981',
                }}>
                  {personalRecord.pr}
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.5)',
                  marginLeft: 4,
                }}>
                  lbs
                </Text>
              </View>
              {personalRecord.reps && (
                <Text style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: 4,
                }}>
                  Best: {personalRecord.reps} reps
                </Text>
              )}
            </View>
          ) : (
            <Text style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.4)',
              fontStyle: 'italic',
            }}>
              No records yet
            </Text>
          )}
        </Card>

        {/* Exercise Info Card */}
        <Card variant="default">
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#fff',
            marginBottom: 12,
          }}>
            Exercise Info
          </Text>
          
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
            }}>
              Muscle Group
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#fff',
              marginTop: 2,
            }}>
              {exercise.muscleGroup}
            </Text>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
            }}>
              Target Reps
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#fff',
              marginTop: 2,
            }}>
              {exercise.targetReps}
            </Text>
          </View>

          {alternativeNames.length > 0 && (
            <View>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.5)',
              }}>
                Alternatives
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#fff',
                marginTop: 2,
              }}>
                {alternativeNames.join(', ')}
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

