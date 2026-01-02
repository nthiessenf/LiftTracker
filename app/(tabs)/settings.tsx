import { Text, View } from 'react-native';

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-[#121212] items-center justify-center">
      <Text className="text-[#FFFFFF] text-2xl font-semibold mb-2">Settings</Text>
      <Text className="text-[#E5E5E5]">App settings will appear here</Text>
    </View>
  );
}

