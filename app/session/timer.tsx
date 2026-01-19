import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, Vibration } from 'react-native';

export default function TimerScreen() {
  const router = useRouter();
  const { duration, exerciseName } = useLocalSearchParams<{ duration: string; exerciseName?: string }>();
  const [secondsLeft, setSecondsLeft] = useState(parseInt(duration) || 90);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          Vibration.vibrate(500);
          router.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSkip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    router.back();
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#0a0a0a', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: 24,
    }}>
      {exerciseName && (
        <Text style={{ 
          color: 'rgba(255,255,255,0.5)', 
          fontSize: 16, 
          marginBottom: 8,
          textAlign: 'center',
        }}>
          Rest before next set
        </Text>
      )}
      
      <Text style={{ 
        color: '#10b981', 
        fontSize: 80, 
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
      }}>
        {formatTime(secondsLeft)}
      </Text>
      
      <Pressable
        onPress={handleSkip}
        style={{
          marginTop: 48,
          paddingVertical: 16,
          paddingHorizontal: 48,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Skip</Text>
      </Pressable>
    </View>
  );
}

