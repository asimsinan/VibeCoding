/**
 * History Screen
 * View scan history and previous results
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Animated, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '@/components/common/Typography';
import { Card } from '@/components/common/Card';
import { useScan } from '@/hooks/useScan';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Skeleton } from '@/components/common/Skeleton';
import { useRouter } from 'expo-router';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';
import { useToast } from '@/contexts/ToastContext';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { scans, loading, getScanHistory, deleteScan } = useScan();
  const router = useRouter();
  const { showToast } = useToast();
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});
  const [deletingAll, setDeletingAll] = useState(false);
  const [openSwipeableId, setOpenSwipeableId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Call API service to load scan history
      getScanHistory(user.uid, 1, 20);
    }
  }, [user, getScanHistory]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="camera-alt" size={50} color={ColorPalette.primary.main} />
        </View>
        <Typography variant="heading" style={styles.emptyTitle}>
          No Scans Yet
        </Typography>
        <Typography variant="body" color="neutral" style={styles.emptyDescription}>
          Start scanning food labels to see your nutrition history here
        </Typography>
      </View>
    </View>
  );

  if (loading && scans.length === 0) {
    return (
      <View style={styles.container}>
        <Card>
          <LoadingSpinner size="large" message="Loading scan history..." />
          <View style={styles.skeletonContainer}>
            <Skeleton width="100%" height={80} style={styles.skeletonItem} />
            <Skeleton width="100%" height={80} style={styles.skeletonItem} />
            <Skeleton width="100%" height={80} style={styles.skeletonItem} />
          </View>
        </Card>
      </View>
    );
  }

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'Unknown';
    
    // Handle string dates (from AsyncStorage or Firestore)
    if (typeof date === 'string') {
      try {
        const parsedDate = new Date(date);
        return isNaN(parsedDate.getTime()) ? 'Unknown' : parsedDate.toLocaleDateString();
      } catch {
        return 'Unknown';
      }
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
    }
    
    return 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return ColorPalette.success.main;
      case 'processing':
      case 'pending':
        return ColorPalette.warning.main;
      case 'failed':
        return ColorPalette.error.main;
      default:
        return ColorPalette.neutral[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return { name: 'check-circle' as const, color: ColorPalette.success.main };
      case 'processing':
        return { name: 'hourglass-empty' as const, color: ColorPalette.warning.main };
      case 'pending':
        return { name: 'sync' as const, color: ColorPalette.warning.main };
      case 'failed':
        return { name: 'error' as const, color: ColorPalette.error.main };
      default:
        return { name: 'description' as const, color: ColorPalette.neutral[500] };
    }
  };

  const handleDelete = (scanId: string, foodName: string) => {
    Alert.alert(
      'Delete Scan',
      `Are you sure you want to delete "${foodName || 'this scan'}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Close swipeable on cancel
            swipeableRefs.current[scanId]?.close();
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteScan(scanId);
              showToast('Scan deleted successfully', 'success');
              swipeableRefs.current[scanId]?.close();
            } catch (error: any) {
              showToast(error.message || 'Failed to delete scan', 'error');
              swipeableRefs.current[scanId]?.close();
            }
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    if (scans.length === 0) {
      return;
    }

    Alert.alert(
      'Delete All Scans',
      `Are you sure you want to delete all ${scans.length} scan${scans.length > 1 ? 's' : ''}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setDeletingAll(true);
            try {
              // Close all open swipeables
              Object.values(swipeableRefs.current).forEach(ref => ref?.close());
              
              // Delete all scans sequentially
              const deletePromises = scans.map(scan => 
                deleteScan(scan.scanId || '').catch((error: any) => {
                  console.error(`Failed to delete scan ${scan.scanId}:`, error);
                  return error; // Continue with other deletions
                })
              );
              
              await Promise.all(deletePromises);
              showToast(`All ${scans.length} scan${scans.length > 1 ? 's' : ''} deleted successfully`, 'success');
            } catch (error: any) {
              showToast(error.message || 'Failed to delete all scans', 'error');
            } finally {
              setDeletingAll(false);
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (scanId: string, foodName: string, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(scanId, foodName)}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            styles.deleteActionContent,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
                        <LinearGradient
                          colors={[ColorPalette.error.main, ColorPalette.error.dark]}
                          style={styles.deleteGradient}
                        >
                          <View style={styles.deleteIconContainer}>
                            <MaterialIcons name="delete" size={32} color={ColorPalette.secondary.main} />
                          </View>
                          <Typography variant="caption" style={styles.deleteText}>
                            Delete
                          </Typography>
                        </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      {scans.length > 0 && (
        <View style={styles.headerContainer}>
          <View style={styles.statsHeader}>
            <View style={styles.statCard}>
              <Typography variant="heading" style={styles.statNumber}>
                {scans.length}
              </Typography>
              <Typography variant="caption" color="neutral" style={styles.statLabel}>
                Total Scans
              </Typography>
            </View>
            <View style={styles.statCard}>
              <Typography variant="heading" style={styles.statNumber}>
                {scans.filter(s => s.status === 'completed').length}
              </Typography>
              <Typography variant="caption" color="neutral" style={styles.statLabel}>
                Completed
              </Typography>
            </View>
          </View>
          
          {/* Remove All Button */}
          <TouchableOpacity
            style={styles.deleteAllButton}
            onPress={handleDeleteAll}
            disabled={deletingAll || loading}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[ColorPalette.error.main, ColorPalette.error.dark]}
              style={styles.deleteAllGradient}
            >
              {deletingAll ? (
                <LoadingSpinner size="small" color={ColorPalette.secondary.main} />
              ) : (
                <>
                  <MaterialIcons name="delete-sweep" size={20} color={ColorPalette.secondary.main} />
                  <Typography variant="caption" style={styles.deleteAllText}>
                    Remove All
                  </Typography>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={scans}
        renderItem={({ item }) => (
          <Swipeable
            ref={(ref) => {
              if (item.scanId) {
                swipeableRefs.current[item.scanId] = ref;
              }
            }}
            renderRightActions={(progress, dragX) =>
              renderRightActions(
                item.scanId || '',
                item.nutritionData?.foodName || 'Food Scan',
                dragX
              )
            }
            rightThreshold={40}
            overshootRight={false}
            onSwipeableOpen={() => {
              if (item.scanId) {
                setOpenSwipeableId(item.scanId);
              }
            }}
            onSwipeableClose={() => {
              setOpenSwipeableId(null);
            }}
          >
            <TouchableOpacity
              onPress={() => {
                // Don't navigate if swipeable is open
                if (openSwipeableId === item.scanId) {
                  return;
                }
                // Close any open swipeables before navigating
                if (openSwipeableId) {
                  swipeableRefs.current[openSwipeableId]?.close();
                }
                router.push(`/(tabs)/results/${item.scanId}`);
              }}
              activeOpacity={0.7}
              style={styles.scanCard}
              delayPressIn={200}
            >
              <View style={styles.cardOuterShadow}>
                <View style={styles.cardWrapper}>
                  {/* Top accent bar */}
                  <View style={styles.cardTopAccent}>
                    <LinearGradient
                      colors={[ColorPalette.primary.main, ColorPalette.primary[300]]}
                      style={styles.topAccentGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  {/* Subtle highlight border */}
                  <View style={styles.cardHighlightBorder} />
                  <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.foodInfo}>
                    <Typography variant="subheading" style={styles.foodName}>
                      {item.nutritionData?.foodName || 'Food Scan'}
                    </Typography>
                    <Typography variant="caption" color="neutral" style={styles.date}>
                      {formatDate(item.createdAt)}
                    </Typography>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                    <LinearGradient
                      colors={[
                        `${getStatusColor(item.status)}30`,
                        `${getStatusColor(item.status)}10`,
                      ]}
                      style={styles.statusBadgeGradient}
                    >
                      <View style={styles.statusBadgeContent}>
                        <MaterialIcons 
                          name={getStatusIcon(item.status).name} 
                          size={14} 
                          color={getStatusIcon(item.status).color}
                          style={styles.statusIcon}
                        />
                        <Typography 
                          variant="caption" 
                          style={{ ...styles.statusText, color: getStatusColor(item.status) } as any}
                        >
                          {item.status.toUpperCase()}
                        </Typography>
                      </View>
                    </LinearGradient>
                  </View>
                </View>
                
                {(item.nutritionData?.calories != null && item.nutritionData.calories >= 0) && (
                  <View style={styles.nutritionPreview}>
                    <View style={styles.caloriesBadge}>
                      <Typography 
                        variant="heading" 
                        style={{ ...styles.calories, color: ColorPalette.primary.main } as any}
                      >
                        {item.nutritionData.calories}
                      </Typography>
                      <Typography variant="caption" color="neutral">
                        kcal
                      </Typography>
                    </View>
                    <View style={styles.macroInfo}>
                      {item.nutritionData.nutrients?.protein != null && (
                        <View style={styles.macroItem}>
                          <Typography variant="caption" color="neutral">Protein</Typography>
                          <Typography variant="body" style={styles.macroValue}>
                            {String(item.nutritionData.nutrients.protein)}g
                          </Typography>
                        </View>
                      )}
                      {item.nutritionData.nutrients?.carbs != null && (
                        <View style={styles.macroItem}>
                          <Typography variant="caption" color="neutral">Carbs</Typography>
                          <Typography variant="body" style={styles.macroValue}>
                            {String(item.nutritionData.nutrients.carbs)}g
                          </Typography>
                        </View>
                      )}
                      {item.nutritionData.nutrients?.fat != null && (
                        <View style={styles.macroItem}>
                          <Typography variant="caption" color="neutral">Fat</Typography>
                          <Typography variant="body" style={styles.macroValue}>
                            {String(item.nutritionData.nutrients.fat)}g
                          </Typography>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {item.allergens && item.allergens.length > 0 && (
                  <View style={styles.allergenBadge}>
                    <MaterialIcons name="warning" size={16} color={ColorPalette.error.main} style={styles.allergenIcon} />
                    <Typography variant="caption" color="error" style={styles.allergenText}>
                      {item.allergens.length} allergen{item.allergens.length > 1 ? 's' : ''} detected
                    </Typography>
                  </View>
                )}
                </View>
                </View>
              </View>
          </TouchableOpacity>
          </Swipeable>
        )}
        keyExtractor={(item, index) => item.scanId || index.toString()}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
    paddingTop: 0,
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  statsHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: ColorPalette.secondary.main,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    ...DesignTokens.shadows.small,
    borderLeftWidth: 3,
    borderLeftColor: ColorPalette.primary.main,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: ColorPalette.primary.main,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    flexGrow: 1,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skeletonContainer: {
    marginTop: 16,
    gap: 12,
  },
  skeletonItem: {
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCard: {
    backgroundColor: ColorPalette.secondary.main,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: 40,
    alignItems: 'center',
    maxWidth: 320,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ColorPalette.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    marginBottom: 12,
    fontSize: 24,
    fontWeight: '700',
    color: ColorPalette.neutral[900],
  },
  emptyDescription: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    color: ColorPalette.neutral[600],
  },
  scanCard: {
    marginBottom: 20,
  },
  cardOuterShadow: {
    borderRadius: 24,
    // Soft edge-hugging shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    // Ensure shadow follows rounded corners
    overflow: 'hidden',
  },
  cardWrapper: {
    backgroundColor: ColorPalette.secondary.main,
    borderRadius: 24,
    overflow: 'hidden',
    // Subtle border for definition
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  cardHighlightBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: 2,
  },
  cardContent: {
    padding: 20,
    backgroundColor: ColorPalette.secondary.main,
  },
  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 1,
  },
  topAccentGradient: {
    flex: 1,
    borderRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 4,
  },
  foodInfo: {
    flex: 1,
    marginRight: 12,
  },
  foodName: {
    fontSize: 20,
    fontWeight: '700',
    color: ColorPalette.neutral[900],
    marginBottom: 6,
  },
  date: {
    fontSize: 13,
    color: ColorPalette.neutral[500],
  },
  statusBadge: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ColorPalette.neutral[200],
    overflow: 'hidden',
  },
  statusBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIcon: {
    marginRight: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nutritionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: ColorPalette.neutral[200],
    marginTop: 4,
  },
  caloriesBadge: {
    alignItems: 'center',
    padding: 14,
    backgroundColor: ColorPalette.primary[50],
    borderRadius: 20,
    minWidth: 85,
    borderWidth: 1,
    borderColor: ColorPalette.primary[100],
    // Soft rounded shadow
    shadowColor: ColorPalette.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  calories: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  macroInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontWeight: '700',
    color: ColorPalette.neutral[900],
    marginTop: 4,
  },
  allergenBadge: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: ColorPalette.neutral[50],
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ColorPalette.error.main,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    // Soft rounded shadow
    shadowColor: ColorPalette.error.main,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  allergenIcon: {
    marginRight: 2,
  },
  allergenText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  deleteAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 16,
    marginRight: 16,
  },
  deleteActionContent: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
  },
  deleteGradient: {
    width: '100%',
    height: '100%',
    borderRadius: DesignTokens.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteIconContainer: {
    marginBottom: 8,
  },
  deleteIcon: {
    fontSize: 32,
  },
  deleteText: {
    color: ColorPalette.secondary.main,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteAllButton: {
    borderRadius: DesignTokens.borderRadius.lg,
    overflow: 'hidden',
    ...DesignTokens.shadows.medium,
  },
  deleteAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    minHeight: 48,
  },
  deleteAllText: {
    color: ColorPalette.secondary.main,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

