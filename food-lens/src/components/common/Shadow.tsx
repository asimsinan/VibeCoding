/**
 * Shadow Component
 * Platform-specific shadow wrapper
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { DesignTokens } from '@/constants/designTokens';

export interface ShadowProps {
  children: React.ReactNode;
  variant?: 'small' | 'medium' | 'large';
  testID?: string;
}

export const Shadow: React.FC<ShadowProps> = ({
  children,
  variant = 'medium',
  testID,
}) => {
  // Apply shadow based on variant using design tokens
  const shadowConfig =
    variant === 'small'
      ? DesignTokens.shadows.small
      : variant === 'large'
      ? DesignTokens.shadows.large
      : DesignTokens.shadows.medium;

  const config = shadowConfig;
  
  // Combine all shadow styles into a single object
  const shadowStyle: ViewStyle = {
    shadowColor: '#000',
    shadowOffset: config.shadowOffset,
    shadowOpacity: config.shadowOpacity,
    shadowRadius: config.shadowRadius,
    ...(Platform.OS === 'android' ? { elevation: config.elevation } : {}),
  };

  return (
    <View style={shadowStyle} testID={testID}>
      {children}
    </View>
  );
};

