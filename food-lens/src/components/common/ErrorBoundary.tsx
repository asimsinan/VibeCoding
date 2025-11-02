/**
 * ErrorBoundary Component
 * Error boundary for graceful error handling
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Typography variant="heading" color="error" style={styles.title}>
            Something went wrong
          </Typography>
          <Typography variant="body" color="neutral" style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button
            title="Try Again"
            variant="primary"
            onPress={this.handleReset}
            style={styles.button}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
    backgroundColor: ColorPalette.secondary.main,
  },
  title: {
    marginBottom: DesignTokens.spacing.md,
  },
  message: {
    marginBottom: DesignTokens.spacing.xl,
    textAlign: 'center',
  },
  button: {
    marginTop: DesignTokens.spacing.md,
  },
});

