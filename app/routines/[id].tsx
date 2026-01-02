import { EXERCISES, Exercise } from '@/data/exercises';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditRoutineScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routineName, setRoutineName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load existing routine data
  useEffect(() => {
    const loadRoutine = async () => {
      if (!id) return;

      try {
        // Query 1: Get routine name
        const routine = await db.getFirstAsync<{ name: string }>(
          'SELECT name FROM routines WHERE id = ?',
          [id]
        );

        if (routine) {
          setRoutineName(routine.name);

          // Query 2: Get exercise IDs
          const exerciseRows = await db.getAllAsync<{ exercise_id: string }>(
            'SELECT exercise_id FROM routine_exercises WHERE routine_id = ? ORDER BY order_index ASC',
            [id]
          );

          setSelectedExercises(exerciseRows.map((row) => row.exercise_id));
        }
      } catch (error) {
        console.error('Error loading routine:', error);
        Alert.alert('Error', 'Failed to load routine. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadRoutine();
  }, [id, db]);

  const handleToggleExercise = (exerciseId: string) => {
    setSelectedExercises((prev) => {
      if (prev.includes(exerciseId)) {
        return prev.filter((id) => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  const handleSave = async () => {
    if (!id) {
      Alert.alert('Error', 'Routine ID is missing');
      return;
    }

    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('Error', 'Please select at least one exercise');
      return;
    }

    try {
      const now = new Date().toISOString();

      await db.withTransactionAsync(async () => {
        // Update the routine name
        await db.runAsync('UPDATE routines SET name = ?, updated_at = ? WHERE id = ?', [
          routineName.trim(),
          now,
          id,
        ]);

        // Delete old exercise connections
        await db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', [id]);

        // Insert new exercise connections
        for (let i = 0; i < selectedExercises.length; i++) {
          const exerciseId = selectedExercises[i];
          const routineExerciseId = Date.now().toString() + i + Math.random();

          await db.runAsync(
            'INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) VALUES (?, ?, ?, ?)',
            [routineExerciseId, id, exerciseId, i]
          );
        }
      });

      Alert.alert('Success', 'Routine updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update routine. Please try again.');
      console.error('Error updating routine:', error);
    }
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isSelected = selectedExercises.includes(item.id);

    return (
      <TouchableOpacity
        onPress={() => handleToggleExercise(item.id)}
        style={{
          backgroundColor: isSelected ? '#1e3a1e' : '#1e1e1e',
          marginHorizontal: 16,
          marginVertical: 8,
          padding: 16,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: isSelected ? '#10b981' : '#2a2a2a',
        }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
              {item.name}
            </Text>
            <Text style={{ color: '#E5E5E5', fontSize: 14 }}>{item.muscleGroup}</Text>
          </View>
          {isSelected && (
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#10b981',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ backgroundColor: '#121212', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#121212', flex: 1 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#2a2a2a',
        }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
        </Pressable>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>Edit Routine</Text>
        <Pressable onPress={handleSave}>
          <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '600' }}>Update</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Routine Name Input */}
        <View style={{ padding: 16 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            Routine Name
          </Text>
          <TextInput
            style={{
              color: 'white',
              backgroundColor: '#333',
              padding: 12,
              borderRadius: 8,
              fontSize: 16,
              borderWidth: 1,
              borderColor: '#2a2a2a',
            }}
            placeholder="e.g., Push Day, Pull Day"
            placeholderTextColor="#999"
            value={routineName}
            onChangeText={setRoutineName}
            autoFocus
          />
        </View>

        {/* Selected Exercises Count */}
        {selectedExercises.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '600' }}>
              {selectedExercises.length} {selectedExercises.length === 1 ? 'exercise' : 'exercises'} selected
            </Text>
          </View>
        )}

        {/* Exercise List */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Select Exercises
          </Text>
        </View>

        <FlatList
          data={EXERCISES}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      </ScrollView>
    </View>
  );
}

