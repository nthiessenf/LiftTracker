import { Button } from '@/components/ui';
import { seedDatabaseWithTrack } from '@/data/database/db';
import { TRAINING_TRACKS } from '@/data/tracks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const handleSelectTrack = (trackKey: string) => {
    setSelectedTrack(trackKey);
    setCurrentPage(2); // Advance to weekly goal screen
    if (pagerRef.current) {
      pagerRef.current.setPage(2);
    }
  };

  const handleSkip = () => {
    setSelectedTrack(null);
    setCurrentPage(2); // Advance to weekly goal screen
    if (pagerRef.current) {
      pagerRef.current.setPage(2);
    }
  };

  const handleContinue = () => {
    setCurrentPage(3); // Advance to completion screen
    if (pagerRef.current) {
      pagerRef.current.setPage(3);
    }
  };

  const handleFinish = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // Save selected track to AsyncStorage (or "NONE" if skipped)
      const trackValue = selectedTrack || 'NONE';
      console.log('DEBUG: Saved SELECTED_TRACK as:', trackValue);
      await AsyncStorage.setItem('SELECTED_TRACK', trackValue);

      // Seed the database with the selected track (if one was selected)
      if (selectedTrack) {
        await seedDatabaseWithTrack(db, selectedTrack);
      }

      // Save weekly goal to AsyncStorage
      await AsyncStorage.setItem('WEEKLY_WORKOUT_GOAL', weeklyGoal.toString());

      // Mark onboarding as completed
      await AsyncStorage.setItem('HAS_COMPLETED_ONBOARDING', 'true');

      // Navigate to tabs (replace so they can't go back)
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setLoading(false);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    if (pagerRef.current) {
      pagerRef.current.setPage(page);
    }
  };

  const getGoalSubtitle = () => {
    if (selectedTrack === 'FULL_BODY') {
      return 'Most full body trainers aim for 2-3 sessions';
    } else if (selectedTrack === 'PPL') {
      return 'PPL works great with 3-6 sessions per week';
    } else if (selectedTrack === 'UPPER_LOWER') {
      return 'Upper/Lower typically means 3-4 sessions';
    } else {
      return 'How many workouts do you want to complete each week?';
    }
  };

  const getSelectedTrackName = () => {
    if (!selectedTrack) return null;
    return TRAINING_TRACKS[selectedTrack]?.name || null;
  };

  return (
    <View style={{ backgroundColor: '#0a0a0a', flex: 1 }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
        scrollEnabled={false}>
        {/* Screen 1 - Welcome */}
        <View key="welcome" style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 80, paddingBottom: 60 }}>
          {/* Background gradient orb */}
          <LinearGradient
            colors={['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 300,
              height: 300,
              borderRadius: 150,
            }}
          />

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 36, fontWeight: '700', color: '#FFFFFF', letterSpacing: -1, marginBottom: 16, textAlign: 'center' }}>
              LiftTrack
            </Text>
            <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
              Track your lifts. Beat your best.
            </Text>
          </View>

          <Button
            title="Get Started"
            onPress={() => {
              setCurrentPage(1);
              if (pagerRef.current) {
                pagerRef.current.setPage(1);
              }
            }}
            variant="primary"
            size="default"
          />
        </View>

        {/* Screen 2 - Training Style */}
        <View key="training-style" style={{ flex: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 100 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>
              How do you like to train?
            </Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 32, textAlign: 'center' }}>
              Choose your training style
            </Text>

            {/* Track Cards */}
            <View style={{ gap: 16, marginBottom: 32 }}>
              {Object.values(TRAINING_TRACKS).map((track) => {
                const isSelected = selectedTrack === track.key;
                
                // Get nudge text based on track
                let nudgeText = '';
                if (track.key === 'FULL_BODY') {
                  nudgeText = 'Ideal for 2-3 workouts per week';
                } else if (track.key === 'PPL') {
                  nudgeText = 'Ideal for 3-6 workouts per week';
                } else if (track.key === 'UPPER_LOWER') {
                  nudgeText = 'Ideal for 3-4 workouts per week';
                }

                return (
                  <Pressable
                    key={track.key}
                    onPress={() => handleSelectTrack(track.key)}
                    disabled={loading}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      borderRadius: 20,
                      padding: 24,
                      borderWidth: 1,
                      borderColor: isSelected ? '#10b981' : 'rgba(255,255,255,0.1)',
                      marginBottom: 16,
                    }}>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 }}>
                      {track.name}
                    </Text>
                    {nudgeText && (
                      <Text style={{ fontSize: 15, color: '#10b981' }}>
                        {nudgeText}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Skip Option */}
            <Pressable onPress={handleSkip} disabled={loading} style={{ marginTop: 24 }}>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderRadius: 16,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 17, fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}>
                  Skip for now
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                  You can add or change routines anytime
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        </View>

        {/* Screen 3 - Weekly Goal */}
        <View key="weekly-goal" style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 80, paddingBottom: 100 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>
              Set your weekly goal
            </Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 64, textAlign: 'center' }}>
              {getGoalSubtitle()}
            </Text>

            {/* Number Selector */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 60, marginBottom: 64 }}>
              <Pressable
                onPress={() => setWeeklyGoal(Math.max(1, weeklyGoal - 1))}
                disabled={weeklyGoal <= 1}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: weeklyGoal <= 1 ? 0.3 : 1,
                }}>
                <Text style={{ fontSize: 32, color: '#FFFFFF', fontWeight: '600' }}>-</Text>
              </Pressable>

              <View style={{ width: 120, alignItems: 'center', marginHorizontal: 32 }}>
                <Text style={{ fontSize: 48, fontWeight: '700', color: '#FFFFFF' }}>
                  {weeklyGoal}
                </Text>
              </View>

              <Pressable
                onPress={() => setWeeklyGoal(Math.min(7, weeklyGoal + 1))}
                disabled={weeklyGoal >= 7}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: weeklyGoal >= 7 ? 0.3 : 1,
                }}>
                <Text style={{ fontSize: 32, color: '#FFFFFF', fontWeight: '600' }}>+</Text>
              </Pressable>
            </View>
          </View>

          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            size="default"
          />
        </View>

        {/* Screen 4 - You're Ready */}
        <View key="ready" style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 80, paddingBottom: 100 }}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
              You're all set! 🎉
            </Text>
            {selectedTrack && (
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF', marginTop: 24, textAlign: 'center' }}>
                Your {getSelectedTrackName()} routines are ready
              </Text>
            )}
            <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', marginTop: 24, textAlign: 'center' }}>
              Goal: {weeklyGoal} {weeklyGoal === 1 ? 'workout' : 'workouts'} per week
            </Text>
          </View>

          <Pressable
            onPress={handleFinish}
            disabled={loading}
            style={{
              backgroundColor: loading ? 'rgba(16,185,129,0.5)' : '#10b981',
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.6 : 1,
            }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: '600',
            }}>
              {loading ? 'Loading...' : 'Start Training'}
            </Text>
          </Pressable>

          {loading && (
            <ActivityIndicator size="small" color="#10b981" style={{ marginTop: 16 }} />
          )}
        </View>
      </PagerView>

      {/* Page Indicator Dots */}
      <View style={{
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
      }}>
        {[0, 1, 2, 3].map((index) => (
          <Pressable
            key={index}
            onPress={() => goToPage(index)}
            style={{
              width: currentPage === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: currentPage === index ? '#10b981' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </View>
    </View>
  );
}
