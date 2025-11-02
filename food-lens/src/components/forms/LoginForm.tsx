/**
 * LoginForm Component
 * User login form with modern, stylish design
 */

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '@/components/common/Typography';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useToast } from '@/contexts/ToastContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';
import { Shadow } from '@/components/common/Shadow';

export interface LoginFormProps {
  onSubmit?: (email: string, password: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const { login, loading: authLoading, error: authError } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  // Default values for testing (development only)
  const [email, setEmail] = useState('asy@gmail.com');
  const [password, setPassword] = useState('123456');
  const [emailError, setEmailError] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError('');
      setIsValid(false);
      return false;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError('Invalid email format');
      setIsValid(false);
      return false;
    }
    setEmailError('');
    setIsValid(true);
    return true;
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      validateEmail(text);
    }
  };

  const handleSubmit = async () => {
    const emailValid = validateEmail(email);
    if (!emailValid) {
      return;
    }
    if (!password) {
      return;
    }

    try {
      await login(email, password);
      showToast('Login successful!', 'success');
      
      if (onSubmit) {
        onSubmit(email, password);
      }
      
      router.replace('/(tabs)/scanner');
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please try again.', 'error');
      console.error('Login failed:', err);
    }
  };

  return (
    <Shadow variant="large">
      <View style={styles.card}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Typography variant="heading" style={styles.iconEmoji}>
              👋
            </Typography>
          </View>
          <Typography variant="heading" style={styles.title}>
            Welcome Back
          </Typography>
          <Typography variant="body" color="neutral" style={styles.subtitle}>
            Sign in to continue
          </Typography>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Typography variant="caption" style={styles.label}>
              Email Address
            </Typography>
            <View style={[
              styles.inputWrapper,
              emailFocused && styles.inputWrapperFocused,
              emailError && styles.inputWrapperError
            ]}>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor={ColorPalette.neutral[400]}
                value={email}
                onChangeText={handleEmailChange}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                accessible
                accessibilityLabel="Email input"
              />
            </View>
            {email && !emailError && (
              <View testID="email-valid" style={{ position: 'absolute', top: -1000 }} />
            )}
            {emailError ? (
              <Typography variant="caption" color="error" style={styles.errorText} testID="email-error">
                {emailError}
              </Typography>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Typography variant="caption" style={styles.label}>
              Password
            </Typography>
            <View style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={ColorPalette.neutral[400]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry
                autoComplete="password"
                accessible
                accessibilityLabel="Password input"
              />
            </View>
          </View>

          {authError && (
            <View style={styles.errorContainer}>
              <Typography variant="caption" color="error" style={styles.error}>
                {authError}
              </Typography>
            </View>
          )}

          {authLoading && (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="small" />
            </View>
          )}

          <Button
            title="Sign In"
            variant="primary"
            onPress={handleSubmit}
            testID="login-submit"
            loading={authLoading}
            disabled={authLoading}
            style={styles.submitButton}
          />

          <View style={styles.registerLink}>
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text
                style={styles.registerLinkText}
                onPress={() => router.push('/auth/register')}
              >
                Create Account
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </Shadow>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ColorPalette.secondary.main,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: 32,
    width: '100%',
    ...DesignTokens.shadows.large,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ColorPalette.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    marginBottom: 8,
    fontSize: 32,
    fontWeight: '800',
    color: ColorPalette.neutral[900],
  },
  subtitle: {
    fontSize: 16,
    color: ColorPalette.neutral[600],
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 4,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    color: ColorPalette.neutral[700],
    fontSize: 14,
  },
  inputWrapper: {
    borderWidth: 2,
    borderColor: ColorPalette.neutral[200],
    borderRadius: DesignTokens.borderRadius.lg,
    backgroundColor: ColorPalette.neutral[50],
    paddingHorizontal: 16,
    minHeight: 56,
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  inputWrapperFocused: {
    borderColor: ColorPalette.primary.main,
    backgroundColor: ColorPalette.secondary.main,
    ...DesignTokens.shadows.small,
  },
  inputWrapperError: {
    borderColor: ColorPalette.error.main,
  },
  input: {
    fontSize: 16,
    color: ColorPalette.neutral[900],
    paddingVertical: 4,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
  },
  errorContainer: {
    paddingVertical: 8,
  },
  error: {
    fontSize: 13,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  submitButton: {
    marginTop: 8,
    minHeight: 56,
    borderRadius: DesignTokens.borderRadius.lg,
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    textAlign: 'center',
    fontSize: 15,
    color: ColorPalette.neutral[600],
  },
  registerLinkText: {
    fontWeight: '700',
    color: ColorPalette.primary.main,
  },
});

