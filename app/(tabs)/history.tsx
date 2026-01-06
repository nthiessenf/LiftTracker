import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

type Workout = {
  id: string;
  date: string;
  name: string | null;
  duration_seconds: number | null;
};

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const [history, setHistory] = useState<Workout[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const loadHistory = useCallback(async () => {
    try {
      const workouts = await db.getAllAsync<Workout>(
        'SELECT * FROM workouts ORDER BY date DESC'
      );
      setHistory(workouts);

      // Set initial selected date to most recent workout date, or today if no workouts
      if (workouts.length > 0) {
        const mostRecentDate = workouts[0].date.split('T')[0];
        setSelectedDate(mostRecentDate);
      } else {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
      // Set to today if error
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  // Transform workout dates into markedDates format for Calendar
  const markedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};
    
    // First, mark all workout days with solid background
    history.forEach((workout) => {
      // Extract date part (YYYY-MM-DD)
      let dateKey = workout.date;
      if (dateKey.includes('T')) {
        dateKey = dateKey.split('T')[0];
      }
      
      // Ensure it's in YYYY-MM-DD format
      if (dateKey.match(/^\d{4}-\d{2}-\d{2}$/)) {
        marked[dateKey] = {
          selected: true,
          selectedColor: '#10b981', // Emerald green to match app theme
          selectedTextColor: '#ffffff', // White text for contrast
        };
      }
    });

    // Handle user-selected date
    if (selectedDate) {
      if (marked[selectedDate]) {
        // Date is both a workout day AND selected - add a border to make it stand out
        marked[selectedDate] = {
          ...marked[selectedDate],
          customStyles: {
            container: {
              backgroundColor: '#10b981',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: '#ffffff', // White border for emphasis
            },
            text: {
              color: '#ffffff',
              fontWeight: 'bold',
            },
          },
        };
      } else {
        // Date is selected but not a workout day - show with a different style
        marked[selectedDate] = {
          selected: true,
          selectedColor: '#3f3f46', // Subtle gray background
          selectedTextColor: '#ffffff',
          customStyles: {
            container: {
              backgroundColor: '#3f3f46',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#10b981', // Green border to indicate selection
            },
            text: {
              color: '#ffffff',
            },
          },
        };
      }
    }

    return marked;
  }, [history, selectedDate]);

  // Filter workouts by selected date
  const filteredWorkouts = useMemo(() => {
    if (!selectedDate) return [];
    
    return history.filter((workout) => {
      let workoutDate = workout.date;
      if (workoutDate.includes('T')) {
        workoutDate = workoutDate.split('T')[0];
      }
      return workoutDate === selectedDate;
    });
  }, [history, selectedDate]);

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

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
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

  // Calendar theme matching app's dark theme
  const calendarTheme = {
    backgroundColor: '#121212',
    calendarBackground: '#121212',
    textSectionTitleColor: '#E5E5E5',
    selectedDayBackgroundColor: '#10b981',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#10b981',
    dayTextColor: '#ffffff',
    textDisabledColor: '#666',
    dotColor: '#10b981',
    selectedDotColor: '#ffffff',
    arrowColor: '#10b981',
    monthTextColor: '#ffffff',
    indicatorColor: '#10b981',
    textDayFontWeight: '400',
    textMonthFontWeight: '600',
    textDayHeaderFontWeight: '600',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
  };

  return (
    <View style={{ backgroundColor: '#121212', flex: 1 }}>
      <View style={{ paddingTop: 40, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>History</Text>
      </View>
      
      {/* Calendar Section */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={markedDates}
          markingType="custom"
          theme={calendarTheme}
          style={{
            borderRadius: 12,
            backgroundColor: '#1e1e1e',
            padding: 8,
          }}
        />
      </View>

      {/* Workouts for Selected Date */}
      <View style={{ flex: 1 }}>
        {filteredWorkouts.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Text style={{ color: '#E5E5E5', fontSize: 16, textAlign: 'center' }}>
              {history.length === 0
                ? 'No workouts yet. Start your first workout to see it here!'
                : `No workouts logged for ${selectedDate ? formatDateString(selectedDate) : 'this date'}.`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredWorkouts}
            renderItem={renderWorkoutItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </View>
  );
}
