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
  const getButtonStyle = (pressed = false): ViewStyle => {
    const isSmall = size === 'small';
    
    if (variant === 'primary') {
      return {
        backgroundColor: pressed ? '#059669' : 'red',
        paddingHorizontal: isSmall ? 20 : 24,
        paddingVertical: isSmall ? 10 : 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
      };
    } else {
      return {
        backgroundColor: pressed ? 'rgba(16,185,129,0.15)' : 'transparent',
        paddingHorizontal: isSmall ? 20 : 24,
        paddingVertical: isSmall ? 10 : 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
      };
    }
  };

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
