/**
 * Scanner Screen
 * Camera interface for scanning food labels with modern design
 */

import { View, StyleSheet } from 'react-native';
import { CameraScanner } from '@/components/camera/CameraScanner';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScannerScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CameraScanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

