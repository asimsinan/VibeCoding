/**
 * Firebase Configuration and Initialization
 * Centralized Firebase setup for the app
 */

import { initializeApp, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Note: getReactNativePersistence is not available in Firebase v10.14.1 at runtime
// Despite Firebase's error messages suggesting it exists, it's actually undefined
// We'll initialize Auth without persistence (it will show warnings but will work)
const getReactNativePersistence: any = null; // Explicitly null since it doesn't exist

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let isInitialized = false;

/**
 * Get Firebase configuration from environment variables
 */
function getFirebaseConfig(): FirebaseOptions {
  const config: FirebaseOptions = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Validate required config values
  if (!config.apiKey || !config.projectId) {
    throw new Error(
      'Firebase configuration is missing. Please check your .env file and ensure all EXPO_PUBLIC_FIREBASE_* variables are set.'
    );
  }

  return config;
}

/**
 * Initialize Firebase app
 * Call this once at app startup
 */
export async function initializeFirebase(): Promise<FirebaseApp> {
  if (isInitialized && app) {
    return app;
  }

  try {
    const config = getFirebaseConfig();
    
    // Try to get existing app first (in case already initialized)
    try {
      app = getApp();
      isInitialized = true;
      return app;
    } catch (error) {
      // App doesn't exist, initialize it
      app = initializeApp(config);
      isInitialized = true;
      
      // Initialize Auth - For React Native, we MUST use initializeAuth to register the Auth component
      // The "Component auth has not been registered yet" error happens if we use getAuth before initializeAuth
      // Always initialize Auth immediately after creating the app to ensure it's registered
      // Note: getReactNativePersistence is not available, so we initialize without persistence
      // This will show warnings but auth will work (state just won't persist across app restarts)
      try {
        // Initialize Auth without persistence since getReactNativePersistence doesn't exist
        // This is the critical step that registers the Auth component
        auth = initializeAuth(app);
      } catch (error: any) {
        // If initializeAuth fails, this is a critical error
        // The Auth component must be registered for the app to work
        console.error('Failed to initialize Firebase Auth:', error);
        throw new Error(`Failed to initialize Firebase Auth: ${error.message || 'Unknown error'}`);
      }
      
      // Initialize other services
      db = getFirestore(app);
      storage = getStorage(app);
      
      return app;
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown Firebase initialization error';
    throw new Error(`Failed to initialize Firebase: ${errorMessage}`);
  }
}

/**
 * Get Firebase App instance
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error(
      'Firebase has not been initialized. Call initializeFirebase() first.'
    );
  }
  return app;
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    // Try to initialize if not done yet
    if (!isInitialized) {
      throw new Error(
        'Firebase has not been initialized. Call initializeFirebase() first.'
      );
    }
    const appInstance = getFirebaseApp();
    try {
      // Try to get existing auth instance first
      auth = getAuth(appInstance);
    } catch (error: any) {
      // Auth doesn't exist, must initialize it using initializeAuth (required for React Native)
      try {
        // Initialize without persistence since getReactNativePersistence doesn't exist
        auth = initializeAuth(appInstance);
      } catch (initError: any) {
        // If initializeAuth fails, try getAuth as last resort
        console.warn('initializeAuth failed, trying getAuth:', initError);
        try {
          auth = getAuth(appInstance);
        } catch (getAuthError: any) {
          throw new Error(`Failed to initialize or get Firebase Auth: ${getAuthError.message}`);
        }
      }
    }
  }
  return auth;
}

/**
 * Get Firestore instance
 */
export function getFirestoreInstance(): Firestore {
  if (!db) {
    // Try to initialize if not done yet
    if (!isInitialized) {
      throw new Error(
        'Firebase has not been initialized. Call initializeFirebase() first.'
      );
    }
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

/**
 * Get Firebase Storage instance
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    // Try to initialize if not done yet
    if (!isInitialized) {
      throw new Error(
        'Firebase has not been initialized. Call initializeFirebase() first.'
      );
    }
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized(): boolean {
  return isInitialized;
}

