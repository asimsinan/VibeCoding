/**
 * Results Screen
 * Display scan results with nutrition and allergen information
 * Modern, stylish design with appealing visuals
 */

import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '@/components/common/Typography';
import { Card } from '@/components/common/Card';
import { useScan } from '@/hooks/useScan';
import { NutritionCard } from '@/components/cards/NutritionCard';
import { AllergenCard } from '@/components/cards/AllergenCard';
import { AlternativeList } from '@/components/cards/AlternativeList';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Skeleton } from '@/components/common/Skeleton';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';
import { Shadow } from '@/components/common/Shadow';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentScan, getScan, loading } = useScan();

  useEffect(() => {
    if (id) {
      // Call API service to load scan results
      getScan(id).catch((err) => {
        console.error('Failed to load scan:', err);
      });
    }
  }, [id, getScan]);

  // Refresh scan if it's pending/processing (poll for updates)
  useEffect(() => {
    if (!id || !currentScan) return;
    
    if (currentScan.status === 'pending' || currentScan.status === 'processing') {
      const interval = setInterval(() => {
        getScan(id).catch((err) => {
          console.error('Failed to refresh scan:', err);
        });
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [id, currentScan?.status, getScan]);

  if (loading && !currentScan) {
    return (
      <ScrollView style={styles.container}>
        <Card>
          <LoadingSpinner size="large" message="Loading scan results..." />
          <View style={styles.skeletonContainer}>
            <Skeleton width="100%" height={120} style={styles.skeletonItem} />
            <Skeleton width="100%" height={200} style={styles.skeletonItem} />
            <Skeleton width="100%" height={150} style={styles.skeletonItem} />
          </View>
        </Card>
      </ScrollView>
    );
  }

  if (!currentScan) {
    return (
      <ScrollView style={styles.container}>
        <Card>
          <Typography variant="heading">Scan Not Found</Typography>
          <Typography variant="body" color="neutral">
            The requested scan could not be found.
          </Typography>
        </Card>
      </ScrollView>
    );
  }

  // Show status-based UI
  const isPending = currentScan.status === 'pending' || currentScan.status === 'processing';
  const isFailed = currentScan.status === 'failed';
  const isCompleted = currentScan.status === 'completed';

  const getStatusConfig = () => {
    if (isCompleted) {
      return { color: ColorPalette.success.main, icon: 'check-circle' as const, bg: ColorPalette.primary[50] };
    }
    if (isFailed) {
      return { color: ColorPalette.error.main, icon: 'error' as const, bg: ColorPalette.neutral[50] };
    }
    return { color: ColorPalette.warning.main, icon: 'hourglass-empty' as const, bg: ColorPalette.primary[50] };
  };

  const statusConfig = getStatusConfig();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <LinearGradient
        colors={[ColorPalette.primary[500], ColorPalette.primary[700]]}
        style={styles.header}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.headerContent}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <View style={styles.statusIconContainer}>
              <MaterialIcons name={statusConfig.icon} size={24} color={statusConfig.color} />
            </View>
            <Typography 
              variant="caption" 
              style={{ ...styles.statusText, color: statusConfig.color } as any}
            >
              {currentScan.status.toUpperCase()}
            </Typography>
          </View>
          {currentScan.nutritionData?.foodName && (
            <Typography variant="heading" color="secondary" style={styles.foodName}>
              {currentScan.nutritionData.foodName}
            </Typography>
          )}
          {currentScan.createdAt && (
            <Typography variant="caption" color="secondary" style={styles.date}>
              Scanned on {new Date(currentScan.createdAt).toLocaleDateString()}
            </Typography>
          )}
        </Animated.View>
      </LinearGradient>

      {/* Content Section */}
      <View style={styles.content}>
        {isPending && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Shadow variant="medium">
              <View style={styles.processingCard}>
                <LoadingSpinner size="large" />
                <Typography variant="subheading" style={styles.processingTitle}>
                  Processing Your Scan
                </Typography>
                <Typography variant="body" color="neutral" style={styles.processingMessage}>
                  Your food label is being analyzed by AI. This may take a few moments.
                </Typography>
              </View>
            </Shadow>
          </Animated.View>
        )}

        {isFailed && currentScan.error && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Shadow variant="medium">
              <View style={styles.errorCard}>
                <Typography variant="heading" color="error" style={styles.errorTitle}>
                  Scan Failed
                </Typography>
                <Typography variant="body" color="error" style={styles.errorMessage}>
                  {currentScan.error.message || 'Failed to process scan'}
                </Typography>
                {currentScan.error.code && (
                  <Typography variant="caption" color="neutral" style={styles.errorCode}>
                    Error Code: {currentScan.error.code}
                  </Typography>
                )}
              </View>
            </Shadow>
          </Animated.View>
        )}

        {isCompleted && currentScan.nutritionData && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <NutritionCard nutrition={currentScan.nutritionData} language={currentScan.language} />
          </Animated.View>
        )}

        {isCompleted && currentScan.allergens && currentScan.allergens.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <AllergenCard allergens={currentScan.allergens} language={currentScan.language} />
          </Animated.View>
        )}

        {isCompleted && currentScan.alternatives && currentScan.alternatives.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <AlternativeList
              alternatives={currentScan.alternatives}
              language={currentScan.language}
            />
          </Animated.View>
        )}

        {isCompleted && !currentScan.nutritionData && !currentScan.allergens?.length && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Shadow variant="medium">
              <View style={styles.emptyCard}>
                <Typography variant="body" color="neutral" style={styles.emptyText}>
                  No nutrition data available for this scan.
                </Typography>
              </View>
            </Shadow>
          </Animated.View>
        )}
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
    paddingBottom: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...DesignTokens.shadows.medium,
  },
  headerContent: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  statusIconContainer: {
    marginRight: 4,
  },
  statusIcon: {
    fontSize: 18,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  foodName: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  date: {
    fontSize: 14,
    opacity: 0.9,
  },
  content: {
    padding: 24,
    gap: 20,
  },
  processingCard: {
    backgroundColor: ColorPalette.secondary.main,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: 32,
    alignItems: 'center',
  },
  processingTitle: {
    marginTop: 20,
    marginBottom: 12,
    fontSize: 22,
    fontWeight: '700',
    color: ColorPalette.neutral[900],
  },
  processingMessage: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    color: ColorPalette.neutral[600],
  },
  errorCard: {
    backgroundColor: ColorPalette.secondary.main,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: ColorPalette.error.main,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  errorCode: {
    fontSize: 13,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: ColorPalette.secondary.main,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: ColorPalette.neutral[600],
  },
  skeletonContainer: {
    marginTop: 16,
    gap: 12,
  },
  skeletonItem: {
    marginBottom: 12,
  },
});

