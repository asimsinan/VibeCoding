/**
 * Responsive Utilities
 * Helpers for responsive design in React Native
 */

import { Dimensions, ScaledSize } from 'react-native';
import { DesignTokens } from '@/constants/designTokens';

/**
 * Get responsive value based on screen size
 */
export const getResponsiveValue = <T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): T => {
  const { width } = Dimensions.get('window');
  
  if (width >= DesignTokens.breakpoints.desktop && desktop !== undefined) {
    return desktop;
  }
  if (width >= DesignTokens.breakpoints.tablet && tablet !== undefined) {
    return tablet;
  }
  return mobile;
};

/**
 * Get responsive font size
 */
export const getResponsiveFontSize = (baseSize: number): number => {
  const { width } = Dimensions.get('window');
  
  if (width >= DesignTokens.breakpoints.desktop) {
    return baseSize * 1.25;
  }
  if (width >= DesignTokens.breakpoints.tablet) {
    return baseSize * 1.15;
  }
  if (width < DesignTokens.breakpoints.mobile) {
    return baseSize * 0.9;
  }
  return baseSize;
};

/**
 * Get responsive spacing
 */
export const getResponsiveSpacing = (baseSpacing: number): number => {
  const { width } = Dimensions.get('window');
  
  if (width >= DesignTokens.breakpoints.desktop) {
    return baseSpacing * 1.5;
  }
  if (width >= DesignTokens.breakpoints.tablet) {
    return baseSpacing * 1.2;
  }
  return baseSpacing;
};

/**
 * Hook to listen to dimension changes
 */
export const useResponsive = () => {
  const [dimensions, setDimensions] = React.useState(Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({ window }: { window: ScaledSize }) => {
        setDimensions(window);
      }
    );

    return () => subscription?.remove();
  }, []);

  return {
    width: dimensions.width,
    height: dimensions.height,
    isTablet: dimensions.width >= DesignTokens.breakpoints.tablet,
    isSmallDevice: dimensions.width < DesignTokens.breakpoints.mobile,
    getResponsiveValue,
    getResponsiveFontSize,
    getResponsiveSpacing,
  };
};

// React import for hook
import React from 'react';

