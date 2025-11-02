/**
 * Profile Screen
 * User profile and settings with modern, stylish design
 */

import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '@/components/common/Typography';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';
import { Shadow } from '@/components/common/Shadow';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <LinearGradient
        colors={[ColorPalette.primary[500], ColorPalette.primary[700]]}
        style={styles.header}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Typography variant="heading" color="secondary" style={styles.avatarText}>
                {user ? getInitials(user.displayName || user.email || 'U') : (
                  <MaterialIcons name="account-circle" size={40} color={ColorPalette.secondary.main} />
                )}
              </Typography>
            </View>
          </View>
          {user ? (
            <>
              <Typography variant="heading" color="secondary" style={styles.userName}>
                {user.displayName || 'User'}
              </Typography>
              <Typography variant="body" color="secondary" style={styles.userEmail}>
                {user.email || 'No email'}
              </Typography>
              {user.stats && (
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Typography variant="heading" color="secondary" style={styles.statValue}>
                      {user.stats.totalScans || 0}
                    </Typography>
                    <Typography variant="caption" color="secondary" style={styles.statLabel}>
                      Scans
                    </Typography>
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              <Typography variant="heading" color="secondary" style={styles.userName}>
                Guest User
              </Typography>
              <Typography variant="body" color="secondary" style={styles.userEmail}>
                Sign in to access all features
              </Typography>
            </>
          )}
        </Animated.View>
      </LinearGradient>

      {/* Profile Content */}
      <View style={styles.content}>
        {user && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Shadow variant="medium">
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Typography variant="body" color="neutral" style={styles.infoLabel}>
                    Language
                  </Typography>
                  <Typography variant="body" style={styles.infoValue}>
                    {user.language === 'en' ? '🇺🇸 English' : '🇹🇷 Turkish'}
                  </Typography>
                </View>
                {user.dietaryRestrictions && user.dietaryRestrictions.length > 0 && (
                  <View style={styles.infoRow}>
                    <Typography variant="body" color="neutral" style={styles.infoLabel}>
                      Dietary Restrictions
                    </Typography>
                    <Typography variant="body" style={styles.infoValue}>
                      {user.dietaryRestrictions.join(', ')}
                    </Typography>
                  </View>
                )}
                {user.createdAt && (
                  <View style={styles.infoRow}>
                    <Typography variant="body" color="neutral" style={styles.infoLabel}>
                      Member Since
                    </Typography>
                    <Typography variant="body" style={styles.infoValue}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Typography>
                  </View>
                )}
              </View>
            </Shadow>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.actionsContainer}>
          {user ? (
            <Button
              title="Sign Out"
              variant="primary"
              onPress={async () => {
                await logout();
                router.replace('/');
              }}
              style={styles.actionButton}
            />
          ) : (
            <Button
              title="Sign In"
              variant="primary"
              onPress={() => {
                router.push('/auth/login');
              }}
              style={styles.actionButton}
            />
          )}
          {!user && (
            <Button
              title="Create Account"
              variant="outline"
              onPress={() => {
                router.push('/auth/register');
              }}
              style={styles.actionButton}
            />
          )}
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...DesignTokens.shadows.medium,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userEmail: {
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.9,
  },
  content: {
    padding: 24,
    gap: 20,
  },
  infoCard: {
    backgroundColor: ColorPalette.secondary.main,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ColorPalette.neutral[100],
  },
  infoLabel: {
    fontSize: 15,
    color: ColorPalette.neutral[600],
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: ColorPalette.neutral[900],
  },
  actionsContainer: {
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    minHeight: 56,
    borderRadius: DesignTokens.borderRadius.lg,
  },
});

