import { EXERCISES, Exercise } from '@/data/exercises';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Card } from '../../components/ui';

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

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    return (
      <Link href={`/library/${item.id}`} asChild>
        <Pressable>
          <Card
            variant="default"
            style={{ marginHorizontal: 0, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 4 }}>
                  {item.name}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{item.muscleGroup}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
            </View>
          </Card>
        </Pressable>
      </Link>
    );
  };

  return (
    <View style={{ backgroundColor: '#121212', flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 80,
          paddingHorizontal: 24,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Page Title */}
        <Text style={{
          fontSize: 32,
          fontWeight: '700',
          letterSpacing: -0.5,
          color: '#fff',
          marginBottom: 24,
        }}>
          Library
        </Text>

        {/* Search Bar */}
        <Card variant="default" style={{ marginBottom: 20, padding: 0 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
            paddingHorizontal: 18,
          }}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" style={{ marginRight: 12 }} />
            <TextInput
              placeholder="Search exercises..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                color: '#fff',
                fontSize: 16,
              }}
            />
          </View>
        </Card>

        {/* Muscle Group Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            marginBottom: 24,
          }}
          contentContainerStyle={{
            paddingBottom: 0,
          }}>
          {muscleGroups.map((group) => {
            const isSelected = selectedMuscleGroup === group;
            return (
              <Pressable
                key={group}
                onPress={() => setSelectedMuscleGroup(group)}
                style={{
                  marginRight: 8,
                }}>
                {isSelected ? (
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: 20,
                      minHeight: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#10b981',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      elevation: 6,
                    }}>
                    <Text
                      style={{
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: '500',
                        textAlign: 'center',
                      }}>
                      {group}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.15)',
                      minHeight: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: '500',
                        textAlign: 'center',
                      }}>
                      {group}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Exercise List */}
        <FlatList
          data={filteredExercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>No exercises found</Text>
            </View>
          }
        />
      </ScrollView>
    </View>
  );
}
