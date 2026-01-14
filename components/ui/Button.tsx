import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'default' | 'small';
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary',
  size = 'default',
  style 
}) => {
  return (
    <Pressable 
      onPress={onPress}
      style={{
        backgroundColor: variant === 'primary' ? '#10b981' : 'transparent',
        paddingHorizontal: size === 'small' ? 20 : 24,
        paddingVertical: size === 'small' ? 10 : 14,
        borderRadius: 12,
        borderWidth: variant === 'secondary' ? 1.5 : 0,
        borderColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{
        color: variant === 'primary' ? '#FFFFFF' : '#10b981',
        fontSize: 15,
        fontWeight: '600',
      }}>
        {title}
      </Text>
    </Pressable>
  );
};

export default Button;
