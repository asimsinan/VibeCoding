/**
 * Root Layout
 * Main application entry point with navigation setup
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/contexts/AppContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AppProvider>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <Stack
        screenOptions={{
          headerShown: true,
          header: ({ options, route }) => {
            const gradientColors: [string, string] = route.name === 'index' 
              ? [ColorPalette.primary[500], ColorPalette.primary[700]]
              : [ColorPalette.primary[400], ColorPalette.primary[600]];
            
            return (
              <LinearGradient
                colors={gradientColors}
                style={{
                  paddingTop: Platform.OS === 'ios' ? 50 : 20,
                  paddingBottom: 16,
                  paddingHorizontal: 20,
                  ...DesignTokens.shadows.medium,
                }}
              >
                <Text style={{
                  fontSize: 28,
                  fontWeight: '800',
                  color: ColorPalette.secondary.main,
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}>
                  {options.title || 'Food Lens'}
                </Text>
              </LinearGradient>
            );
          },
          headerTintColor: ColorPalette.secondary.main,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Food Lens',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            title: 'Login',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            title: 'Register',
            headerShown: true,
          }}
        />
      </Stack>
      </SafeAreaProvider>
    </AppProvider>
    </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

