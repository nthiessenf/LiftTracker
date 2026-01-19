import { deleteSet, deleteWorkout, updateSet, updateWorkoutDetails } from '@/data/database/db';
import { EXERCISES, Exercise } from '@/data/exercises';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Card, Button } from '@/components/ui';

type SetData = {
  id: string;
  weight: number | null;
  reps: number | null;
  completed: number;
};

type ExerciseGroup = {
  exerciseId: string;
  exerciseName: string;
  sets: SetData[];
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
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const loadWorkout = useCallback(async () => {
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
      // Extract date string directly (assume it's stored as YYYY-MM-DD or ISO format)
      // If it's ISO format, extract just the date part
      let dateStr = workoutData.date;
      if (dateStr.includes('T')) {
        // ISO format: extract YYYY-MM-DD part
        dateStr = dateStr.split('T')[0];
      }
      // Ensure it's in YYYY-MM-DD format
      setEditDate(dateStr);

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
      const groupedMap = new Map<string, SetData[]>();

      sets.forEach((set) => {
        if (!groupedMap.has(set.exercise_id)) {
          groupedMap.set(set.exercise_id, []);
        }
        groupedMap.get(set.exercise_id)!.push({
          id: set.id,
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
  }, [id, db]);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

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

  const formatDateSafe = (dateString: string): string => {
    if (!dateString) return '';
    
    // Extract date part if it's an ISO string
    let datePart = dateString;
    if (dateString.includes('T')) {
      datePart = dateString.split('T')[0];
    }
    
    // Parse manually to avoid timezone issues
    const parts = datePart.split('-');
    if (parts.length !== 3) {
      return dateString; // Fallback if format is unexpected
    }
    
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parts[2];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${months[month - 1]} ${day}, ${year}`;
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

  const toggleEditMode = () => {
    if (isEditing) {
      handleSave();
    } else {
      // Initialize edit state when entering edit mode
      if (workout) {
        setEditName(workout.name || '');
        // Extract date string directly (no Date conversion to avoid timezone issues)
        let dateStr = workout.date;
        if (dateStr.includes('T')) {
          // ISO format: extract YYYY-MM-DD part
          dateStr = dateStr.split('T')[0];
        }
        setEditDate(dateStr);
      }
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!workout || !id) return;

    try {
      console.log('handleSave: Starting full save...');

      // 1. Save the Header (Name/Date)
      console.log('handleSave: Saving workout details with:', { id, name: editName, date: editDate });
      await updateWorkoutDetails(db, id, editName || null, editDate);
      console.log('handleSave: Workout details saved successfully');

      // 2. CRITICAL: Loop through ALL sets and save them to the DB
      // This ensures that whatever is currently on screen gets saved,
      // even if the 'onEndEditing' event didn't fire.
      const allSets = exerciseGroups.flatMap((group) => group.sets);
      console.log('handleSave: Found', allSets.length, 'sets to save');
      
      const setPromises = allSets.map((set) => {
        console.log('handleSave: Saving set', set.id, 'with weight:', set.weight, 'reps:', set.reps, 'completed:', set.completed);
        return updateSet(db, set.id, set.weight, set.reps, set.completed);
      });
      
      await Promise.all(setPromises);
      console.log('handleSave: All sets saved successfully');

      // 3. Reload data to verify
      console.log('handleSave: Reloading workout data to verify');
      await loadWorkout();
      console.log('handleSave: Workout data reloaded');
      
      setIsEditing(false);
      Alert.alert('Success', 'Workout updated successfully!');
    } catch (error) {
      console.error('handleSave: Save Error:', error);
      Alert.alert('Save Error', 'Could not save workout. Check console.');
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
            // Small delay to ensure database transaction is committed before navigation
            // This ensures useFocusEffect in history.tsx will see the updated data
            await new Promise(resolve => setTimeout(resolve, 100));
            router.back();
          } catch (error) {
            console.error('Error deleting workout:', error);
            Alert.alert('Error', 'Failed to delete workout. Please try again.');
          }
        },
      },
    ]);
  };

  const handleSetChange = (setId: string, field: 'weight' | 'reps', value: string) => {
    // Immediately update local state for optimistic UI update
    // This MUST happen synchronously to unfreeze the UI
    const numValue = value === '' ? null : (isNaN(parseFloat(value)) ? null : parseFloat(value));
    
    const updatedGroups = exerciseGroups.map((g) => ({
      ...g,
      sets: g.sets.map((s) => {
        if (s.id === setId) {
          return {
            ...s,
            [field]: numValue,
          };
        }
        return s;
      }),
    }));
    
    // Update state immediately - this unfreezes the TextInput
    setExerciseGroups(updatedGroups);
    console.log('handleSetChange: Updated local state immediately for setId:', setId, 'field:', field, 'value:', numValue);
  };

  const handleSetUpdate = async (setId: string, field: 'weight' | 'reps', value: string) => {
    try {
      console.log('UI: handleSetUpdate: Starting DB update for setId:', setId, 'field:', field, 'textValue:', value);
      
      // Find the current set from updated state (already updated by handleSetChange)
      const set = exerciseGroups
        .flatMap((g) => g.sets)
        .find((s) => s.id === setId);
      if (!set) {
        console.error('UI: handleSetUpdate: Set not found for setId:', setId);
        return;
      }

      console.log('UI: handleSetUpdate: Current set state:', { weight: set.weight, reps: set.reps, completed: set.completed });

      // Parse the value from the text input
      const numValue = value === '' ? null : (isNaN(parseFloat(value)) ? null : parseFloat(value));
      
      // Use the parsed value for the field being updated, and current state for the other field
      const finalWeight = field === 'weight' ? numValue : set.weight;
      const finalReps = field === 'reps' ? numValue : set.reps;

      console.log('UI: handleSetUpdate: Final values to save:', { setId, weight: finalWeight, reps: finalReps, completed: set.completed });
      console.log('UI: handleSetUpdate: Calling updateSet with exact parameters:', [setId, finalWeight, finalReps, set.completed]);
      
      await updateSet(db, setId, finalWeight, finalReps, set.completed);
      console.log('UI: handleSetUpdate: Database update successful');

      // Refresh the workout data in the background (don't block UI)
      // This ensures DB and UI stay in sync, but doesn't block the user
      loadWorkout().catch((error) => {
        console.error('UI: Error reloading workout after set update:', error);
      });
    } catch (error) {
      console.error('UI: handleSetUpdate: Error updating set:', error);
      Alert.alert('Error', 'Failed to update set. Please try again.');
      // Reload on error to restore correct state
      loadWorkout();
    }
  };

  const handleSetDelete = async (setId: string) => {
    Alert.alert('Delete Set?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSet(db, setId);
            // Refresh the workout data
            await loadWorkout();
          } catch (error) {
            console.error('Error deleting set:', error);
            Alert.alert('Error', 'Failed to delete set. Please try again.');
          }
        },
      },
    ]);
  };

  const handleAddSet = async (exerciseId: string) => {
    if (!id) {
      Alert.alert('Error', 'Workout ID not found.');
      return;
    }

    try {
      // Find the exercise group to get the last set's values (if any)
      const exerciseGroup = exerciseGroups.find((g) => g.exerciseId === exerciseId);
      const lastSet = exerciseGroup?.sets[exerciseGroup.sets.length - 1];

      // Use the last set's values as defaults, or 0 if no sets exist
      const defaultWeight = lastSet?.weight ?? 0;
      const defaultReps = lastSet?.reps ?? 0;

      // Generate a unique ID for the new set
      const setId = Date.now().toString();
      const timestamp = new Date().toISOString();

      // Insert the new set into the database
      await db.runAsync(
        'INSERT INTO sets (id, workout_id, exercise_id, weight, reps, completed, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [setId, id, exerciseId, defaultWeight, defaultReps, 1, timestamp]
      );

      // Refresh the workout data to show the new set
      await loadWorkout();
    } catch (error) {
      console.error('Error adding set:', error);
      Alert.alert('Error', 'Failed to add set. Please try again.');
    }
  };

  const handleAddExercise = () => {
    setShowExerciseModal(true);
  };

  const handleSelectExercise = async (exercise: Exercise) => {
    if (!id) {
      Alert.alert('Error', 'Workout ID not found.');
      return;
    }

    try {
      // Generate a unique ID for the new set
      const setId = Date.now().toString();
      const timestamp = new Date().toISOString();

      // Insert a starter set into the database
      await db.runAsync(
        'INSERT INTO sets (id, workout_id, exercise_id, weight, reps, completed, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [setId, id, exercise.id, 0, 0, 1, timestamp]
      );

      // Close the modal
      setShowExerciseModal(false);

      // Refresh the workout data to show the new exercise
      await loadWorkout();

      Alert.alert('Success', `${exercise.name} added to workout.`);
    } catch (error) {
      console.error('Error adding exercise:', error);
      Alert.alert('Error', 'Failed to add exercise. Please try again.');
    }
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ backgroundColor: '#121212', flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: 60,
              paddingHorizontal: 24,
              paddingBottom: 48,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Custom Header Row */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, color: '#10b981', marginRight: 8 }}>←</Text>
                <Text style={{ fontSize: 16, color: '#10b981', fontWeight: '500' }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleEditMode}>
                <Text style={{ fontSize: 16, color: '#10b981', fontWeight: '500' }}>
                  {isEditing ? 'Save' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Workout Summary */}
            {isEditing ? (
              <Card variant="default" style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Workout Name</Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 20,
                    padding: 12,
                    marginBottom: 16,
                  }}
                  placeholder="Enter workout name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={editName}
                  onChangeText={setEditName}
                />
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 20,
                    padding: 12,
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={editDate}
                  onChangeText={setEditDate}
                />
              </Card>
            ) : (
              <View style={{ paddingHorizontal: 24, paddingTop: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 }}>
                  {workout.name || 'Workout'}
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                  {formatDateSafe(workout.date)}
                </Text>
              </View>
            )}

            {/* Exercise Cards */}
            {exerciseGroups.map((group) => (
              <Card
                key={group.exerciseId}
                variant="default"
                style={{ marginBottom: 16, padding: 0 }}>
                <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>
                    {group.exerciseName}
                  </Text>
                </View>
                {group.sets.map((set, index) => (
                  <View
                    key={set.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderBottomWidth: index < group.sets.length - 1 ? 1 : 0,
                      borderBottomColor: 'rgba(255,255,255,0.1)',
                    }}>
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
                    {isEditing ? (
                      <>
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
                          value={set.weight !== null && !isNaN(set.weight) ? set.weight.toString() : ''}
                          onChangeText={(text) => {
                            console.log('UI: Weight Input onChangeText - Set ID:', set.id, 'New Text:', text);
                            handleSetChange(set.id, 'weight', text);
                          }}
                          onBlur={() => {
                            console.log('UI: Weight Input onBlur - Set ID:', set.id, 'Current Value:', set.weight);
                          }}
                          onEndEditing={(e) => {
                            console.log('UI: Weight Input onEndEditing - Set ID:', set.id, 'Text Value:', e.nativeEvent.text);
                            handleSetUpdate(set.id, 'weight', e.nativeEvent.text);
                          }}
                        />
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginRight: 8 }}>×</Text>
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
                          placeholder="reps"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          keyboardType="numeric"
                          value={set.reps !== null && !isNaN(set.reps) ? set.reps.toString() : ''}
                          onChangeText={(text) => {
                            console.log('UI: Reps Input onChangeText - Set ID:', set.id, 'New Text:', text);
                            handleSetChange(set.id, 'reps', text);
                          }}
                          onBlur={() => {
                            console.log('UI: Reps Input onBlur - Set ID:', set.id, 'Current Value:', set.reps);
                          }}
                          onEndEditing={(e) => {
                            console.log('UI: Reps Input onEndEditing - Set ID:', set.id, 'Text Value:', e.nativeEvent.text);
                            handleSetUpdate(set.id, 'reps', e.nativeEvent.text);
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => handleSetDelete(set.id)}
                          style={{
                            padding: 4,
                            marginLeft: 'auto',
                          }}>
                          <MaterialIcons name="delete" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 16, color: '#fff' }}>
                          {`${set.weight !== null ? set.weight + ' lbs' : '—'} × ${set.reps !== null ? set.reps + ' reps' : '—'}`}
                        </Text>
                        {set.completed === 1 && (
                          <Text style={{ color: '#10b981', fontSize: 18, marginLeft: 8 }}>✓</Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
                {/* Add Set Button (only visible when editing) */}
                {isEditing && (
                  <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                    <Button
                      title="+ Add Set"
                      onPress={() => handleAddSet(group.exerciseId)}
                      variant="secondary"
                      size="small"
                    />
                  </View>
                )}
              </Card>
            ))}

            {exerciseGroups.length === 0 && !isEditing && (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No exercises recorded for this workout</Text>
              </View>
            )}

            {/* Add Exercise Button (only visible when editing) */}
            {isEditing && (
              <Card
                variant="default"
                onPress={handleAddExercise}
                style={{
                  borderStyle: 'dashed',
                  borderColor: 'rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  alignItems: 'center',
                  padding: 24,
                  marginTop: 16,
                }}>
                <Text style={{ fontSize: 32, color: '#10b981', marginBottom: 8 }}>+</Text>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff' }}>Add Exercise</Text>
              </Card>
            )}

            {/* Delete Button (only visible when editing) */}
            {isEditing && (
              <Pressable
                onPress={handleDelete}
                style={{
                  backgroundColor: '#ef4444',
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 24,
                }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Delete Workout</Text>
              </Pressable>
            )}
          </ScrollView>

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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

