import { getRoutineDurationEstimate } from '@/data/database/db';
import { CardStyles } from '@/constants/Typography';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card, Button } from '../../components/ui';

type Routine = {
  id: string;
  name: string;
  exerciseIds: string[];
  lastPerformed: string | null;
  estimatedDuration: number; // in seconds
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
      console.log('DEBUG - Routines found:', routines.length, routines);

      // For each routine, fetch associated exercise IDs, last performed date, and estimated duration
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
          
          // Get estimated duration
          const estimatedDuration = await getRoutineDurationEstimate(db, routine.id);
          
          return {
            id: routine.id,
            name: routine.name,
            exerciseIds: exerciseRows.map((row) => row.exercise_id),
            lastPerformed: lastWorkout?.date || null,
            estimatedDuration,
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

  const getDaysAgo = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    // Extract date part if it's an ISO string
    let datePart = dateString;
    if (dateString.includes('T')) {
      datePart = dateString.split('T')[0];
    }
    
    // Parse manually to avoid timezone issues
    const parts = datePart.split('-');
    if (parts.length !== 3) {
      return 'Never';
    }
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    
    // Create date objects at noon to avoid timezone issues
    const workoutDate = new Date(year, month, day, 12, 0, 0);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = today.getTime() - workoutDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      if (minutes > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  const handleCardPress = (routineId: string) => {
    router.push(`/routines/detail/${routineId}`);
  };

  const renderRoutineItem = ({ item }: { item: Routine }) => {
    // Get relative time for last performed
    const lastPerformedText = getDaysAgo(item.lastPerformed);

    return (
      <Card
        variant="default"
        onPress={() => handleCardPress(item.id)}
        style={{ marginHorizontal: 24, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* LEFT SIDE: Text Info */}
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
              {item.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                Last: {lastPerformedText}
              </Text>
              {item.estimatedDuration > 0 && (
                <>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginHorizontal: 6 }}>•</Text>
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.4)" style={{ marginRight: 4 }} />
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                    {formatDuration(item.estimatedDuration)}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* RIGHT SIDE: Actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* More Menu: Horizontal dots, subtle color, with right margin */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleRoutineMenu(item);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                padding: 8,
                marginRight: 8,
              }}>
              <MaterialIcons name="more-horiz" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            {/* Start Button */}
            <Button
              title="Start"
              onPress={() => handleStartRoutine(item)}
              variant="primary"
              size="default"
            />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={{ backgroundColor: '#121212', flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 80,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Page Title */}
        <Text style={{
          fontSize: 32,
          fontWeight: '700',
          letterSpacing: -0.5,
          color: '#FFFFFF',
          marginBottom: 32,
          marginHorizontal: 24,
        }}>
          Workouts
        </Text>

        {/* Hero Card: Start Empty Workout */}
        <Pressable
          onPress={handleQuickStart}
          style={{
            backgroundColor: '#1e1e1e',
            padding: 16,
            marginHorizontal: 24,
            marginBottom: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#2a2a2a',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
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

        {/* Routines Header */}
        <View style={{ marginHorizontal: 24, marginTop: 32, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>Routines</Text>
            <TouchableOpacity
              onPress={handleCreateRoutine}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="add-circle-outline" size={28} color="#10b981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Routine Cards */}
        {userRoutines.length > 0 ? (
          userRoutines.map((routine) => (
            <View key={routine.id}>{renderRoutineItem({ item: routine })}</View>
          ))
        ) : (
          <View style={{ marginHorizontal: 24, marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontStyle: 'italic' }}>
              No routines yet. Create one to get started!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

