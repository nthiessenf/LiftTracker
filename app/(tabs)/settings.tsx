import { seedDatabaseWithTrack } from '@/data/database/db';
import { exportDatabaseToJson } from '@/data/services/backupService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

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

  return (
    <View style={{ backgroundColor: '#121212', flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 40,
          paddingBottom: 20,
          paddingHorizontal: 16,
        }}>
        {/* Title */}
        <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 32 }}>
          Settings
        </Text>

        {/* Data Management Section */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
            Data Management
          </Text>
          <Pressable
            onPress={handleExportData}
            style={{
              backgroundColor: '#10b981',
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Export Data (Backup)
            </Text>
          </Pressable>
        </View>

        {/* Preferences Section */}
        <View>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
            Preferences
          </Text>

          {/* Default Rest Timer */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#E5E5E5', fontSize: 14, marginBottom: 8 }}>Default Rest Timer</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{
                  color: 'white',
                  backgroundColor: '#333',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#2a2a2a',
                  flex: 1,
                  marginRight: 12,
                }}
                placeholder="90"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={restTimerSeconds}
                onChangeText={setRestTimerSeconds}
              />
              <Text style={{ color: '#E5E5E5', fontSize: 14, marginRight: 12 }}>seconds</Text>
              <Pressable
                onPress={handleSaveRestTimer}
                style={{
                  backgroundColor: '#10b981',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Developer Tools Section */}
        <View style={{ marginTop: 32 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
            Developer Tools
          </Text>

          <Pressable
            onPress={async () => {
              try {
                await seedDatabaseWithTrack(db, 'FULL_BODY');
                Alert.alert('Success', 'Full Body track seeded successfully!');
              } catch (error) {
                console.error('Error seeding track:', error);
                Alert.alert('Error', 'Failed to seed track. Check console for details.');
              }
            }}
            style={{
              backgroundColor: '#10b981',
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Seed Full Body Track (Dev)
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
