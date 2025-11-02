/**
 * Tab Navigation Layout
 * Bottom tab navigation with modern, stylish design
 */

import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';

// Ultra-modern icon components with sleek design
const ScanIcon = ({ focused }: { focused: boolean }) => (
  <View style={{
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    {focused ? (
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: ColorPalette.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: ColorPalette.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      }}>
        <MaterialIcons 
          name="camera-alt" 
          size={24} 
          color={ColorPalette.secondary.main} 
        />
      </View>
    ) : (
      <MaterialIcons 
        name="camera-alt" 
        size={26} 
        color={ColorPalette.neutral[400]} 
      />
    )}
  </View>
);

const HistoryIcon = ({ focused }: { focused: boolean }) => (
  <View style={{
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    {focused ? (
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: ColorPalette.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: ColorPalette.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      }}>
        <MaterialIcons 
          name="history" 
          size={24} 
          color={ColorPalette.secondary.main} 
        />
      </View>
    ) : (
      <MaterialIcons 
        name="history" 
        size={26} 
        color={ColorPalette.neutral[500]} 
      />
    )}
  </View>
);

const ProfileIcon = ({ focused }: { focused: boolean }) => (
  <View style={{
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    {focused ? (
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: ColorPalette.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: ColorPalette.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      }}>
        <MaterialIcons 
          name="account-circle" 
          size={24} 
          color={ColorPalette.secondary.main} 
        />
      </View>
    ) : (
      <MaterialIcons 
        name="account-circle" 
        size={26} 
        color={ColorPalette.neutral[400]} 
      />
    )}
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: ({ options }) => {
          const getHeaderIcon = () => {
            const headerTitle = typeof options.headerTitle === 'string' ? options.headerTitle : options.title || '';
            if (headerTitle.includes('Scan')) return { name: 'camera-alt', size: 22 };
            if (headerTitle.includes('History') || headerTitle.includes('Scans')) return { name: 'history', size: 22 };
            if (headerTitle.includes('Profile')) return { name: 'account-circle', size: 22 };
            if (headerTitle.includes('Details')) return { name: 'info', size: 22 };
            return { name: 'camera-alt', size: 22 };
          };

          const iconInfo = getHeaderIcon();

          return (
            <LinearGradient
              colors={[ColorPalette.primary[500], ColorPalette.primary[700]]}
              style={{
                paddingTop: Platform.OS === 'ios' ? 50 : 20,
                paddingBottom: 16,
                paddingHorizontal: 20,
                ...DesignTokens.shadows.medium,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                }}>
                  <MaterialIcons name={iconInfo.name as any} size={iconInfo.size} color={ColorPalette.secondary.main} />
                </View>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: ColorPalette.secondary.main,
                  textShadowColor: 'rgba(0, 0, 0, 0.2)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                  flex: 1,
                }}>
                  {typeof options.headerTitle === 'string' ? options.headerTitle : options.title || 'Food Lens'}
                </Text>
              </View>
            </LinearGradient>
          );
        },
        headerTintColor: ColorPalette.secondary.main,
        headerTitle: '',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 92 : 80,
          paddingBottom: Platform.OS === 'ios' ? 30 : 16,
          paddingTop: 10,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.98)',
              'rgba(255, 255, 255, 0.95)',
            ]}
            style={{
              flex: 1,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 20,
            }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 10,
          marginBottom: 0,
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarActiveTintColor: ColorPalette.primary.main,
        tabBarInactiveTintColor: ColorPalette.neutral[500],
      }}
    >
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarLabel: 'Scan',
          headerTitle: 'Scan Food',
          tabBarIcon: ({ focused }) => <ScanIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          headerTitle: 'Your Scans',
          tabBarIcon: ({ focused }) => <HistoryIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="results/[id]"
        options={{
          href: null,
          headerTitle: 'Scan Details',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />
    </Tabs>
  );
}

