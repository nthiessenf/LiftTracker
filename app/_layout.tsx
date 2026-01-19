import { migrateDbIfNeeded } from '@/data/database/db';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Custom dark theme with #121212 background
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    border: '#2a2a2a',
    notification: '#10b981',
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SQLiteProvider 
      databaseName="lifttrack.db" 
      onInit={async (db) => {
        try {
          await migrateDbIfNeeded(db);
        } catch (error) {
          console.error('Database migration error:', error);
          throw error;
        }
      }}>
      <ThemeProvider value={CustomDarkTheme}>
        <RootLayoutNav />
      </ThemeProvider>
    </SQLiteProvider>
  );
}

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const checkOnboarding = async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem('HAS_COMPLETED_ONBOARDING');
      const needsOnboardingValue = hasCompletedOnboarding !== 'true';
      setNeedsOnboarding(needsOnboardingValue);
      setIsInitialized(true);
      return needsOnboardingValue;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsInitialized(true);
      return true; // Default to showing onboarding on error
    }
  };

  // Initial check on mount - wait for AsyncStorage before rendering
  useEffect(() => {
    checkOnboarding();
  }, []);

  // Re-check onboarding status when segments change (especially when navigating from onboarding)
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const inOnboarding = segments[0] === 'onboarding';

    // If we're navigating away from onboarding, re-check the status
    if (inOnboarding) {
      // We're on onboarding, check if it's been completed
      checkOnboarding().then((needsOnboardingValue) => {
        if (!needsOnboardingValue) {
          // Onboarding was completed, navigate to tabs
          router.replace('/(tabs)');
        }
      });
    }
  }, [segments, isInitialized, router]);

  // Handle navigation based on onboarding status
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const inOnboarding = segments[0] === 'onboarding';

    if (needsOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (!needsOnboarding && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [needsOnboarding, segments, isInitialized, router]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="session/active"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="session/timer"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="routines/create"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="history/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
