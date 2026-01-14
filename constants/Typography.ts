import { TextStyle } from 'react-native';

/**
 * Premium typography system for LiftTrack
 * Apple-inspired typography with Inter font family
 */

export const Typography = {
  // App Title - 36px, bold, tight letter-spacing
  appTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -1,
    color: '#FFFFFF',
  } as TextStyle,

  // Section Headers - 18px, semi-bold
  sectionHeader: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
    color: '#FFFFFF',
  } as TextStyle,

  // Card Titles - 17px, semi-bold
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
    color: '#FFFFFF',
  } as TextStyle,

  // Body Text - 14px, regular
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: '#E5E5E5',
  } as TextStyle,

  // Body Metadata - 14px, regular, secondary color
  bodyMetadata: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: '#8E8E93',
  } as TextStyle,

  // Labels - Medium (500), smaller, uppercase, wide tracking
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '500' as TextStyle['fontWeight'],
    textTransform: 'uppercase' as TextStyle['textTransform'],
    letterSpacing: 1.5,
    color: '#8E8E93',
  } as TextStyle,

  // Large Title - for prominent headings
  largeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
    color: '#FFFFFF',
  } as TextStyle,
};

/**
 * Spacing system for consistent layout
 */
export const Spacing = {
  cardPadding: 20,
  sectionGap: 32,
  screenHorizontal: 24,
  elementGap: 16,
} as const;

/**
 * Apple-inspired card design system
 */
export const CardStyles = {
  // Base card style with gradient background and iOS shadow
  base: {
    backgroundColor: 'rgba(255,255,255,0.05)' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)' as const,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8, // Android shadow
  },
  
  // Pressed state style (for Pressable components)
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  
  // Button with inner glow effect
  buttonGlow: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
} as const;

