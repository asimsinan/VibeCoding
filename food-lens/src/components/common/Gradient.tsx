/**
 * Gradient Component
 * Modern gradient backgrounds
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';

// Try to import LinearGradient, fallback to View if not available
let LinearGradient: any;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  LinearGradient = null;
}

import { ViewStyle } from 'react-native';

export interface GradientProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success';
  testID?: string;
  style?: ViewStyle;
}

export const Gradient: React.FC<GradientProps> = ({
  children,
  variant = 'primary',
  testID,
  style,
}) => {
  const getGradientColors = () => {
    switch (variant) {
      case 'primary':
        return [ColorPalette.primary.light, ColorPalette.primary.main];
      case 'secondary':
        return [ColorPalette.neutral[100], ColorPalette.neutral[50]];
      case 'success':
        return [ColorPalette.success.light, ColorPalette.success.main];
      default:
        return [ColorPalette.primary.light, ColorPalette.primary.main];
    }
  };

  const gradientStyle: ViewStyle[] = [styles.gradient];
  if (style) {
    gradientStyle.push(style);
  }

  // Use LinearGradient if available, otherwise fallback to View
  if (LinearGradient) {
    return (
      <LinearGradient
        colors={getGradientColors()}
        style={gradientStyle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        testID={testID}
      >
        {children}
      </LinearGradient>
    );
  }

  // Fallback for environments without LinearGradient
  return (
    <View
      style={[...gradientStyle, { backgroundColor: ColorPalette.primary.main }]}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: DesignTokens.borderRadius.lg,
    overflow: 'hidden',
  },
});

