import { Exercise, EXERCISES } from '@/data/exercises';
import { WORKOUT_TEMPLATES, WorkoutTemplate } from '@/data/templates';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Routine = {
  id: string;
  name: string;
  exerciseIds: string[];
  lastPerformed: string | null;
};

export default function WorkoutsScreen() {
  const db = useSQLiteContext();
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);
  const [libraryVisible, setLibraryVisible] = useState(false);

  const loadUserRoutines = useCallback(async () => {
    try {
      // Fetch all routines
      const routines = await db.getAllAsync<{ id: string; name: string }>(
        'SELECT id, name FROM routines ORDER BY created_at DESC'
      );

      // For each routine, fetch associated exercise IDs and last performed date
      const routinesWithExercises: Routine[] = await Promise.all(
        routines.map(async (routine) => {
          const exerciseRows = await db.getAllAsync<{ exercise_id: string }>(
            'SELECT exercise_id FROM routine_exercises WHERE routine_id = ? ORDER BY order_index ASC',
            [routine.id]
          );
          
          // Find the most recent workout that matches this routine name
          const lastWorkout = await db.getFirstAsync<{ date: string }>(
            'SELECT date FROM workouts WHERE name = ? ORDER BY date DESC LIMIT 1',
            [routine.name]
          );
          
          return {
            id: routine.id,
            name: routine.name,
            exerciseIds: exerciseRows.map((row) => row.exercise_id),
            lastPerformed: lastWorkout?.date || null,
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

  const handleQuickStart = async () => {
    try {
      const workoutId = Date.now().toString();
      const workoutDate = new Date().toISOString();

      // Insert a new workout with name "Freestyle Workout"
      await db.runAsync(
        'INSERT INTO workouts (id, date, name, duration_seconds) VALUES (?, ?, ?, ?)',
        [workoutId, workoutDate, 'Freestyle Workout', 0]
      );

      // Navigate to active session with workoutId
      router.push({
        pathname: '/session/active',
        params: { workoutId },
      });
    } catch (error) {
      console.error('Error creating quick start workout:', error);
      Alert.alert('Error', 'Failed to start workout. Please try again.');
    }
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

  const handleDuplicateRoutine = async (routine: Routine) => {
    try {
      const newRoutineId = Date.now().toString();
      const newRoutineName = `${routine.name} (Copy)`;
      const now = new Date().toISOString();

      // Create the new routine
      await db.runAsync(
        'INSERT INTO routines (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [newRoutineId, newRoutineName, now, now]
      );

      // Copy all exercises
      for (let i = 0; i < routine.exerciseIds.length; i++) {
        const exerciseId = routine.exerciseIds[i];
        const routineExerciseId = `${Date.now()}-${i}-${Math.random()}`;
        await db.runAsync(
          'INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) VALUES (?, ?, ?, ?)',
          [routineExerciseId, newRoutineId, exerciseId, i]
        );
      }

      // Reload the list
      await loadUserRoutines();
      Alert.alert('Success', 'Routine duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating routine:', error);
      Alert.alert('Error', 'Failed to duplicate routine. Please try again.');
    }
  };

  const handleRoutineMenu = (routine: Routine) => {
    Alert.alert(
      routine.name,
      'Choose an action',
      [
        {
          text: 'Edit Routine',
          onPress: () => handleEdit(routine.id),
        },
        {
          text: 'Duplicate',
          onPress: () => handleDuplicateRoutine(routine),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteRoutine(routine.id),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const formatDateSafe = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    // Extract date part if it's an ISO string
    let datePart = dateString;
    if (dateString.includes('T')) {
      datePart = dateString.split('T')[0];
    }
    
    // Parse manually to avoid timezone issues
    const parts = datePart.split('-');
    if (parts.length !== 3) {
      return dateString;
    }
    
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parts[2];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${months[month - 1]} ${day}, ${year}`;
  };

  const renderRoutineItem = ({ item }: { item: Routine }) => {
    // Format last performed date for compact display
    const lastPerformedText = item.lastPerformed
      ? formatDateSafe(item.lastPerformed).split(',')[0] // Just "Jan 04" part
      : 'Never';

    // Count exercises
    const exerciseCount = item.exerciseIds.length;

    return (
      <View
        style={{
          backgroundColor: '#27272a', // bg-zinc-800
          padding: 16, // p-4
          marginBottom: 12, // mb-3
          marginHorizontal: 16,
          borderRadius: 12, // rounded-xl
          flexDirection: 'row', // flex-row
          alignItems: 'center', // items-center
          justifyContent: 'space-between', // justify-between
          borderWidth: 1,
          borderColor: '#3f3f46', // border-zinc-700/50
        }}>
        {/* LEFT SIDE: Text Info */}
        <View style={{ flex: 1, marginRight: 16 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
            {item.name}
          </Text>
          <Text style={{ color: '#a1a1aa', fontSize: 14 }}>
            {exerciseCount} {exerciseCount === 1 ? 'Exercise' : 'Exercises'} • Last: {lastPerformedText}
          </Text>
        </View>

        {/* RIGHT SIDE: Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* More Menu: Horizontal dots, subtle color, with right margin */}
          <TouchableOpacity
            onPress={() => handleRoutineMenu(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              padding: 8,
              marginRight: 8, // mr-2
            }}>
            <MaterialIcons name="more-horiz" size={20} color="#71717a" />
          </TouchableOpacity>

          {/* Start Button: Rounded-lg to match templates (not full pill) */}
          <TouchableOpacity
            onPress={() => handleStartRoutine(item)}
            style={{
              backgroundColor: '#10b981', // bg-emerald-500
              paddingHorizontal: 20, // px-5
              paddingVertical: 8, // py-2
              borderRadius: 8, // rounded-lg (changed from rounded-full)
            }}>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Start</Text>
          </TouchableOpacity>
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
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setLibraryVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginRight: 16 }}>
              <Ionicons name="book-outline" size={24} color="#10b981" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={{ backgroundColor: '#121212', flex: 1 }}>
        <FlatList
        ListHeaderComponent={
          <>
            {/* Hero Card: Start Empty Workout */}
            <Pressable
              onPress={handleQuickStart}
              style={{
                backgroundColor: '#18181b', // bg-zinc-900 (slightly darker than cards)
                marginHorizontal: 16,
                marginTop: 16,
                marginBottom: 24, // mb-6
                padding: 16, // p-4
                borderRadius: 12, // rounded-xl
                flexDirection: 'row', // flex-row
                alignItems: 'center', // items-center
                justifyContent: 'space-between', // justify-between
                borderWidth: 1,
                borderColor: '#10b981', // border-emerald-500 (50% opacity would be rgba(16, 185, 129, 0.5))
              }}>
              {/* Left Side: Icon + Text */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <MaterialIcons name="add-circle" size={24} color="#10b981" />
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 12 }}>
                  Start Empty Workout
                </Text>
              </View>
              {/* Right Side: Chevron */}
              <MaterialIcons name="chevron-right" size={20} color="#10b981" />
            </Pressable>

            {/* Search & Browse Bar */}
            <View
              style={{
                backgroundColor: '#18181b', // bg-zinc-900
                marginHorizontal: 16,
                marginBottom: 24, // mb-6
                padding: 12, // p-3
                borderRadius: 12, // rounded-xl
                flexDirection: 'row', // flex-row
                alignItems: 'center', // items-center
              }}>
              {/* Left: Search Icon */}
              <Ionicons name="search" size={20} color="#71717a" />
              
              {/* Middle: Search Input */}
              <TextInput
                placeholder="Find routines..."
                placeholderTextColor="#71717a"
                style={{
                  flex: 1,
                  marginLeft: 12,
                  color: 'white',
                  fontSize: 16,
                }}
              />
            </View>

            {/* My Routines Header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>My Routines</Text>
                <TouchableOpacity
                  onPress={handleCreateRoutine}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="add-circle-outline" size={28} color="#10b981" />
                </TouchableOpacity>
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
          </>
        }
        data={[]}
        renderItem={() => null}
        keyExtractor={() => ''}
        contentContainerStyle={{ paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Exercise Library Modal */}
      <Modal
        visible={libraryVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLibraryVisible(false)}>
        <View style={{ backgroundColor: '#121212', flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: 60,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#2a2a2a',
            }}>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Exercise Library</Text>
            <TouchableOpacity
              onPress={() => setLibraryVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Exercise List */}
          <FlatList
            data={EXERCISES}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 8 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
      </View>
    </>
  );
}

