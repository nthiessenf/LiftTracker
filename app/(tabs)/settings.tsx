import { exportDatabaseToJson, importDatabaseFromJson } from '@/data/services/backupService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
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
              marginBottom: 12,
            }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Export Data (Backup)
            </Text>
          </Pressable>
          <Pressable
            onPress={handleRestoreData}
            style={{
              backgroundColor: '#ef4444',
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Restore Data
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
      </ScrollView>
    </View>
  );
}
