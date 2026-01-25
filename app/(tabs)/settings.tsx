import { exportDatabaseToJson, importDatabaseFromJson } from '@/data/services/backupService';
import { seedDemoData } from '@/data/database/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Card, Button } from '../../components/ui';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [restTimerSeconds, setRestTimerSeconds] = useState('90');

  // Load saved rest timer on mount
  useEffect(() => {
    const loadRestTimer = async () => {
      try {
        const savedTimer = await AsyncStorage.getItem('default_rest_timer');
        if (savedTimer) {
          setRestTimerSeconds(savedTimer);
        }
      } catch (error) {
        console.error('Error loading rest timer:', error);
      }
    };

    loadRestTimer();
  }, []);

  const handleExportData = async () => {
    try {
      await exportDatabaseToJson(db);
      Alert.alert('Success', 'Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const handleRestoreData = () => {
    Alert.alert(
      'Restore Data',
      'This will overwrite your current data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              await importDatabaseFromJson(db);
              Alert.alert('Success', 'Data restored successfully!', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate to dashboard to see updated data
                    router.push('/(tabs)');
                  },
                },
              ]);
            } catch (error: any) {
              console.error('Restore error:', error);
              const errorMessage = error?.message || 'Failed to restore data. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleSaveRestTimer = async () => {
    const seconds = parseInt(restTimerSeconds, 10);
    if (isNaN(seconds) || seconds <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number greater than 0.');
      return;
    }

    try {
      await AsyncStorage.setItem('default_rest_timer', restTimerSeconds);
      Alert.alert('Success', 'Rest timer preference saved!');
    } catch (error) {
      console.error('Error saving rest timer:', error);
      Alert.alert('Error', 'Failed to save preference. Please try again.');
    }
  };

  const resetOnboarding = async () => {
    try {
      // Delete all non-temporary routines (these are the seeded ones)
      await db.runAsync('DELETE FROM routines WHERE is_temporary = 0');
      
      // Clear all onboarding-related AsyncStorage keys
      await AsyncStorage.removeItem('SELECTED_TRACK');
      await AsyncStorage.removeItem('HAS_COMPLETED_ONBOARDING');
      await AsyncStorage.removeItem('WEEKLY_WORKOUT_GOAL');
      
      Alert.alert('Reset Complete', 'Onboarding will show on next app launch', [
        { text: 'Go to Onboarding', onPress: () => router.replace('/onboarding') }
      ]);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
    }
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
          marginBottom: 32,
        }}>
          Settings
        </Text>

        {/* PREFERENCES SECTION */}
        <Text style={{
          fontSize: 12,
          fontWeight: '600',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 1,
          marginTop: 8,
          marginBottom: 12,
          textTransform: 'uppercase',
        }}>
          PREFERENCES
        </Text>

        {/* Rest Timer Card */}
        <Card variant="default" style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: '#fff',
          }}>
            Default Rest Timer
          </Text>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 4,
            marginBottom: 16,
          }}>
            Set default rest time between sets
          </Text>
          <TextInput
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: 12,
              paddingHorizontal: 16,
              color: '#fff',
              fontSize: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              marginBottom: 16,
            }}
            placeholder="90"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="numeric"
            value={restTimerSeconds}
            onChangeText={setRestTimerSeconds}
          />
          <Button
            title="Save"
            onPress={handleSaveRestTimer}
            variant="primary"
            size="default"
          />
        </Card>

        {/* DATA SECTION */}
        <Text style={{
          fontSize: 12,
          fontWeight: '600',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 1,
          marginTop: 32,
          marginBottom: 12,
          textTransform: 'uppercase',
        }}>
          DATA
        </Text>

        {/* Export Backup Card */}
        <Card variant="default" style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>📤</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: '#fff',
                }}>
                  Export Backup
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: 4,
                }}>
                  Download your workout data as JSON
                </Text>
              </View>
            </View>
            <Button
              title="Export"
              onPress={handleExportData}
              variant="primary"
              size="default"
            />
          </View>
        </Card>

        {/* Import Backup Card */}
        <Card variant="default" style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>📥</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: '#fff',
                }}>
                  Restore Backup
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: 4,
                }}>
                  Import previously exported data
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleRestoreData}
              style={{
                backgroundColor: '#ef4444',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: '600',
              }}>
                Restore
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* ABOUT SECTION */}
        <Text style={{
          fontSize: 12,
          fontWeight: '600',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 1,
          marginTop: 32,
          marginBottom: 12,
          textTransform: 'uppercase',
        }}>
          ABOUT
        </Text>

        {/* Version Card */}
        <Card variant="default" style={{ marginBottom: 32 }}>
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: '#fff',
          }}>
            App Version
          </Text>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.4)',
            marginTop: 4,
          }}>
            1.0.0
          </Text>
        </Card>

        {/* TEMPORARY: Reset Onboarding Button */}
        <Text style={{
          fontSize: 12,
          fontWeight: '600',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 1,
          marginTop: 8,
          marginBottom: 12,
          textTransform: 'uppercase',
        }}>
          TESTING
        </Text>
        <Pressable
          onPress={resetOnboarding}
          style={{
            backgroundColor: '#f59e0b',
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            borderWidth: 2,
            borderColor: '#d97706',
          }}>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '700',
          }}>
            ⚠️ Reset Onboarding (TEMPORARY)
          </Text>
        </Pressable>

        {/* TEMPORARY: Debug Database */}
        <Text style={{
          fontSize: 12,
          fontWeight: '600',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 1,
          marginTop: 24,
          marginBottom: 12,
          textTransform: 'uppercase',
        }}>
          DEBUG DATABASE
        </Text>
        
        <Pressable
          onPress={async () => {
            try {
              const debugSets = await db.getAllAsync('SELECT * FROM sets LIMIT 10');
              console.log('DEBUG: Sample sets data:', JSON.stringify(debugSets, null, 2));
              
              const debugWorkouts = await db.getAllAsync('SELECT * FROM workouts LIMIT 5');
              console.log('DEBUG: Sample workouts:', JSON.stringify(debugWorkouts, null, 2));
              
              Alert.alert(
                'Debug Logged',
                `Found ${debugSets.length} sets and ${debugWorkouts.length} workouts. Check console for details.`
              );
            } catch (error) {
              console.error('DEBUG: Error querying database:', error);
              Alert.alert('Error', `Failed to query database: ${error}`);
            }
          }}
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>Debug: Check Sets & Workouts</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            try {
              const version = await db.getAllAsync('PRAGMA user_version');
              console.log('DEBUG: Database version:', JSON.stringify(version, null, 2));
              
              Alert.alert(
                'Database Version',
                `Version: ${version[0]?.user_version || 'Unknown'}\nCheck console for full details.`
              );
            } catch (error) {
              console.error('DEBUG: Error checking version:', error);
              Alert.alert('Error', `Failed to check version: ${error}`);
            }
          }}
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>Debug: Check DB Version</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            try {
              const schema = await db.getAllAsync('PRAGMA table_info(sets)');
              console.log('DEBUG: Sets table schema:', JSON.stringify(schema, null, 2));
              
              Alert.alert(
                'Sets Table Schema',
                `Found ${schema.length} columns. Check console for full schema.`
              );
            } catch (error) {
              console.error('DEBUG: Error checking schema:', error);
              Alert.alert('Error', `Failed to check schema: ${error}`);
            }
          }}
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>Debug: Check Sets Schema</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            try {
              const allRoutines = await db.getAllAsync<{ id: string; name: string; track: string | null; is_temporary: number; created_at: string }>(`
                SELECT id, name, track, is_temporary, created_at 
                FROM routines 
                ORDER BY name ASC
              `);
              console.log('DEBUG: All routines:', JSON.stringify(allRoutines, null, 2));
              
              // Also check workout counts for each routine
              const routinesWithCounts = await Promise.all(
                allRoutines.map(async (routine) => {
                  const workoutCount = await db.getFirstAsync<{ count: number }>(
                    'SELECT COUNT(*) as count FROM workouts WHERE routine_id = ?',
                    [routine.id]
                  );
                  return {
                    ...routine,
                    workoutCount: workoutCount?.count || 0,
                  };
                })
              );
              
              console.log('DEBUG: Routines with workout counts:', JSON.stringify(routinesWithCounts, null, 2));
              
              const routineList = routinesWithCounts.map(r => 
                `${r.name} (track: ${r.track || 'NULL'}, workouts: ${r.workoutCount}, temp: ${r.is_temporary})`
              ).join('\n');
              
              Alert.alert(
                'All Routines',
                `Found ${allRoutines.length} routines:\n\n${routineList}`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('DEBUG: Error querying routines:', error);
              Alert.alert('Error', `Failed to query routines: ${error}`);
            }
          }}
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>Debug: Show All Routines</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            try {
              // Find all workouts with their routine info
              const allWorkouts = await db.getAllAsync<{ id: string; name: string | null; date: string; routine_id: string | null; routine_name: string | null }>(`
                SELECT 
                  w.id,
                  w.name,
                  w.date,
                  w.routine_id,
                  r.name as routine_name
                FROM workouts w
                LEFT JOIN routines r ON w.routine_id = r.id
                ORDER BY w.date DESC
              `);
              console.log('DEBUG: All workouts with routine info:', JSON.stringify(allWorkouts, null, 2));

              // Find workouts whose routines no longer exist
              const orphanedWorkouts = await db.getAllAsync<{ id: string; name: string | null; date: string; routine_id: string | null; set_count: number }>(`
                SELECT 
                  w.id,
                  w.name,
                  w.date,
                  w.routine_id,
                  COUNT(s.id) as set_count
                FROM workouts w
                LEFT JOIN routines r ON w.routine_id = r.id
                LEFT JOIN sets s ON s.workout_id = w.id
                WHERE r.id IS NULL
                GROUP BY w.id
                ORDER BY w.date DESC
              `);
              console.log('DEBUG: Orphaned workouts (routine deleted):', JSON.stringify(orphanedWorkouts, null, 2));

              // Check if those orphaned workouts have set data
              const orphanedSets = await db.getAllAsync(`
                SELECT s.*
                FROM sets s
                INNER JOIN workouts w ON s.workout_id = w.id
                LEFT JOIN routines r ON w.routine_id = r.id
                WHERE r.id IS NULL
                LIMIT 20
              `);
              console.log('DEBUG: Sets from orphaned workouts:', JSON.stringify(orphanedSets, null, 2));

              // Count total sets from orphaned workouts
              const totalOrphanedSets = await db.getFirstAsync<{ count: number }>(`
                SELECT COUNT(*) as count
                FROM sets s
                INNER JOIN workouts w ON s.workout_id = w.id
                LEFT JOIN routines r ON w.routine_id = r.id
                WHERE r.id IS NULL
              `);

              const orphanedWorkoutList = orphanedWorkouts.map(w => 
                `${w.name || 'Unnamed'} (${w.date}, ${w.set_count} sets)`
              ).join('\n') || 'None';

              Alert.alert(
                'Orphaned Workouts Check',
                `Total workouts: ${allWorkouts.length}\n` +
                `Orphaned workouts: ${orphanedWorkouts.length}\n` +
                `Total orphaned sets: ${totalOrphanedSets?.count || 0}\n\n` +
                `Orphaned workouts:\n${orphanedWorkoutList}\n\n` +
                `Check console for full details.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('DEBUG: Error checking orphaned workouts:', error);
              Alert.alert('Error', `Failed to check orphaned workouts: ${error}`);
            }
          }}
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>Debug: Check Orphaned Workouts</Text>
        </Pressable>

        {/* RECOVER LOST ROUTINES */}
        <Text style={{
          fontSize: 12,
          fontWeight: '600',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 1,
          marginTop: 24,
          marginBottom: 12,
          textTransform: 'uppercase',
        }}>
          DATA RECOVERY
        </Text>

        <Pressable
          onPress={async () => {
            try {
              await db.withTransactionAsync(async () => {
                // Step 1: Recreate "Full Body A" routine with ORIGINAL ID
                const existingA = await db.getAllAsync('SELECT id FROM routines WHERE id = ?', ['1768417306842']);
                
                if (existingA.length === 0) {
                  const now = new Date().toISOString();
                  await db.runAsync(
                    `INSERT INTO routines (id, name, track, is_temporary, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    ['1768417306842', 'Full Body A', 'FULL_BODY', 0, now, now]
                  );
                  
                  // Add exercises from Full Body A track
                  const exercisesA = ['barbell-squat', 'bench-press', 'bent-over-row', 'hanging-leg-raise', 'bicep-curl'];
                  let baseTimestamp = Date.now();
                  for (let i = 0; i < exercisesA.length; i++) {
                    const routineExerciseId = `${baseTimestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`;
                    baseTimestamp += 1;
                    await db.runAsync(
                      `INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) 
                       VALUES (?, ?, ?, ?)`,
                      [routineExerciseId, '1768417306842', exercisesA[i], i]
                    );
                  }
                }

                // Step 2: Recreate "Full Body B" routine with ORIGINAL ID
                const existingB = await db.getAllAsync('SELECT id FROM routines WHERE id = ?', ['1768586229875']);
                
                if (existingB.length === 0) {
                  const now = new Date().toISOString();
                  await db.runAsync(
                    `INSERT INTO routines (id, name, track, is_temporary, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    ['1768586229875', 'Full Body B', 'FULL_BODY', 0, now, now]
                  );
                  
                  // Add exercises from Full Body B track
                  const exercisesB = ['deadlift', 'overhead-press', 'pull-up', 'plank', 'face-pull'];
                  let baseTimestamp = Date.now() + 10000; // Offset to avoid ID collisions
                  for (let i = 0; i < exercisesB.length; i++) {
                    const routineExerciseId = `${baseTimestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`;
                    baseTimestamp += 1;
                    await db.runAsync(
                      `INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) 
                       VALUES (?, ?, ?, ?)`,
                      [routineExerciseId, '1768586229875', exercisesB[i], i]
                    );
                  }
                }

                // Step 3: Delete the incorrect "Workout A" and "Workout B" routines
                await db.runAsync('DELETE FROM routines WHERE name IN (?, ?)', ['Workout A', 'Workout B']);
              });

              Alert.alert(
                'Recovery Complete! ✅',
                'Recovered Full Body A and Full Body B routines!\n\n' +
                'Your workout history is now reconnected.\n\n' +
                'Check the Start tab - your routines should appear with "Last: [date]" showing.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error recovering routines:', error);
              Alert.alert('Error', `Failed to recover routines: ${error}`);
            }
          }}
          style={{
            backgroundColor: '#10b981',
            padding: 16,
            borderRadius: 12,
            marginBottom: 32,
            shadowColor: '#10b981',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{ 
            color: '#FFFFFF', 
            textAlign: 'center',
            fontSize: 16,
            fontWeight: '600',
          }}>
            🔄 Recover Lost Routines
          </Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            Alert.alert(
              '⚠️ Seed Demo Data',
              'This will DELETE ALL your data and replace it with demo data for recording. This cannot be undone. Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete & Seed',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // First, clear ALL existing data (respecting foreign key order)
                      await db.withTransactionAsync(async () => {
                        await db.runAsync('DELETE FROM sets');
                        await db.runAsync('DELETE FROM workouts');
                        await db.runAsync('DELETE FROM routine_exercises');
                        await db.runAsync('DELETE FROM routines');
                      });

                      // Then seed demo data
                      const result = await seedDemoData(db);
                      
                      if (!result.success) {
                        Alert.alert('Error', 'Failed to seed demo data. Please try again.');
                        return;
                      }

                      // Set AsyncStorage values
                      await AsyncStorage.setItem('WEEKLY_WORKOUT_GOAL', '3');
                      await AsyncStorage.setItem('HAS_COMPLETED_ONBOARDING', 'true');
                      await AsyncStorage.setItem('SELECTED_TRACK', 'FULL_BODY');
                      await AsyncStorage.removeItem('IN_PROGRESS_WORKOUT');
                      await AsyncStorage.removeItem('LAST_COMPLETED_RECOMMENDATION_DATE');

                      Alert.alert(
                        '✅ Demo Data Loaded!',
                        'Demo data loaded! Your app is ready to record.\n\nTip: Navigate to Dashboard to start your demo.',
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      console.error('Error seeding demo data:', error);
                      Alert.alert('Error', `Failed to seed demo data: ${error}`);
                    }
                  },
                },
              ]
            );
          }}
          style={{
            backgroundColor: '#ef4444',
            padding: 16,
            borderRadius: 12,
            marginBottom: 32,
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{ 
            color: '#FFFFFF', 
            textAlign: 'center',
            fontSize: 16,
            fontWeight: '600',
          }}>
            🎬 Seed Demo Data
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
