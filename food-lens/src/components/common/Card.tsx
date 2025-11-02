/**
 * Card Component
 * Modern card with shadow and elevation
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens, isTablet } from '@/constants/designTokens';

export interface CardProps {
  children: React.ReactNode;
  shadow?: boolean;
  elevation?: number;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  shadow = true,
  elevation = 2,
  testID,
}) => {
  const cardStyle: ViewStyle[] = [styles.card];

  if (shadow) {
    cardStyle.push(styles.shadow);
    if (Platform.OS === 'android') {
      cardStyle.push({ elevation });
    }
  }

  const getTestID = () => {
    if (testID) return testID;
    if (elevation > 0 && !shadow) return 'card-elevated';
    if (shadow) return 'card-shadow';
    return 'card';
  };

  return (
    <View style={cardStyle} testID={getTestID()}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ColorPalette.secondary.main,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: isTablet ? DesignTokens.spacing.lg : DesignTokens.spacing.md,
    marginVertical: DesignTokens.spacing.sm,
    marginHorizontal: isTablet ? DesignTokens.spacing.lg : DesignTokens.spacing.md,
    maxWidth: isTablet ? 600 : '100%',
    alignSelf: isTablet ? 'center' : 'stretch',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: DesignTokens.shadows.medium.shadowOffset,
    shadowOpacity: DesignTokens.shadows.medium.shadowOpacity,
    shadowRadius: DesignTokens.shadows.medium.shadowRadius,
  },
});

