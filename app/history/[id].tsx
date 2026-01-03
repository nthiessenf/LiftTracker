import { deleteWorkout, updateWorkoutDetails } from '@/data/database/db';
import { EXERCISES } from '@/data/exercises';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');

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
        setEditName(workoutData.name || '');
        // Format date for input (YYYY-MM-DD)
        const dateObj = new Date(workoutData.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        setEditDate(`${year}-${month}-${day}`);

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

  const handleSave = async () => {
    if (!workout || !id) return;

    try {
      // Convert date to ISO string format
      const dateObj = new Date(editDate);
      const isoDate = dateObj.toISOString();

      await updateWorkoutDetails(db, id, editName || null, isoDate);
      
      // Update local state
      setWorkout({
        ...workout,
        name: editName || null,
        date: isoDate,
      });
      
      setIsEditing(false);
      Alert.alert('Success', 'Workout updated successfully!');
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to update workout. Please try again.');
    }
  };

  const handleDelete = () => {
    if (!id) return;

    Alert.alert('Delete Workout?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWorkout(db, id);
            router.back();
          } catch (error) {
            console.error('Error deleting workout:', error);
            Alert.alert('Error', 'Failed to delete workout. Please try again.');
          }
        },
      },
    ]);
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
      <Stack.Screen
        options={{
          title: formatDate(workout.date),
          headerRight: () => (
            <Pressable
              onPress={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              style={{ marginRight: 16 }}>
              <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '600' }}>
                {isEditing ? 'Save' : 'Edit'}
              </Text>
            </Pressable>
          ),
        }}
      />
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
          {isEditing ? (
            <>
              <Text style={{ color: '#E5E5E5', fontSize: 14, marginBottom: 8 }}>Workout Name</Text>
              <TextInput
                style={{
                  color: 'white',
                  backgroundColor: '#333',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#2a2a2a',
                  marginBottom: 16,
                }}
                placeholder="Enter workout name"
                placeholderTextColor="#999"
                value={editName}
                onChangeText={setEditName}
              />
              <Text style={{ color: '#E5E5E5', fontSize: 14, marginBottom: 8 }}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={{
                  color: 'white',
                  backgroundColor: '#333',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#2a2a2a',
                  marginBottom: 16,
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
                value={editDate}
                onChangeText={setEditDate}
              />
            </>
          ) : (
            <>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
                {workout.name || 'Untitled Workout'}
              </Text>
              <Text style={{ color: '#E5E5E5', fontSize: 14, marginBottom: 4 }}>
                {formatDate(workout.date)}
              </Text>
            </>
          )}
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

        {/* Delete Button (only visible when editing) */}
        {isEditing && (
          <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 32 }}>
            <Pressable
              onPress={handleDelete}
              style={{
                backgroundColor: '#ef4444',
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Delete Workout</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

