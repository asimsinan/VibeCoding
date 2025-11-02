/**
 * LoadingSpinner Component
 * Reusable loading spinner with customizable size and color
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  overlay?: boolean;
  message?: string;
  style?: ViewStyle;
  testID?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = ColorPalette.primary.main,
  overlay = false,
  message,
  style,
  testID,
}) => {
  const spinner = (
    <View style={[styles.container, style]} testID={testID}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <View style={styles.messageContainer}>
          {/* Message would be displayed here if Typography component is available */}
        </View>
      )}
    </View>
  );

  if (overlay) {
    return (
      <View style={styles.overlay}>
        {spinner}
      </View>
    );
  }

  return spinner;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  messageContainer: {
    marginTop: DesignTokens.spacing.md,
  },
});

