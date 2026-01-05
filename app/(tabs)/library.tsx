import { EXERCISES, Exercise } from '@/data/exercises';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function LibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('All');

  // Get unique muscle groups from exercises
  const muscleGroups = ['All', ...Array.from(new Set(EXERCISES.map((ex) => ex.muscleGroup)))];

  // Filter exercises based on search and muscle group
  const filteredExercises = EXERCISES.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  });

  const handleExercisePress = (exercise: Exercise) => {
    console.log('Exercise selected:', exercise.name, exercise.id);
    // TODO: Navigate to exercise detail view
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    return (
      <Pressable
        onPress={() => handleExercisePress(item)}
        style={{
          backgroundColor: '#1e1e1e',
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#2a2a2a',
        }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
              {item.name}
            </Text>
            <Text style={{ color: '#999', fontSize: 14 }}>{item.muscleGroup}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71717a" />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ backgroundColor: '#121212', flex: 1 }}>
      {/* Search Bar */}
      <View
        style={{
          backgroundColor: '#18181b',
          marginHorizontal: 16,
          marginTop: 16,
          marginBottom: 16,
          padding: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Ionicons name="search" size={20} color="#71717a" style={{ marginRight: 12 }} />
        <TextInput
          placeholder="Search exercises..."
          placeholderTextColor="#71717a"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            flex: 1,
            color: 'white',
            fontSize: 16,
          }}
        />
      </View>

      {/* Muscle Group Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16,
        }}>
        {muscleGroups.map((group) => {
          const isSelected = selectedMuscleGroup === group;
          return (
            <Pressable
              key={group}
              onPress={() => setSelectedMuscleGroup(group)}
              style={{
                backgroundColor: isSelected ? '#10b981' : '#1e1e1e',
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                borderWidth: 1,
                borderColor: isSelected ? '#10b981' : '#2a2a2a',
              }}>
              <Text
                style={{
                  color: isSelected ? 'white' : '#999',
                  fontSize: 14,
                  fontWeight: isSelected ? '600' : '400',
                }}>
                {group}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 16 }}>No exercises found</Text>
          </View>
        }
      />
    </View>
  );
}

