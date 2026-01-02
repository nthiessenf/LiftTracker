import { Exercise, EXERCISES } from '@/data/exercises';
import { WORKOUT_TEMPLATES, WorkoutTemplate } from '@/data/templates';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native';

type Routine = {
  id: string;
  name: string;
  exerciseIds: string[];
};

export default function WorkoutsScreen() {
  const db = useSQLiteContext();
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);

  const loadUserRoutines = useCallback(async () => {
    try {
      // Fetch all routines
      const routines = await db.getAllAsync<{ id: string; name: string }>(
        'SELECT id, name FROM routines ORDER BY created_at DESC'
      );

      // For each routine, fetch associated exercise IDs ordered by order_index
      const routinesWithExercises: Routine[] = await Promise.all(
        routines.map(async (routine) => {
          const exerciseRows = await db.getAllAsync<{ exercise_id: string }>(
            'SELECT exercise_id FROM routine_exercises WHERE routine_id = ? ORDER BY order_index ASC',
            [routine.id]
          );
          
          return {
            id: routine.id,
            name: routine.name,
            exerciseIds: exerciseRows.map((row) => row.exercise_id),
          };
        })
      );

      setUserRoutines(routinesWithExercises);
    } catch (error) {
      console.error('Error loading routines:', error);
      setUserRoutines([]);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadUserRoutines();
    }, [loadUserRoutines])
  );

  const handleStartTemplate = (template: WorkoutTemplate) => {
    router.push({
      pathname: '/session/active',
      params: {
        templateId: template.id,
        exerciseIds: template.exerciseIds.join(','),
      },
    });
  };

  const handleStartRoutine = (routine: Routine) => {
    router.push({
      pathname: '/session/active',
      params: {
        templateId: routine.id,
        exerciseIds: routine.exerciseIds.join(','),
      },
    });
  };

  const handleCreateRoutine = () => {
    router.push('/routines/create');
  };

  const renderTemplateItem = ({ item }: { item: WorkoutTemplate }) => {
    return (
      <View
        style={{
          backgroundColor: '#333',
          padding: 15,
          marginBottom: 10,
          marginHorizontal: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#2a2a2a',
        }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
              {item.name}
            </Text>
            <Text style={{ color: '#E5E5E5', fontSize: 14 }}>
              {item.exerciseIds.length} {item.exerciseIds.length === 1 ? 'Exercise' : 'Exercises'}
            </Text>
          </View>
          <Pressable
            onPress={() => handleStartTemplate(item)}
            style={{
              backgroundColor: '#10b981',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
            }}>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Start</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const handleEdit = (routineId: string) => {
    router.push(`/routines/${routineId}`);
  };

  const handleDeleteRoutine = async (routineId: string) => {
    Alert.alert('Delete Routine?', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.runAsync('DELETE FROM routines WHERE id = ?', [routineId]);
            // Reload the list
            await loadUserRoutines();
          } catch (error) {
            console.error('Error deleting routine:', error);
            Alert.alert('Error', 'Failed to delete routine. Please try again.');
          }
        },
      },
    ]);
  };

  const renderRoutineItem = ({ item }: { item: Routine }) => {
    return (
      <View
        style={{
          backgroundColor: '#1e1e1e',
          padding: 15,
          marginBottom: 10,
          marginHorizontal: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#2a2a2a',
        }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
              {item.name}
            </Text>
            <Text style={{ color: '#E5E5E5', fontSize: 14 }}>
              {item.exerciseIds.length} {item.exerciseIds.length === 1 ? 'Exercise' : 'Exercises'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => handleEdit(item.id)}
              style={{
                padding: 8,
                marginRight: 8,
              }}>
              <MaterialIcons name="edit" size={20} color="#aaa" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteRoutine(item.id)}
              style={{
                padding: 8,
                marginRight: 8,
              }}>
              <MaterialIcons name="delete" size={20} color="#ef4444" />
            </TouchableOpacity>
            <Pressable
              onPress={() => handleStartRoutine(item)}
              style={{
                backgroundColor: '#10b981',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Start</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    return (
      <View
        style={{
          backgroundColor: '#1e1e1e',
          marginHorizontal: 16,
          marginVertical: 8,
          padding: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#2a2a2a',
        }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
          {item.name}
        </Text>
        <Text style={{ color: '#E5E5E5', fontSize: 14 }}>{item.muscleGroup}</Text>
      </View>
    );
  };

  return (
    <View style={{ backgroundColor: '#121212', flex: 1 }}>
      <FlatList
        ListHeaderComponent={
          <>
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>My Routines</Text>
                <Pressable
                  onPress={handleCreateRoutine}
                  style={{
                    backgroundColor: '#10b981',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>+ Create</Text>
                </Pressable>
              </View>
            </View>
            {userRoutines.length > 0 ? (
              userRoutines.map((routine) => (
                <View key={routine.id}>{renderRoutineItem({ item: routine })}</View>
              ))
            ) : (
              <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                <Text style={{ color: '#666', fontSize: 14, fontStyle: 'italic' }}>
                  No custom routines yet. Create one to get started!
                </Text>
              </View>
            )}

            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 12 }}>
                Quick Start Routines
              </Text>
            </View>
            {WORKOUT_TEMPLATES.map((template) => (
              <View key={template.id}>{renderTemplateItem({ item: template })}</View>
            ))}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 12 }}>
                All Exercises
              </Text>
            </View>
          </>
        }
        data={EXERCISES}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

