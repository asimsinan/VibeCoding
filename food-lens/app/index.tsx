/**
 * Welcome/Home Screen
 * Entry point - redirects to auth or main app
 * Modern, stylish design with appealing visuals
 */

import { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '@/components/common/Typography';
import { Button } from '@/components/common/Button';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[ColorPalette.primary[500], ColorPalette.primary[700], ColorPalette.primary[900]]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* App Icon/Brand Area */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.iconContainer}
        >
          <View style={styles.iconCircle}>
            <MaterialIcons name="camera-alt" size={64} color={ColorPalette.secondary.main} />
          </View>
        </Animated.View>

        {/* Title Section */}
        <Animated.View 
          entering={FadeInUp.delay(400).duration(600)}
          style={styles.textContainer}
        >
          <Typography variant="heading" color="secondary" style={styles.title}>
            Food Lens
          </Typography>
          <Typography variant="body" color="secondary" style={styles.subtitle}>
            Discover nutrition facts instantly
          </Typography>
          <Typography variant="caption" color="secondary" style={styles.description}>
            Scan any food label with your camera and get detailed nutrition information, allergen warnings, and healthier alternatives
          </Typography>
        </Animated.View>

        {/* Features List */}
        <Animated.View 
          entering={FadeInUp.delay(600).duration(600)}
          style={styles.featuresContainer}
        >
          <View style={styles.feature}>
            <Typography variant="body" color="secondary" style={styles.featureText}>
              ✓ Instant nutrition analysis
            </Typography>
          </View>
          <View style={styles.feature}>
            <Typography variant="body" color="secondary" style={styles.featureText}>
              ✓ Allergen detection
            </Typography>
          </View>
          <View style={styles.feature}>
            <Typography variant="body" color="secondary" style={styles.featureText}>
              ✓ Healthier alternatives
            </Typography>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInUp.delay(800).duration(600)}
          style={styles.buttonContainer}
        >
          <Button
            title="Get Started"
            variant="secondary"
            onPress={() => router.push('/auth/register')}
            style={styles.primaryButton}
          />
          <Button
            title="Login"
            variant="outline"
            onPress={() => router.push('/auth/login')}
            style={styles.secondaryButton}
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
    paddingHorizontal: 16,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    includeFontPadding: false,
    lineHeight: 50,
    width: '100%',
    paddingHorizontal: 8,
  },
  subtitle: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    opacity: 0.95,
  },
  description: {
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 20,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 48,
    gap: 12,
  },
  feature: {
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 16,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    maxWidth: 400,
  },
  primaryButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 16,
  },
  secondaryButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});
