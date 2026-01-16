import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import React from 'react';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

function MaterialTabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return <MaterialCommunityIcons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981', // Emerald Green
        tabBarInactiveTintColor: '#9ca3af', // Gray
        tabBarStyle: {
          backgroundColor: '#1f1f1f', // Dark gray
          borderTopColor: '#2a2a2a',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#ffffff',
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color }) => <MaterialTabBarIcon name="dumbbell" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar but keep accessible via navigation
        }}
      />
    </Tabs>
  );
}
