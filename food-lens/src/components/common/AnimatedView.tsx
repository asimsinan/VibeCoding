/**
 * AnimatedView Component
 * Animated view with fade and slide animations
 */

import React from 'react';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { DesignTokens } from '@/constants/designTokens';

export interface AnimatedViewProps {
  children: React.ReactNode;
  animation?: 'fade' | 'slide' | 'slideUp' | 'slideDown';
  duration?: number;
  testID?: string;
}

export const AnimatedView: React.FC<AnimatedViewProps> = ({
  children,
  animation = 'fade',
  duration = DesignTokens.animations.normal,
  testID,
}) => {
  const getEnteringAnimation = () => {
    switch (animation) {
      case 'fade':
        return FadeIn.duration(duration);
      case 'slide':
        return SlideInDown.duration(duration);
      case 'slideUp':
        return SlideInUp.duration(duration);
      case 'slideDown':
        return SlideInDown.duration(duration);
      default:
        return FadeIn.duration(duration);
    }
  };

  const getExitingAnimation = () => {
    switch (animation) {
      case 'fade':
        return FadeOut.duration(duration);
      case 'slide':
        return SlideOutDown.duration(duration);
      case 'slideUp':
        return SlideOutUp.duration(duration);
      case 'slideDown':
        return SlideOutDown.duration(duration);
      default:
        return FadeOut.duration(duration);
    }
  };

  return (
    <Animated.View
      entering={getEnteringAnimation()}
      exiting={getExitingAnimation()}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
};

