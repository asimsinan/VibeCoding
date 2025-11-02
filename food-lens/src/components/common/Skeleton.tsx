/**
 * Skeleton Component
 * Loading skeleton placeholder for async content
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { DesignTokens } from '@/constants/designTokens';
import { ColorPalette } from '@/constants/colors';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  testID?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = DesignTokens.borderRadius.sm,
  style,
  testID,
}) => {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const baseStyle: ViewStyle = {
    width: width as DimensionValue,
    height,
    borderRadius,
    backgroundColor: ColorPalette.neutral[300],
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        baseStyle,
        animatedStyle,
        style,
      ]}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: ColorPalette.neutral[300],
  },
});

