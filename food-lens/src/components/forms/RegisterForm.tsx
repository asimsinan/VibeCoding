/**
 * RegisterForm Component
 * User registration form with modern, stylish design
 */

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text } from 'react-native';
import { Typography } from '@/components/common/Typography';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useToast } from '@/contexts/ToastContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';
import { Shadow } from '@/components/common/Shadow';

export interface RegisterFormProps {
  onSubmit?: (displayName: string, email: string, password: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit }) => {
  const { register, loading: authLoading, error: authError } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const validatePassword = (passwordValue: string) => {
    if (passwordValue.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      validatePassword(text);
    }
  };

  const handleSubmit = async () => {
    const isValid = validatePassword(password);
    if (!isValid) {
      return;
    }
    if (!displayName || !email) {
      return;
    }

    try {
      await register(email, password, displayName);
      showToast('Registration successful! Welcome!', 'success');
      
      if (onSubmit) {
        onSubmit(displayName, email, password);
      }
      
      router.replace('/(tabs)/scanner');
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
      console.error('Registration failed:', err);
    }
  };

  return (
    <Shadow variant="large">
      <View style={styles.card}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Typography variant="heading" style={styles.iconEmoji}>
              🎉
            </Typography>
          </View>
          <Typography variant="heading" style={styles.title}>
            Create Account
          </Typography>
          <Typography variant="body" color="neutral" style={styles.subtitle}>
            Join Food Lens and start your healthy journey
          </Typography>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Typography variant="caption" style={styles.label}>
              Display Name
            </Typography>
            <View style={[
              styles.inputWrapper,
              nameFocused && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={ColorPalette.neutral[400]}
                value={displayName}
                onChangeText={setDisplayName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                autoCapitalize="words"
                accessible
                accessibilityLabel="Display name input"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Typography variant="caption" style={styles.label}>
              Email Address
            </Typography>
            <View style={[
              styles.inputWrapper,
              emailFocused && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor={ColorPalette.neutral[400]}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                accessible
                accessibilityLabel="Email input"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Typography variant="caption" style={styles.label}>
              Password
            </Typography>
            <View style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused,
              passwordError && styles.inputWrapperError
            ]}>
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                placeholderTextColor={ColorPalette.neutral[400]}
                value={password}
                onChangeText={handlePasswordChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry
                autoComplete="password-new"
                accessible
                accessibilityLabel="Password input"
              />
            </View>
            {passwordError ? (
              <Typography variant="caption" color="error" style={styles.errorText} testID="password-error">
                {passwordError}
              </Typography>
            ) : null}
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
            title="Create Account"
            variant="primary"
            onPress={handleSubmit}
            testID="register-submit"
            loading={authLoading}
            disabled={authLoading}
            style={styles.submitButton}
          />

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text
                style={styles.loginLinkText}
                onPress={() => router.push('/auth/login')}
              >
                Sign In
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
    textAlign: 'center',
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
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginText: {
    textAlign: 'center',
    fontSize: 15,
    color: ColorPalette.neutral[600],
  },
  loginLinkText: {
    fontWeight: '700',
    color: ColorPalette.primary.main,
  },
});

