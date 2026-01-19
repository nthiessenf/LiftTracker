import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, Vibration } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export default function TimerScreen() {
  const router = useRouter();
  const { duration, exerciseName } = useLocalSearchParams<{ duration: string; exerciseName?: string }>();
  const [secondsLeft, setSecondsLeft] = useState(parseInt(duration) || 90);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ring constants
  const RADIUS = 120;
  const STROKE_WIDTH = 8;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const totalDuration = parseInt(duration) || 90;

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

  // Calculate ring progress
  const progress = secondsLeft / totalDuration;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

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
          marginBottom: 48,
          textAlign: 'center',
        }}>
          Rest before next set
        </Text>
      )}
      
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {/* Ring SVG */}
        <Svg width={RADIUS * 2 + STROKE_WIDTH * 2} height={RADIUS * 2 + STROKE_WIDTH * 2}>
          {/* Background ring */}
          <Circle
            cx={RADIUS + STROKE_WIDTH}
            cy={RADIUS + STROKE_WIDTH}
            r={RADIUS}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress ring - rotated to start at 12 o'clock */}
          <G
            rotation={-90}
            origin={`${RADIUS + STROKE_WIDTH}, ${RADIUS + STROKE_WIDTH}`}
          >
            <Circle
              cx={RADIUS + STROKE_WIDTH}
              cy={RADIUS + STROKE_WIDTH}
              r={RADIUS}
              stroke="#10b981"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />
          </G>
        </Svg>
        
        {/* Timer text centered over the ring */}
        <View style={{ 
          position: 'absolute', 
          alignItems: 'center',
        }}>
          <Text style={{ 
            color: '#10b981', 
            fontSize: 72, 
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
          }}>
            {formatTime(secondsLeft)}
          </Text>
        </View>
      </View>
      
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

