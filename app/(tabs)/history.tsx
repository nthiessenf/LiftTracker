import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Card } from '../../components/ui';

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

  // Calendar theme matching app's dark theme with updated styling
  const calendarTheme = {
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: 'rgba(255,255,255,0.4)',
    selectedDayBackgroundColor: '#10b981',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#10b981',
    dayTextColor: 'rgba(255,255,255,0.8)',
    textDisabledColor: 'rgba(255,255,255,0.2)',
    dotColor: '#10b981',
    selectedDotColor: '#ffffff',
    arrowColor: 'rgba(255,255,255,0.5)',
    monthTextColor: '#fff',
    indicatorColor: '#10b981',
    textDayFontWeight: '400',
    textMonthFontWeight: '600',
    textDayHeaderFontWeight: '500',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 12,
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
          marginBottom: 24,
        }}>
          History
        </Text>

        {/* Calendar Card */}
        <Card variant="default" style={{ marginBottom: 24, padding: 24 }}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            markingType="custom"
            theme={calendarTheme}
            style={{
              borderRadius: 12,
              backgroundColor: 'transparent',
            }}
          />
        </Card>

        {/* Workouts for Selected Date */}
        {filteredWorkouts.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, textAlign: 'center' }}>
              {history.length === 0
                ? 'No workouts yet. Start your first workout to see it here!'
                : `No workouts logged for ${selectedDate ? formatDateString(selectedDate) : 'this date'}.`}
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 24 }}>
            {filteredWorkouts.map((item) => (
              <Card
                key={item.id}
                variant="default"
                onPress={() => handleViewWorkout(item.id)}
                style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 4 }}>
                      {item.name || 'Untitled Workout'}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                      {formatDateString(item.date)} • {formatDuration(item.duration_seconds)}
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
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
