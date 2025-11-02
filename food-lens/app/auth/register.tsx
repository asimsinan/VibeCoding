/**
 * Register Screen
 * User registration with modern, stylish design
 */

import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { useRouter } from 'expo-router';
import { ColorPalette } from '@/constants/colors';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[ColorPalette.primary[50], ColorPalette.primary[100], '#ffffff']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(500)} style={styles.formContainer}>
            <RegisterForm />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
});

