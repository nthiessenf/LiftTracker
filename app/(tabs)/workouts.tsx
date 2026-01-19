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
  const [nextWorkout, setNextWorkout] = useState<{ id: string; name: string; exerciseIds: string[]; estimatedDuration: number } | null>(null);

  const loadUserRoutines = useCallback(async () => {
    try {
      // Fetch all routines with last_used_date, sorted by last used (most recent first), then alphabetically
      // SQLite puts NULLs last when using DESC, so routines never used appear at bottom
      const routines = await db.getAllAsync<{ id: string; name: string; last_used_date: string | null }>(
        `SELECT 
          r.id, 
          r.name, 
          (SELECT MAX(date) FROM workouts WHERE routine_id = r.id) as last_used_date
        FROM routines r 
        WHERE r.is_temporary = 0 
        ORDER BY last_used_date DESC, r.name ASC`
      );
      console.log('DEBUG - Routines found:', routines.length, routines);
      console.log('Fetched routines:', routines);

      // For each routine, fetch associated exercise IDs and estimated duration
      const routinesWithExercises: Routine[] = await Promise.all(
        routines.map(async (routine) => {
          const exerciseRows = await db.getAllAsync<{ exercise_id: string }>(
            'SELECT exercise_id FROM routine_exercises WHERE routine_id = ? ORDER BY order_index ASC',
            [routine.id]
          );
          
          // Get estimated duration
          const estimatedDuration = await getRoutineDurationEstimate(db, routine.id);
          
          return {
            id: routine.id,
            name: routine.name,
            exerciseIds: exerciseRows.map((row) => row.exercise_id),
            lastPerformed: routine.last_used_date || null,
            estimatedDuration,
          };
        })
      );

      setUserRoutines(routinesWithExercises);

      // Determine next workout using routine_id rotation (same logic as Dashboard)
      if (routines.length === 0) {
        setNextWorkout(null);
      } else {
        // Get the most recent workout's routine_id
        const lastWorkout = await db.getFirstAsync<{ routine_id: string | null }>(
          'SELECT routine_id FROM workouts ORDER BY date DESC LIMIT 1'
        );

        // Get all routines ordered by id ASC (for consistent rotation)
        const allRoutines = await db.getAllAsync<{ id: string; name: string }>(
          'SELECT id, name FROM routines WHERE is_temporary = 0 ORDER BY id ASC'
        );

        let nextRoutineIndex = 0; // Default to first routine

        // Rotation logic
        if (lastWorkout?.routine_id) {
          // Find the index of the last workout's routine
          const lastRoutineIndex = allRoutines.findIndex((r) => r.id === lastWorkout.routine_id);
          
          if (lastRoutineIndex !== -1) {
            // Routine found: rotate to next (wrap around with modulo)
            nextRoutineIndex = (lastRoutineIndex + 1) % allRoutines.length;
          }
        }

        // Safety check: ensure nextRoutineIndex is valid
        if (nextRoutineIndex >= 0 && nextRoutineIndex < allRoutines.length) {
          const nextRoutine = allRoutines[nextRoutineIndex];

          // Get exercise IDs for the next routine
          const routineExercises = await db.getAllAsync<{ exercise_id: string; order_index: number }>(
            'SELECT exercise_id, order_index FROM routine_exercises WHERE routine_id = ? ORDER BY order_index',
            [nextRoutine.id]
          );

          const exerciseIds = routineExercises.map((row) => row.exercise_id);
          
          // Get estimated duration
          const estimatedDuration = await getRoutineDurationEstimate(db, nextRoutine.id);

          setNextWorkout({
            id: nextRoutine.id,
            name: nextRoutine.name,
            exerciseIds: exerciseIds,
            estimatedDuration,
          });
        } else {
          setNextWorkout(null);
        }
      }
    } catch (error) {
      console.error('Error loading routines:', error);
      setUserRoutines([]);
      setNextWorkout(null);
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

  const handleStartNextWorkout = () => {
    if (nextWorkout) {
      router.push({
        pathname: '/session/active',
        params: {
          templateId: nextWorkout.id,
          exerciseIds: nextWorkout.exerciseIds.join(','),
        },
      });
    }
  };

  const getRecommendationContext = (): string => {
    if (!nextWorkout) return '';
    
    // Find the recommended routine in userRoutines to get last performed date
    const recommendedRoutine = userRoutines.find((r) => r.id === nextWorkout.id);
    
    if (recommendedRoutine?.lastPerformed) {
      const daysAgo = getDaysAgo(recommendedRoutine.lastPerformed);
      if (daysAgo === 'Never') {
        return '';
      } else if (daysAgo === 'Today' || daysAgo === 'Yesterday') {
        return '';
      } else {
        return `Last done ${daysAgo}`;
      }
    }
    
    return '';
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
        onPress={() => handleStartRoutine(item)}
        style={{ marginHorizontal: 24, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* LEFT SIDE: Text Info */}
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
              {item.name}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Last: {lastPerformedText}
              {item.estimatedDuration > 0 && ` • ~${formatDuration(item.estimatedDuration)}`}
            </Text>
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

            {/* Chevron */}
            <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
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

        {/* TODAY'S RECOMMENDATION Section */}
        {nextWorkout && (
          <>
            <Text style={{ 
              color: '#10b981', 
              fontSize: 13, 
              fontWeight: '600', 
              letterSpacing: 1,
              marginBottom: 12,
              marginHorizontal: 24,
              textTransform: 'uppercase'
            }}>
              TODAY'S RECOMMENDATION
            </Text>
            <Card variant="accent" style={{ marginHorizontal: 24, marginBottom: 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontSize: 22, 
                    fontWeight: '700',
                    marginBottom: 4
                  }}>
                    {nextWorkout.name}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                    {nextWorkout.estimatedDuration > 0 && `~${formatDuration(nextWorkout.estimatedDuration)}`}
                    {nextWorkout.estimatedDuration > 0 && getRecommendationContext() && ' • '}
                    {getRecommendationContext()}
                  </Text>
                </View>
                <Button 
                  title="Start →" 
                  onPress={handleStartNextWorkout} 
                />
              </View>
            </Card>
          </>
        )}

        {/* "or" Divider */}
        {nextWorkout && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginVertical: 24,
            marginHorizontal: 24
          }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <Text style={{ 
              color: 'rgba(255,255,255,0.5)', 
              fontSize: 14, 
              marginHorizontal: 16 
            }}>
              or
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </View>
        )}

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
            borderColor: 'rgba(255,255,255,0.2)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          {/* Left Side: Text */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
              Start Empty Workout
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              Add exercises as you go
            </Text>
          </View>
          {/* Right Side: Chevron */}
          <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
        </Pressable>

        {/* YOUR ROUTINES Header */}
        <View style={{ marginHorizontal: 24, marginTop: 0, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ 
              color: '#10b981', 
              fontSize: 13, 
              fontWeight: '600',
              letterSpacing: 1,
              textTransform: 'uppercase'
            }}>
              YOUR ROUTINES
            </Text>
            <TouchableOpacity
              onPress={handleCreateRoutine}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="add-circle-outline" size={28} color="#10b981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Routine Cards */}
        {(() => {
          const displayedRoutines = userRoutines.filter((routine) => routine.id !== nextWorkout?.id);
          console.log('DEBUG - nextWorkout?.id:', nextWorkout?.id);
          console.log('DEBUG - userRoutines count:', userRoutines.length);
          console.log('DEBUG - displayedRoutines count:', displayedRoutines.length);
          console.log('DEBUG - displayedRoutines:', displayedRoutines.map(r => ({ id: r.id, name: r.name })));
          
          return displayedRoutines.length > 0 ? (
            displayedRoutines.map((routine) => (
              <View key={routine.id}>{renderRoutineItem({ item: routine })}</View>
            ))
          ) : (
            <View style={{ marginHorizontal: 24, marginBottom: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontStyle: 'italic' }}>
                No routines yet. Create one to get started!
              </Text>
            </View>
          );
        })()}
      </ScrollView>
    </View>
  );
}

