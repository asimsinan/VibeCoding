/**
 * Button Component
 * Modern, accessible button with variants and animations
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';

export interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  onPress,
  loading = false,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
}) => {
  const buttonStyle: ViewStyle[] = [styles.button];
  const textStyle: TextStyle[] = [styles.text];

  if (style) {
    buttonStyle.push(style);
  }

  // Apply variant styles
  switch (variant) {
    case 'primary':
      buttonStyle.push(styles.primaryButton);
      textStyle.push(styles.primaryText);
      break;
    case 'secondary':
      buttonStyle.push(styles.secondaryButton);
      textStyle.push(styles.secondaryText);
      break;
    case 'outline':
      buttonStyle.push(styles.outlineButton);
      textStyle.push(styles.outlineText);
      break;
  }

  if (disabled || loading) {
    buttonStyle.push(styles.disabled);
  }

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        testID={testID}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? '#ffffff' : ColorPalette.primary.main}
            testID="button-loading"
          />
        ) : (
          <Text style={textStyle}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.borderRadius.md,
    minHeight: DesignTokens.touchTarget.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: DesignTokens.shadows.small.shadowOffset,
    shadowOpacity: DesignTokens.shadows.small.shadowOpacity,
    shadowRadius: DesignTokens.shadows.small.shadowRadius,
    elevation: DesignTokens.shadows.small.elevation + 1,
  },
  primaryButton: {
    backgroundColor: ColorPalette.primary.main,
  },
  secondaryButton: {
    backgroundColor: ColorPalette.secondary.main,
    borderWidth: 1,
    borderColor: ColorPalette.neutral[300],
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: ColorPalette.primary.main,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: ColorPalette.neutral[900],
  },
  outlineText: {
    color: ColorPalette.primary.main,
  },
  disabled: {
    opacity: 0.5,
  },
});

