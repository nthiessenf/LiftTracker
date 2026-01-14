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

