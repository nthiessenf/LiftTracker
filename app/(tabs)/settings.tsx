import { exportDatabaseToJson, importDatabaseFromJson } from '@/data/services/backupService';
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
        <Card variant="default" style={{ marginBottom: 16 }}>
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
      </ScrollView>
    </View>
  );
}
