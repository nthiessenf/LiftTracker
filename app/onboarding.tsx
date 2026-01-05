import { seedDatabaseWithTrack } from '@/data/database/db';
import { TRAINING_TRACKS } from '@/data/tracks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

export default function OnboardingScreen() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  const handleSelectTrack = async (trackKey: string) => {
    if (loading) return;

    try {
      setLoading(true);
      setSelectedTrack(trackKey);

      // Seed the database with the selected track
      await seedDatabaseWithTrack(db, trackKey);

      // Mark app as launched
      await AsyncStorage.setItem('HAS_LAUNCHED', 'true');

      // Navigate to tabs (replace so they can't go back)
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error setting up track:', error);
      setLoading(false);
      setSelectedTrack(null);
    }
  };

  const handleSkip = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // Mark app as launched (do NOT seed database)
      await AsyncStorage.setItem('HAS_LAUNCHED', 'true');

      // Navigate to tabs (replace so they can't go back)
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ backgroundColor: '#121212', flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 60,
            paddingBottom: 40,
          }}>
          {/* Title */}
          <View style={{ marginBottom: 40, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 12 }}>
              How do you want to train?
            </Text>
            <Text style={{ color: '#999', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 }}>
              Choose a training track to get started. You can always add more routines later.
            </Text>
          </View>

          {/* Track Cards */}
          <View style={{ gap: 16 }}>
            {Object.values(TRAINING_TRACKS).map((track) => {
              const isSelected = selectedTrack === track.key;
              const isLoading = loading && isSelected;

              return (
                <Pressable
                  key={track.key}
                  onPress={() => handleSelectTrack(track.key)}
                  disabled={loading}
                  style={{
                    backgroundColor: isLoading ? '#1a1a1a' : '#1e1e1e',
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: isLoading ? '#10b981' : '#2a2a2a',
                    opacity: loading && !isSelected ? 0.5 : 1,
                  }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'white', fontSize: 22, fontWeight: '600', marginBottom: 8 }}>
                        {track.name}
                      </Text>
                      <Text style={{ color: '#999', fontSize: 14, marginBottom: 12 }}>
                        {track.description}
                      </Text>
                      <Text style={{ color: '#666', fontSize: 12 }}>
                        {track.routines.length} {track.routines.length === 1 ? 'routine' : 'routines'}
                      </Text>
                    </View>
                    {isLoading && (
                      <ActivityIndicator size="small" color="#10b981" style={{ marginLeft: 16 }} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Skip Button */}
          <Pressable
            onPress={handleSkip}
            disabled={loading}
            style={{
              marginTop: 32,
              paddingVertical: 16,
              paddingHorizontal: 24,
              alignItems: 'center',
              opacity: loading ? 0.5 : 1,
            }}>
            <Text style={{ color: '#999', fontSize: 16 }}>
              Skip (Build my own)
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </>
  );
}

