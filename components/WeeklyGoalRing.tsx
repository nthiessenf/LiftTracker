import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { CircularProgressBase } from 'react-native-circular-progress-indicator';

type WeeklyGoalRingProps = {
  currentCount: number;
  goal: number;
  streak: number;
  onEditGoal?: () => void;
};

export default function WeeklyGoalRing({ currentCount, goal, streak, onEditGoal }: WeeklyGoalRingProps) {
  return (
    <View
      style={{
        backgroundColor: '#1e1e1e',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2a2a2a',
        minWidth: 320,
        marginBottom: 20,
        marginHorizontal: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      {/* Left Section - The Ring */}
      <View>
        <CircularProgressBase
          value={currentCount}
          maxValue={goal}
          radius={32}
          activeStrokeColor="#10b981"
          inActiveStrokeColor="#333333"
          activeStrokeWidth={8}
          inActiveStrokeWidth={8}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
              {currentCount}/{goal}
            </Text>
          </View>
        </CircularProgressBase>
      </View>

      {/* Middle Section - Goal Text */}
      <View style={{ flex: 1, marginHorizontal: 16 }}>
        <Text style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>Weekly Goal</Text>
        <Pressable
          onPress={onEditGoal}
          style={{ flexDirection: 'row', alignItems: 'center' }}
          disabled={!onEditGoal}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginRight: 4 }}>
            {goal} Workouts
          </Text>
          {onEditGoal && <MaterialIcons name="edit" size={14} color="#666" />}
        </Pressable>
      </View>

      {/* Right Section - Streak */}
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>Current Streak</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="local-fire-department" size={16} color="#10b981" />
          <Text style={{ color: '#10b981', fontSize: 16, fontWeight: 'bold', marginLeft: 4 }}>
            {streak} Weeks
          </Text>
        </View>
      </View>
    </View>
  );
}

