import { Text, View } from 'react-native';
import { CircularProgressBase } from 'react-native-circular-progress-indicator';

type WeeklyGoalRingProps = {
  currentCount: number;
  goal: number;
  streak: number;
  onEditGoal?: () => void;
};

export default function WeeklyGoalRing({ currentCount, goal, streak, onEditGoal }: WeeklyGoalRingProps) {
  return (
    <CircularProgressBase
      value={currentCount}
      maxValue={goal || 1}
      radius={50}
      activeStrokeColor={currentCount > 0 ? "#10b981" : "transparent"}
      inActiveStrokeColor="#444444"
      activeStrokeWidth={10}
      inActiveStrokeWidth={10}
      rotation={-90}>
      <View style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '700' }}>
          {currentCount}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '500' }}>
          /{goal}
        </Text>
      </View>
    </CircularProgressBase>
  );
}

