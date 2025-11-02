/**
 * Jest Setup File
 * Configures test environment with necessary mocks and setup
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-camera', () => ({
  CameraView: jest.fn(),
  useCameraPermissions: jest.fn(() => [{ granted: true }, () => Promise.resolve({ granted: true })]),
  useMicrophonePermissions: jest.fn(() => [{ granted: true }, () => Promise.resolve({ granted: true })]),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ cancelled: false, assets: [] })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ cancelled: false, assets: [] })),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All',
  },
}));

// Mock React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      OS: 'ios',
      select: jest.fn((dict) => dict.ios || dict.default),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
  };
});

// Note: React Native component tests require a special environment
// For now, we skip them in Node environment or use jest-expo preset

// Mock Firebase (global)
global.firebase = {
  app: jest.fn(),
  auth: jest.fn(),
  firestore: jest.fn(),
};

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Silence console warnings in tests unless needed
if (process.env.SHOW_CONSOLE !== 'true') {
  global.console.warn = jest.fn();
  global.console.log = jest.fn();
}

