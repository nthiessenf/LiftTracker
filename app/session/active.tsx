import { EXERCISES, Exercise } from '@/data/exercises';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, LayoutAnimation, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { Card, Button } from '@/components/ui';

type Set = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
};

type SessionExercise = {
  exerciseId: string;
  exerciseName: string;
  sets: Set[];
};

type WorkoutSession = {
  id: string;
  date: string;
  exercises: { exerciseId: string; sets: { reps: number; weight: number; completed: boolean }[] }[];
};

const IN_PROGRESS_WORKOUT_KEY = 'IN_PROGRESS_WORKOUT';

export default function ActiveSessionScreen() {
  const params = useLocalSearchParams<{ exerciseIds?: string; templateId?: string; workoutId?: string }>();
  const db = useSQLiteContext();
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [defaultRestTimer, setDefaultRestTimer] = useState(90); // Default to 90 seconds
  const [startTime] = useState(new Date().toISOString()); // Track when workout began

  // Enable LayoutAnimation for Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Save workout progress to AsyncStorage
  const saveWorkoutProgress = useCallback(async () => {
    try {
      // Get routine name if templateId exists
      let routineName: string | null = null;
      if (params.templateId) {
        const routine = await db.getFirstAsync<{ name: string }>(
          'SELECT name FROM routines WHERE id = ?',
          [params.templateId]
        );
        if (routine) {
          routineName = routine.name;
        }
      }

      const workoutState = {
        templateId: params.templateId || null,
        routineName: routineName,
        exercises: sessionExercises,
        startTime: startTime,
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(IN_PROGRESS_WORKOUT_KEY, JSON.stringify(workoutState));
    } catch (error) {
      console.error('Failed to save workout progress:', error);
    }
  }, [params.templateId, sessionExercises, startTime, db]);

  // Auto-save workout progress whenever exercises change
  useEffect(() => {
    // Only save if there's actual workout data
    if (sessionExercises && sessionExercises.length > 0) {
      saveWorkoutProgress();
    }
  }, [sessionExercises, saveWorkoutProgress]);

  // Clear saved workout progress
  const clearWorkoutProgress = async () => {
    try {
      await AsyncStorage.removeItem(IN_PROGRESS_WORKOUT_KEY);
    } catch (error) {
      console.error('Failed to clear workout progress:', error);
    }
  };

  // Fetch workout history and find most recent sets for an exercise
  const getMostRecentSetsForExercise = async (exerciseId: string): Promise<Set[]> => {
    try {
      // First, find the most recent workout_id that contained this exercise_id
      const mostRecentWorkout = await db.getFirstAsync<{ workout_id: string }>(
        `SELECT s.workout_id as workout_id
         FROM sets s
         INNER JOIN workouts w ON s.workout_id = w.id
         WHERE s.exercise_id = ?
         ORDER BY w.date DESC
         LIMIT 1`,
        [exerciseId]
      );

      if (!mostRecentWorkout) {
        return [];
      }

      // Then, get all sets for that workout_id and exercise_id
      const sets = await db.getAllAsync<{
        id: string;
        weight: number | null;
        reps: number | null;
        completed: number;
      }>(
        `SELECT id, weight, reps, completed 
         FROM sets 
         WHERE workout_id = ? AND exercise_id = ?
         ORDER BY timestamp ASC`,
        [mostRecentWorkout.workout_id, exerciseId]
      );

      // Map to Set type (convert completed 0/1 to boolean)
      return sets.map((set, index) => ({
        id: Date.now().toString() + index + Math.random(),
        weight: set.weight?.toString() || '',
        reps: set.reps?.toString() || '',
        completed: false, // Always start with false for new session
      }));
    } catch (error) {
      console.error('Error fetching workout history:', error);
    }
    return [];
  };

  // Create exercise with history pre-fill
  const createExerciseWithHistory = async (exercise: Exercise): Promise<SessionExercise> => {
    const historySets = await getMostRecentSetsForExercise(exercise.id);
    
    // If history exists, use it; otherwise use default (1 empty set)
    const sets: Set[] = historySets.length > 0 
      ? historySets
      : [
          {
            id: Date.now().toString() + Math.random(),
            weight: '',
            reps: '',
            completed: false,
          },
        ];

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets,
    };
  };

  // Load default rest timer from AsyncStorage on mount
  useEffect(() => {
    const loadDefaultRestTimer = async () => {
      try {
        const savedTimer = await AsyncStorage.getItem('default_rest_timer');
        if (savedTimer) {
          const timerValue = parseInt(savedTimer, 10);
          if (!isNaN(timerValue) && timerValue > 0) {
            setDefaultRestTimer(timerValue);
          }
        }
      } catch (error) {
        console.error('Error loading default rest timer:', error);
        // Keep default of 90 seconds on error
      }
    };

    loadDefaultRestTimer();
  }, []);

  // Pre-fill exercises from template if template data exists
  useEffect(() => {
    const loadTemplateExercises = async () => {
      if (params.exerciseIds) {
        const exerciseIds = params.exerciseIds.split(',');
        const templateExercises: SessionExercise[] = [];

        for (const exerciseId of exerciseIds) {
          const exercise = EXERCISES.find((ex) => ex.id === exerciseId);
          if (exercise) {
            const exerciseWithHistory = await createExerciseWithHistory(exercise);
            templateExercises.push(exerciseWithHistory);
          }
        }

        if (templateExercises.length > 0) {
          setSessionExercises(templateExercises);
        }
      }
    };

    loadTemplateExercises();
  }, [params.exerciseIds]);

  const handleAddExercise = () => {
    setShowExerciseModal(true);
  };

  const handleSelectExercise = async (exercise: Exercise) => {
    const newExercise = await createExerciseWithHistory(exercise);
    setSessionExercises([...sessionExercises, newExercise]);
    setShowExerciseModal(false);
  };

  const handleAddSet = (exerciseId: string) => {
    setSessionExercises(
      sessionExercises.map((ex) => {
        if (ex.exerciseId === exerciseId) {
          // Find the last set for this exercise to pre-fill values
          const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : null;
          
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: Date.now().toString(),
                weight: lastSet?.weight ?? '',
                reps: lastSet?.reps ?? '',
                completed: false,
              },
            ],
          };
        }
        return ex;
      })
    );
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    setSessionExercises((prevExercises) => {
      // Map through exercises and remove the set
      const updatedExercises = prevExercises.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: ex.sets.filter((set) => set.id !== setId),
            }
          : ex
      );

      // Check if the exercise now has zero sets after removal
      const exerciseAfterRemoval = updatedExercises.find((ex) => ex.exerciseId === exerciseId);
      if (exerciseAfterRemoval && exerciseAfterRemoval.sets.length === 0) {
        // Trigger animation before removing the exercise
        LayoutAnimation.easeInEaseOut();
        // Remove the entire exercise if it has no sets left
        return updatedExercises.filter((ex) => ex.exerciseId !== exerciseId);
      }

      return updatedExercises;
    });
  };

  const startRestTimer = (exerciseId?: string) => {
    const exerciseName = exerciseId 
      ? EXERCISES.find((ex) => ex.id === exerciseId)?.name 
      : undefined;
    
    router.push({
      pathname: '/session/timer',
      params: { 
        duration: defaultRestTimer.toString(),
        exerciseName: exerciseName || undefined
      }
    });
  };

  const handleSwapExercise = (currentExerciseId: string) => {
    const currentExercise = EXERCISES.find((ex) => ex.id === currentExerciseId);
    if (!currentExercise || !currentExercise.alternatives || currentExercise.alternatives.length === 0) {
      return;
    }

    const alternativeExercises = currentExercise.alternatives
      .map((altId) => EXERCISES.find((ex) => ex.id === altId))
      .filter((ex): ex is Exercise => ex !== undefined);

    if (alternativeExercises.length === 0) {
      return;
    }

    Alert.alert(
      'Swap Exercise',
      `Choose an alternative for ${currentExercise.name}:`,
      [
        ...alternativeExercises.map((alt) => ({
          text: alt.name,
          onPress: () => {
            setSessionExercises(
              sessionExercises.map((ex) =>
                ex.exerciseId === currentExerciseId
                  ? {
                      ...ex,
                      exerciseId: alt.id,
                      exerciseName: alt.name,
                    }
                  : ex
              )
            );
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleUpdateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'completed', value: string | boolean) => {
    const wasCompleted = sessionExercises
      .find((ex) => ex.exerciseId === exerciseId)
      ?.sets.find((set) => set.id === setId)?.completed;

    setSessionExercises(
      sessionExercises.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
            }
          : ex
      )
    );

    // Start timer if a set is marked as completed
    if (field === 'completed' && value === true && !wasCompleted) {
      startRestTimer(exerciseId);
    }
  };

  const handleFinish = async () => {
    if (sessionExercises.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise before finishing.');
      return;
    }

    try {
      const workoutId = Date.now().toString();
      const workoutDate = new Date().toISOString();
      
      // Get workout name from routine if templateId exists
      let workoutName: string | null = null;
      if (params.templateId) {
        // Check if it's a routine (in routines table)
        const routine = await db.getFirstAsync<{ name: string }>(
          'SELECT name FROM routines WHERE id = ?',
          [params.templateId]
        );
        if (routine) {
          workoutName = routine.name;
        }
      }

      // Use transaction to ensure data integrity
      await db.withTransactionAsync(async () => {
        // Insert workout
        await db.runAsync(
          `INSERT INTO workouts (id, date, name, duration_seconds, routine_id) 
           VALUES (?, ?, ?, ?, ?)`,
          [workoutId, workoutDate, workoutName, null, params.templateId || null]
        );

        // Iterate through sessionExercises and their sets
        for (const exercise of sessionExercises) {
          for (const set of exercise.sets) {
            const setId = Date.now().toString() + Math.random();
            const weight = set.weight ? parseFloat(set.weight) : null;
            const reps = set.reps ? parseFloat(set.reps) : null;
            const completed = set.completed ? 1 : 0;
            const timestamp = new Date().toISOString();

            // Insert set
            await db.runAsync(
              `INSERT INTO sets (id, workout_id, exercise_id, weight, reps, completed, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [setId, workoutId, exercise.exerciseId, weight, reps, completed, timestamp]
            );
          }
        }
      });

      // Clear saved progress after successfully saving to database
      await clearWorkoutProgress();

      // Show success alert
      Alert.alert('Workout Saved!', 'Your workout has been saved successfully.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout. Please try again.');
      console.error('Error saving workout:', error);
    }
  };

  const handleCancel = async () => {
    Alert.alert('Cancel Workout', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          // Clear saved progress when cancelling
          await clearWorkoutProgress();
          router.back();
        },
      },
    ]);
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    return (
      <Card
        variant="default"
        onPress={() => handleSelectExercise(item)}
        style={{ marginHorizontal: 16, marginVertical: 8 }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#fff' }}>{item.name}</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{item.muscleGroup}</Text>
      </Card>
    );
  };

  const renderSetRow = (exerciseId: string, set: Set, index: number, totalSets: number) => {
    return (
      <View
        key={set.id}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderBottomWidth: index < totalSets - 1 ? 1 : 0,
          borderBottomColor: 'rgba(255,255,255,0.1)',
        }}>
        <Pressable
          onPress={() => handleRemoveSet(exerciseId, set.id)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(239,68,68,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}>
          <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600' }}>×</Text>
        </Pressable>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{index + 1}</Text>
        </View>
        <TextInput
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 16,
            padding: 8,
            paddingHorizontal: 12,
            width: 80,
            marginRight: 8,
          }}
          placeholder="lbs"
          placeholderTextColor="rgba(255,255,255,0.4)"
          keyboardType="numeric"
          value={set.weight}
          onChangeText={(text) => handleUpdateSet(exerciseId, set.id, 'weight', text)}
        />
        <TextInput
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 16,
            padding: 8,
            paddingHorizontal: 12,
            width: 80,
            marginRight: 8,
          }}
          placeholder="Reps"
          placeholderTextColor="rgba(255,255,255,0.4)"
          keyboardType="numeric"
          value={set.reps}
          onChangeText={(text) => handleUpdateSet(exerciseId, set.id, 'reps', text)}
        />
        <TouchableOpacity
          onPress={() => handleUpdateSet(exerciseId, set.id, 'completed', !set.completed)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: set.completed ? '#10b981' : 'rgba(255,255,255,0.3)',
            backgroundColor: set.completed ? '#10b981' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {set.completed && <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>✓</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  const renderSessionExercise = (exercise: SessionExercise) => {
    const exerciseData = EXERCISES.find((ex) => ex.id === exercise.exerciseId);
    const hasAlternatives = exerciseData?.alternatives && exerciseData.alternatives.length > 0;

    return (
      <Card
        key={exercise.exerciseId}
        variant="default"
        style={{ marginHorizontal: 0, marginBottom: 16, padding: 0 }}>
        <View
          style={{
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.1)',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', flex: 1 }}>
            {exercise.exerciseName}
          </Text>
          {hasAlternatives && (
            <Pressable
              onPress={() => handleSwapExercise(exercise.exerciseId)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#10b981',
              }}>
              <Text style={{ fontSize: 14, color: '#10b981', fontWeight: '600' }}>Swap</Text>
            </Pressable>
          )}
        </View>

        {/* Header Row */}
        <View
          style={{
            flexDirection: 'row',
            paddingVertical: 12,
            paddingHorizontal: 20,
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.1)',
          }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', width: 40, fontSize: 12, fontWeight: '600' }}>Set</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', width: 80, fontSize: 12, fontWeight: '600', marginRight: 8 }}>lbs</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', width: 80, fontSize: 12, fontWeight: '600', marginRight: 8 }}>Reps</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>Done</Text>
        </View>

        {/* Set Rows */}
        {exercise.sets.map((set, index) => renderSetRow(exercise.exerciseId, set, index, exercise.sets.length))}

        {/* Add Set Button */}
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
          <Button
            title="+ Add Set"
            onPress={() => handleAddSet(exercise.exerciseId)}
            variant="secondary"
            size="small"
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={{ backgroundColor: '#121212', flex: 1 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 60,
          paddingBottom: 16,
        }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>Active Workout</Text>
        <Button
          title="Finish"
          onPress={handleFinish}
          variant="primary"
          size="small"
        />
      </View>

      {/* Body */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ 
          paddingHorizontal: 24,
          paddingBottom: 100,
          paddingTop: 8,
        }}>
        {sessionExercises.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Card
              variant="default"
              onPress={handleAddExercise}
              style={{
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                alignItems: 'center',
                padding: 32,
              }}>
              <Text style={{ fontSize: 32, color: '#10b981', marginBottom: 8 }}>+</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff' }}>Add Exercise</Text>
            </Card>
          </View>
        ) : (
          <>
            {sessionExercises.map((exercise) => renderSessionExercise(exercise))}
            <Card
              variant="default"
              onPress={handleAddExercise}
              style={{
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                alignItems: 'center',
                padding: 24,
                marginTop: 8,
              }}>
              <Text style={{ fontSize: 32, color: '#10b981', marginBottom: 8 }}>+</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff' }}>Add Exercise</Text>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 32,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
        }}>
        <Pressable onPress={handleCancel} style={{ alignItems: 'center' }}>
          <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600' }}>Cancel Workout</Text>
        </Pressable>
      </View>

      {/* Exercise Picker Modal */}
      <Modal visible={showExerciseModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#121212', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#2a2a2a',
              }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>Select Exercise</Text>
              <Pressable onPress={() => setShowExerciseModal(false)}>
                <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '600' }}>Close</Text>
              </Pressable>
            </View>
            <FlatList
              data={EXERCISES}
              renderItem={renderExerciseItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

