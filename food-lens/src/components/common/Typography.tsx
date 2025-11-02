/**
 * Typography Component
 * Consistent text styling across the app
 */

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';

export interface TypographyProps {
  children: React.ReactNode;
  variant?: 'heading' | 'subheading' | 'body' | 'caption';
  color?: 'primary' | 'secondary' | 'neutral' | 'error' | 'success';
  style?: TextStyle;
  testID?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = 'neutral',
  style,
  testID,
}) => {
  const textStyle: TextStyle[] = [styles.base];

  // Apply variant styles from design tokens
  switch (variant) {
    case 'heading':
      textStyle.push({ ...DesignTokens.typography.heading });
      break;
    case 'subheading':
      textStyle.push({ ...DesignTokens.typography.subheading });
      break;
    case 'body':
      textStyle.push({ ...DesignTokens.typography.body });
      break;
    case 'caption':
      textStyle.push({ ...DesignTokens.typography.caption });
      break;
  }

  // Apply color styles
  switch (color) {
    case 'primary':
      textStyle.push({ color: ColorPalette.primary.main });
      break;
    case 'secondary':
      textStyle.push({ color: ColorPalette.secondary.dark });
      break;
    case 'neutral':
      textStyle.push({ color: ColorPalette.neutral[900] });
      break;
    case 'error':
      textStyle.push({ color: ColorPalette.error.main });
      break;
    case 'success':
      textStyle.push({ color: ColorPalette.success.main });
      break;
  }

  if (style) {
    textStyle.push(style);
  }

  return <Text style={textStyle} testID={testID}>{children}</Text>;
};

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
});

