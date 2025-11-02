/**
 * Toast Component
 * Toast notification for feedback messages
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';
import { FontAwesome } from '@expo/vector-icons';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
  duration?: number;
  onDismiss?: () => void;
  testID?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  duration = 3000,
  onDismiss,
  testID,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: ColorPalette.success.main, icon: 'check-circle' };
      case 'error':
        return { backgroundColor: ColorPalette.error.main, icon: 'exclamation-circle' };
      case 'warning':
        return { backgroundColor: ColorPalette.warning.main, icon: 'exclamation-triangle' };
      default:
        return { backgroundColor: ColorPalette.info.main, icon: 'info-circle' };
    }
  };

  const typeStyles = getTypeStyles();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      testID={testID}
    >
      <View style={[styles.toast, { backgroundColor: typeStyles.backgroundColor }]}>
        <FontAwesome name={typeStyles.icon as any} size={20} color={ColorPalette.secondary.main} />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
          <FontAwesome name="times" as any size={16} color={ColorPalette.secondary.main} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: DesignTokens.spacing.md,
    right: DesignTokens.spacing.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: DesignTokens.shadows.medium.shadowOffset,
    shadowOpacity: DesignTokens.shadows.medium.shadowOpacity,
    shadowRadius: DesignTokens.shadows.medium.shadowRadius,
    elevation: DesignTokens.shadows.medium.elevation,
  },
  message: {
    flex: 1,
    color: ColorPalette.secondary.main,
    fontSize: DesignTokens.typography.body.fontSize,
    marginLeft: DesignTokens.spacing.sm,
  },
  dismissButton: {
    padding: DesignTokens.spacing.xs,
    marginLeft: DesignTokens.spacing.sm,
  },
});

