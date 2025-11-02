/**
 * CameraScanner Component
 * Camera interface for scanning food labels
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Typography } from '@/components/common/Typography';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ColorPalette } from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';
import { useScan } from '@/hooks/useScan';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useToast } from '@/contexts/ToastContext';
import * as ImagePicker from 'expo-image-picker';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export interface CameraScannerProps {
  onScan?: (imageUri: string) => void;
  onScanComplete?: (scanId: string) => void;
  scanning?: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScan,
  onScanComplete,
  scanning = false,
}) => {
  const { user } = useAuth();
  const { createScan, loading: scanLoading } = useScan();
  const { showToast } = useToast();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isScanning, setIsScanning] = useState(false);

  const cameraRef = React.useRef<any>(null);

  const handleScan = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    if (!user) {
      // Redirect to login if not authenticated
      router.push('/auth/login');
      return;
    }

    if (!cameraRef.current) {
      showToast('Camera not ready. Please try again.', 'error');
      return;
    }

    setIsScanning(true);
    try {
      // Capture image directly from CameraView without leaving the app
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo && photo.uri) {
        const base64 = photo.base64 || '';

        // Call API service to create scan
        const scanId = await createScan(user.uid, {
          image: `data:image/jpeg;base64,${base64}`,
          language: 'en',
        });

        setIsScanning(false);
        
        // Call callbacks
        if (onScan) {
          onScan(photo.uri);
        }
        if (onScanComplete) {
          onScanComplete(scanId);
        }

        // Show success toast
        showToast('Scan created successfully!', 'success');
        
        // Navigate to results
        router.push(`/(tabs)/results/${scanId}`);
      } else {
        setIsScanning(false);
        showToast('Failed to capture image. Please try again.', 'error');
      }
    } catch (error: any) {
      setIsScanning(false);
      showToast(error.message || 'Scan failed. Please try again.', 'error');
      console.error('Scan failed:', error);
    }
  };

  const handleGalleryPick = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setIsScanning(true);
        const base64 = result.assets[0].base64 || '';

        const scanId = await createScan(user.uid, {
          image: `data:image/jpeg;base64,${base64}`,
          language: 'en',
        });

        setIsScanning(false);
        showToast('Scan created successfully!', 'success');
        router.push(`/(tabs)/results/${scanId}`);
      }
    } catch (error: any) {
      setIsScanning(false);
      showToast(error.message || 'Failed to load image.', 'error');
      console.error('Gallery pick failed:', error);
    }
  };

  if (!permission) {
    return (
      <Card>
        <Typography variant="body">Requesting camera permission...</Typography>
      </Card>
    );
  }

  if (!permission.granted) {
    return (
      <Card>
        <Typography variant="heading">Camera Permission Required</Typography>
        <Typography variant="body" style={styles.permissionText}>
          Food Lens needs camera access to scan food labels.
        </Typography>
        <Button title="Grant Permission" variant="primary" onPress={requestPermission} />
      </Card>
    );
  }

  return (
    <View style={styles.container} testID="camera-scanner">
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
      >
        <View style={styles.overlay}>
          {/* Top Section - Instructions */}
          <View style={styles.topSection}>
            <View style={styles.instructionCard}>
              <MaterialIcons name="camera-alt" size={18} color={ColorPalette.secondary.main} style={styles.instructionIcon} />
              <Typography variant="caption" color="secondary" style={styles.instructionText}>
                Point camera at food label
              </Typography>
            </View>
          </View>

          {/* Scanning Frame with Modern Design */}
          <View style={styles.scanFrameContainer}>
            <View style={styles.scanFrame}>
              {/* Animated Corner Indicators */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Scanning Guide */}
              <View style={styles.guideOverlay}>
                <View style={styles.guideDot} />
                <View style={styles.guideLine} />
              </View>
            </View>
            <Typography variant="caption" color="secondary" style={styles.scanHint}>
              Align the food label within the frame
            </Typography>
          </View>

          {/* Bottom Controls Section */}
          <View style={styles.controls}>
            {!isScanning && !scanning && !scanLoading ? (
              <View style={styles.controlsLayout}>
                {/* Secondary Controls - Left Side (Gallery) */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleGalleryPick}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionIconContainer}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.2)']}
                      style={styles.iconGradient}
                    >
                      <MaterialIcons name="photo-library" size={32} color={ColorPalette.secondary.main} />
                    </LinearGradient>
                  </View>
                  <Typography variant="caption" color="secondary" style={styles.actionLabel}>
                    Gallery
                  </Typography>
                </TouchableOpacity>
                
                {/* Main Capture Button - Center */}
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleScan}
                  activeOpacity={0.8}
                  testID="scan-button"
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
                
                {/* Secondary Controls - Right Side (Flip) */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionIconContainer}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.2)']}
                      style={styles.iconGradient}
                    >
                      <MaterialIcons name="flip-camera-ios" size={32} color={ColorPalette.secondary.main} />
                    </LinearGradient>
                  </View>
                  <Typography variant="caption" color="secondary" style={styles.actionLabel}>
                    Flip
                  </Typography>
                </TouchableOpacity>
              </View>
            ) : scanning || scanLoading ? (
              <View testID="camera-scanning" style={styles.scanningContainer}>
                <LoadingSpinner size="large" color={ColorPalette.secondary.main} />
                <Typography variant="body" color="secondary" style={styles.scanningText}>
                  Analyzing nutrition...
                </Typography>
                <Typography variant="caption" color="secondary" style={styles.scanningSubtext}>
                  This may take a moment
                </Typography>
              </View>
            ) : (
              <View testID="scan-loading">
                <Typography variant="body" color="secondary">
                  Processing...
                </Typography>
              </View>
            )}
          </View>
        </View>
      </CameraView>
      {!isScanning && !scanning && (
        <View testID="camera-ready" style={styles.hidden} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    paddingTop: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  instructionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scanFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 30,
  },
  scanFrame: {
    width: '85%',
    maxWidth: 360,
    aspectRatio: 4 / 3,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: ColorPalette.primary.main,
    backgroundColor: 'transparent',
    position: 'relative',
    borderStyle: 'dashed',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: ColorPalette.primary.main,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 24,
  },
  guideOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  guideDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ColorPalette.primary.main,
    opacity: 0.8,
  },
  guideLine: {
    position: 'absolute',
    top: 10,
    left: -50,
    width: 100,
    height: 2,
    backgroundColor: ColorPalette.primary.main,
    opacity: 0.5,
  },
  scanHint: {
    marginTop: 20,
    paddingHorizontal: 32,
    textAlign: 'center',
    opacity: 0.95,
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    paddingBottom: 60,
    paddingTop: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    zIndex: 10,
  },
  controlsLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    maxWidth: 400,
    gap: 20,
  },
  captureButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: ColorPalette.secondary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    ...DesignTokens.shadows.large,
    elevation: 10,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: ColorPalette.primary.main,
    borderWidth: 3,
    borderColor: ColorPalette.secondary.main,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
    maxWidth: 100,
  },
  actionIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...DesignTokens.shadows.medium,
    elevation: 6,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 36,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  instructionIcon: {
    marginRight: 4,
  },
  scanningContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 32,
    borderRadius: 24,
    minWidth: 280,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scanningText: {
    marginTop: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scanningSubtext: {
    marginTop: 12,
    opacity: 0.85,
    textAlign: 'center',
    fontSize: 13,
  },
  permissionText: {
    marginVertical: 16,
  },
  hidden: {
    position: 'absolute',
    top: -1000,
    opacity: 0,
  },
});


