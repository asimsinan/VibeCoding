/**
 * AccessibleView Component
 * Enhanced View component with accessibility features
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

export interface AccessibleViewProps extends ViewProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'none' | 'button' | 'link' | 'search' | 'image' | 'keyboardkey' | 'text' | 'adjustable' | 'imagebutton' | 'header' | 'summary' | 'alert' | 'checkbox' | 'combobox' | 'menu' | 'menubar' | 'menuitem' | 'progressbar' | 'radio' | 'radiogroup' | 'scrollbar' | 'spinbutton' | 'switch' | 'tab' | 'tabbar' | 'tablist' | 'timer' | 'toolbar';
  accessible?: boolean;
  children: React.ReactNode;
}

export const AccessibleView: React.FC<AccessibleViewProps> = ({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessible = true,
  children,
  style,
  ...props
}) => {
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      style={[styles.container, style]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Base styles
  },
});

