import WeeklyGoalRing from '@/components/WeeklyGoalRing';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CardStyles, Spacing, Typography } from '@/constants/Typography';

type WorkoutSession = {
  id: string;
  date: string;
  exercises: { exerciseId: string; sets: { reps: number; weight: number; completed: boolean }[] }[];
};

type DayStatus = {
  date: Date;
  hasWorkout: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
};

export default function DashboardScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [weeklyProgress, setWeeklyProgress] = useState<DayStatus[]>([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [nextWorkout, setNextWorkout] = useState<{ id: string; name: string; exerciseIds: string[] } | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [hasRoutines, setHasRoutines] = useState(false);

  const getCurrentWeekDays = (): Date[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = today.getDay();
    
    // Calculate days to subtract to get to Monday
    // If today is Sunday (0), go back 6 days to get Monday
    // If today is Monday (1), go back 0 days
    // If today is Tuesday (2), go back 1 day, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    // Get Monday of the current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    
    // Generate array of 7 days starting from Monday
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDays.push(date);
    }
    
    return weekDays;
  };

  const isSameDate = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const getWeekKey = (date: Date): string => {
    // Get Monday of the week for this date
    const d = new Date(date);
    const day = d.getDay();
    const daysToMonday = day === 0 ? 6 : day - 1; // Days to subtract to get to Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    
    // Get ISO week number (simplified - week starting from Jan 1)
    const startOfYear = new Date(monday.getFullYear(), 0, 1);
    const daysSinceStart = Math.floor((monday.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.floor(daysSinceStart / 7) + 1;
    
    // Format as YYYY-Www
    const year = monday.getFullYear();
    const week = weekNumber.toString().padStart(2, '0');
    return `${year}-W${week}`;
  };

  const calculateStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0;

    // Convert all dates to week keys
    const weekSet = new Set<string>();
    dates.forEach((dateStr) => {
      const date = new Date(dateStr);
      const weekKey = getWeekKey(date);
      weekSet.add(weekKey);
    });

    // Get current week
    const today = new Date();
    const currentWeekKey = getWeekKey(today);

    // Check if current week has workouts
    let currentDate = new Date(today);
    let weekToCheck = currentWeekKey;
    let found = weekSet.has(weekToCheck);

    // If current week doesn't have workouts, check last week
    if (!found) {
      currentDate.setDate(currentDate.getDate() - 7);
      weekToCheck = getWeekKey(currentDate);
      found = weekSet.has(weekToCheck);
    }

    // Count consecutive weeks backwards
    let streak = 0;
    while (found) {
      streak++;
      // Get previous week by subtracting 7 days
      currentDate.setDate(currentDate.getDate() - 7);
      weekToCheck = getWeekKey(currentDate);
      found = weekSet.has(weekToCheck);
    }

    return streak;
  };

  const loadWeeklyProgress = useCallback(async () => {
    try {
      // Query 1: Get all workout dates
      const workouts = await db.getAllAsync<{ date: string }>('SELECT date FROM workouts');

      // Get current week days (Monday to Sunday)
      const weekDays = getCurrentWeekDays();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Map each day to its status
      const days: DayStatus[] = weekDays.map((date) => {
        const dateCopy = new Date(date);
        dateCopy.setHours(0, 0, 0, 0);

        // Check if any workout exists for this date
        const hasWorkout = workouts.some((workout) => {
          const workoutDate = new Date(workout.date);
          workoutDate.setHours(0, 0, 0, 0);
          return isSameDate(workoutDate, dateCopy);
        });

        const isToday = isSameDate(dateCopy, today);
        const isPast = dateCopy < today;
        const isFuture = dateCopy > today;

        return {
          date: dateCopy,
          hasWorkout,
          isToday,
          isPast,
          isFuture,
        };
      });

      const count = days.filter((day) => day.hasWorkout).length;
      setWeeklyProgress(days);
      setWorkoutCount(count);

      // Calculate streak
      const workoutDates = workouts.map((w) => w.date);
      const streak = calculateStreak(workoutDates);
      setCurrentStreak(streak);

      // Determine next workout using routine_id rotation
      // Step A: Fetch ALL routines ordered by creation
      const allRoutines = await db.getAllAsync<{ id: string; name: string }>(
        'SELECT id, name FROM routines ORDER BY id ASC'
      );
      console.log('DEBUG - Dashboard routines found:', allRoutines.length, allRoutines);

      // Track if routines exist for empty state
      setHasRoutines(allRoutines.length > 0);

      if (allRoutines.length === 0) {
        setNextWorkout(null);
      } else {
        // Step B: Get the most recent workout's routine_id
        const lastWorkout = await db.getFirstAsync<{ routine_id: string | null }>(
          'SELECT routine_id FROM workouts ORDER BY date DESC LIMIT 1'
        );

        let nextRoutineIndex = 0; // Default to first routine

        // Step C: Rotation logic
        if (lastWorkout?.routine_id) {
          // Find the index of the last workout's routine
          const lastRoutineIndex = allRoutines.findIndex((r) => r.id === lastWorkout.routine_id);
          
          if (lastRoutineIndex !== -1) {
            // Routine found: rotate to next (wrap around with modulo)
            nextRoutineIndex = (lastRoutineIndex + 1) % allRoutines.length;
          }
          // If routine_id not found in list, keep default (index 0)
        }
        // If no routine_id (legacy data), keep default (index 0)

        // Safety check: ensure nextRoutineIndex is valid
        if (nextRoutineIndex >= 0 && nextRoutineIndex < allRoutines.length) {
          const nextRoutine = allRoutines[nextRoutineIndex];

          // Get exercise IDs for the next routine
          const routineExercises = await db.getAllAsync<{ exercise_id: string; order_index: number }>(
            'SELECT exercise_id, order_index FROM routine_exercises WHERE routine_id = ? ORDER BY order_index',
            [nextRoutine.id]
          );

          const exerciseIds = routineExercises.map((row) => row.exercise_id);

          setNextWorkout({
            id: nextRoutine.id,
            name: nextRoutine.name,
            exerciseIds: exerciseIds,
          });
        } else {
          setNextWorkout(null);
        }
      }
    } catch (error) {
      console.error('Error loading weekly progress:', error);
      setWeeklyProgress([]);
      setWorkoutCount(0);
      setNextWorkout(null);
      setHasRoutines(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadWeeklyProgress();
    }, [loadWeeklyProgress])
  );

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

  const getDayLabel = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  // Load saved goal on mount
  useEffect(() => {
    const loadSavedGoal = async () => {
      try {
        const savedGoal = await AsyncStorage.getItem('weekly_workout_goal');
        if (savedGoal) {
          const goal = parseInt(savedGoal, 10);
          if (!isNaN(goal) && goal > 0) {
            setWeeklyGoal(goal);
          }
        }
      } catch (error) {
        console.error('Error loading saved goal:', error);
      }
    };

    loadSavedGoal();
  }, []);

  const handleEditGoal = () => {
    // Try Alert.prompt (iOS)
    if (Alert.prompt) {
      Alert.prompt(
        'Edit Weekly Goal',
        'Enter your new weekly workout goal:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (text: string | undefined) => {
              if (text) {
                const newGoal = parseInt(text, 10);
                if (!isNaN(newGoal) && newGoal > 0) {
                  setWeeklyGoal(newGoal);
                  AsyncStorage.setItem('weekly_workout_goal', newGoal.toString());
                } else {
                  Alert.alert('Invalid Input', 'Please enter a valid number greater than 0.');
                }
              }
            },
          },
        ],
        'plain-text',
        weeklyGoal.toString()
      );
    } else {
      // Fallback for Android - show modal
      setGoalInput(weeklyGoal.toString());
      setShowGoalModal(true);
    }
  };

  const handleSaveGoal = () => {
    const newGoal = parseInt(goalInput, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      setWeeklyGoal(newGoal);
      AsyncStorage.setItem('weekly_workout_goal', newGoal.toString());
      setShowGoalModal(false);
      setGoalInput('');
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid number greater than 0.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginRight: Spacing.elementGap }}>
              <FontAwesome name="cog" size={24} color="#10b981" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={{ backgroundColor: '#121212', flex: 1 }}>
      <Pressable 
        onPress={() => router.push('/test-ui')}
        style={{ 
          backgroundColor: 'red', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16,
          marginHorizontal: 24 
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          🧪 TEST NEW UI COMPONENTS
        </Text>
      </Pressable>
      {/* Goal Edit Modal (Android fallback) */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoalModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              backgroundColor: '#1e1e1e',
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#2a2a2a',
              minWidth: 280,
            }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: '#FFFFFF', marginBottom: Spacing.elementGap }}>
              Edit Weekly Goal
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#E5E5E5', marginBottom: 12 }}>
              Enter your new weekly workout goal:
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
                marginBottom: 16,
              }}
              placeholder="Enter goal"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={goalInput}
              onChangeText={setGoalInput}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Pressable
                onPress={() => {
                  setShowGoalModal(false);
                  setGoalInput('');
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginRight: 12,
                }}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#E5E5E5' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveGoal}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: '#10b981',
                  borderRadius: 8,
                }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingTop: 40,
          paddingBottom: 20,
        }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 36, letterSpacing: -1, color: '#FFFFFF', marginBottom: Spacing.sectionGap }}>LiftTrack</Text>

        {/* Weekly Goal Ring */}
        <WeeklyGoalRing
          currentCount={workoutCount}
          goal={weeklyGoal}
          streak={currentStreak}
          onEditGoal={handleEditGoal}
        />

        {/* Weekly Progress Card */}
        <View
          style={{
            backgroundColor: '#1e1e1e',
            padding: 16,
            marginHorizontal: 16,
            marginBottom: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#2a2a2a',
            minWidth: 320,
          }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: '#FFFFFF', marginBottom: Spacing.elementGap, textAlign: 'center' }}>
            Weekly Progress
          </Text>

          {/* 7 Circles Row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}>
            {weeklyProgress.map((day, index) => {
              // Determine dot style based on status
              let borderColor = '#666';
              let backgroundColor = 'transparent';
              let borderWidth = 2;

              if (day.hasWorkout) {
                // Green dot: workout exists
                borderColor = '#10b981';
                backgroundColor = '#10b981';
              } else if (day.isPast) {
                // Gray dot: missed workout (past date, no workout)
                borderColor = '#666';
                backgroundColor = '#333';
              } else if (day.isFuture) {
                // Empty/outline dot: future date
                borderColor = '#444';
                backgroundColor = 'transparent';
              }

              // Highlight current day with a thicker border or different style
              if (day.isToday) {
                borderWidth = 3;
                if (!day.hasWorkout) {
                  borderColor = '#10b981';
                }
              }

              return (
                <View key={index} style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      borderWidth: borderWidth,
                      borderColor: borderColor,
                      backgroundColor: backgroundColor,
                      marginBottom: 4,
                    }}
                  />
                  <Text style={{
                      fontFamily: day.isToday ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      fontSize: 10,
                      color: day.isToday ? '#10b981' : '#E5E5E5',
                    }}>
                    {getDayLabel(day.date)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Summary Text */}
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#8E8E93', textAlign: 'center' }}>
            {workoutCount} {workoutCount === 1 ? 'workout' : 'workouts'} this week
          </Text>
        </View>

      </ScrollView>

      {/* Action Card - Up Next or Empty State */}
      <View
        style={{
          paddingHorizontal: Spacing.screenHorizontal,
          paddingBottom: Spacing.sectionGap,
          paddingTop: Spacing.screenHorizontal,
          borderTopWidth: 1,
          borderTopColor: '#2a2a2a',
        }}>
        {nextWorkout ? (
          <Pressable
            onPress={handleStartNextWorkout}
            style={{
              backgroundColor: '#1e1e1e',
              padding: 16,
              marginHorizontal: 16,
              marginBottom: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#2a2a2a',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8E8E93', marginBottom: 6 }}>
                RECOMMENDED FOR TODAY
              </Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.5, color: '#FFFFFF' }}>
                {nextWorkout.name}
              </Text>
            </View>
            <View
              style={{
                marginLeft: 16,
              }}>
              <Pressable
                onPress={handleStartNextWorkout}
                style={{
                  backgroundColor: '#10b981',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                  Start
                </Text>
              </Pressable>
            </View>
          </Pressable>
        ) : !hasRoutines ? (
          <Pressable
            onPress={() => router.push('/routines/create')}
            style={{
              backgroundColor: '#1e1e1e',
              padding: 16,
              marginHorizontal: 16,
              marginBottom: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#2a2a2a',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8E8E93', marginBottom: 6 }}>
                GET STARTED
              </Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.5, color: '#FFFFFF' }}>
                Create your first routine
              </Text>
            </View>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 16,
              }}>
              <FontAwesome name="plus-circle" size={32} color="#10b981" />
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
    </>
  );
}
