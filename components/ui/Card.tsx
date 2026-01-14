import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'accent';
  onPress?: () => void;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default', 
  onPress,
  style 
}) => {
  const getBackgroundColor = () => {
    if (variant === 'accent') return 'rgba(16,185,129,0.15)';
    if (variant === 'elevated') return 'rgba(255,255,255,0.18)';
    return 'rgba(255,255,255,0.06)';
  };

  const cardStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: variant === 'accent' 
      ? 'rgba(16,185,129,0.4)' 
      : variant === 'elevated'
        ? 'rgba(255,255,255,0.2)'
        : 'rgba(255,255,255,0.2)',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: variant === 'elevated' ? 12 : 8 },
    shadowOpacity: variant === 'elevated' ? 0.5 : 0.3,
    shadowRadius: variant === 'elevated' ? 20 : 16,
    elevation: variant === 'elevated' ? 12 : 8,
    ...style,
  };

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress} 
        style={{
          backgroundColor: getBackgroundColor(),
          borderRadius: 20,
          borderWidth: 1,
          borderColor: variant === 'accent' 
            ? 'rgba(16,185,129,0.4)' 
            : variant === 'elevated'
              ? 'rgba(255,255,255,0.2)'
              : 'rgba(255,255,255,0.2)',
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: variant === 'elevated' ? 12 : 8 },
          shadowOpacity: variant === 'elevated' ? 0.5 : 0.3,
          shadowRadius: variant === 'elevated' ? 20 : 16,
          elevation: variant === 'elevated' ? 12 : 8,
          ...style,
        }}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

export default Card;
