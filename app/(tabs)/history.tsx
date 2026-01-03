import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native';

type Workout = {
  id: string;
  date: string;
  name: string | null;
  duration_seconds: number | null;
};

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const [history, setHistory] = useState<Workout[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const workouts = await db.getAllAsync<Workout>(
        'SELECT * FROM workouts ORDER BY date DESC'
      );
      setHistory(workouts);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const formatDateString = (dateString: string): string => {
    // Parse the date string manually to avoid timezone conversion issues
    // Expected format: "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss.sssZ"
    let datePart = dateString;
    if (dateString.includes('T')) {
      // Extract just the date part if it's an ISO string
      datePart = dateString.split('T')[0];
    }
    
    // Split the date string: "2026-01-04" -> ["2026", "01", "04"]
    const parts = datePart.split('-');
    if (parts.length !== 3) {
      // Fallback to original if format is unexpected
      return dateString;
    }
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // 1-12
    const day = parseInt(parts[2], 10); // 1-31
    
    // Create a date object at noon to avoid midnight timezone offsets
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    
    return `${dayName}, ${monthName} ${day}`;
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds || seconds === 0) {
      return 'No duration';
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes} min`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const handleDelete = (workoutId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM workouts WHERE id = ?', [workoutId]);
              // Refresh the list
              await loadHistory();
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewWorkout = (workoutId: string) => {
    router.push(`/history/${workoutId}`);
  };

  const renderWorkoutItem = ({ item }: { item: Workout }) => {
    return (
      <Pressable
        onPress={() => handleViewWorkout(item.id)}
        style={{
          backgroundColor: '#1e1e1e',
          marginHorizontal: 16,
          marginVertical: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#2a2a2a',
          padding: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
            {item.name || 'Untitled Workout'}
          </Text>
          <Text style={{ color: '#E5E5E5', fontSize: 14, marginBottom: 2 }}>
            {formatDateString(item.date)}
          </Text>
          <Text style={{ color: '#999', fontSize: 12 }}>
            {formatDuration(item.duration_seconds)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(item.id);
          }}
          style={{
            padding: 8,
            marginLeft: 12,
          }}>
          <Text style={{ color: '#ef4444', fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      </Pressable>
    );
  };

  return (
    <View style={{ backgroundColor: '#121212', flex: 1 }}>
      <View style={{ paddingTop: 40, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>History</Text>
      </View>
      
      {history.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ color: '#E5E5E5', fontSize: 16, textAlign: 'center' }}>
            No workouts yet. Start your first workout to see it here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
