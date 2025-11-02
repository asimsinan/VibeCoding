# Firebase Setup Guide

## Architecture Decision: ✅ Firebase Backend

**Confirmed:** We are using **Firebase as our backend** with client-side services architecture. This is the correct pattern for React Native mobile apps.

## Current Firebase Integration

✅ **Firebase SDK Installed**: `firebase@10.14.1`  
✅ **Services Configured**: All Phase 2 services are built for Firebase  
✅ **Client-Side Pattern**: Services run in React Native app and connect directly to Firebase

## Firebase Configuration Required

### 1. Environment Variables

Create a `.env` file in the project root with the following Firebase configuration:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Vercel AI Gateway (for AI processing)
EXPO_PUBLIC_AI_GATEWAY_URL=https://api.vercel.ai/v1
EXPO_PUBLIC_AI_GATEWAY_KEY=your-ai-gateway-key
```

### 2. Firebase Project Setup Steps

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `food-lens` (or your preferred name)
4. Follow setup wizard

#### Step 2: Enable Firebase Services

**Authentication:**
1. Go to **Authentication** → **Get Started**
2. Enable **Email/Password** sign-in method
3. Optionally enable **Google** sign-in for social auth

**Firestore Database:**
1. Go to **Firestore Database** → **Create database**
2. Start in **production mode** (we'll add security rules)
3. Choose location closest to your users
4. Enable

**Cloud Storage:**
1. Go to **Storage** → **Get Started**
2. Start in **production mode**
3. Choose same location as Firestore
4. Enable

#### Step 3: Get Configuration Values

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Web** icon (`</>`) to add web app
4. Register app with nickname: `food-lens-web`
5. Copy the Firebase configuration object
6. Use these values in your `.env` file

#### Step 4: Install Firebase CLI (Optional - for rules deployment)

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase init storage
```

### 3. Firebase Security Rules

Create `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Scans collection - users can only access their own scans
    match /scans/{scanId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

Create `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Images folder - users can upload/read their own images
    match /images/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 4. Firestore Data Structure

The app expects the following collections:

**`users` Collection:**
```typescript
{
  uid: string;              // Document ID = Firebase Auth UID
  email: string;
  displayName: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  preferences: {
    language: 'en' | 'tr';
    notifications: boolean;
    offlineMode: boolean;
    dietaryRestrictions: string[];
    isAdmin?: boolean;
    isPremium?: boolean;
  }
}
```

**`scans` Collection:**
```typescript
{
  scanId: string;           // Document ID
  userId: string;
  imageUrl: string;
  imageMetadata: {
    size: number;
    format: string;
    width: number;
    height: number;
    uploadedAt: Timestamp;
  };
  language: 'en' | 'tr';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Timestamp;
  processedAt?: Timestamp;
  nutritionData?: NutritionInfo;  // Serialized NutritionInfo
  allergens?: AllergenInfo[];     // Array of AllergenInfo
  alternatives?: AlternativeSuggestion[]; // Array of suggestions
}
```

## Verification Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Cloud Storage enabled
- [ ] Configuration values added to `.env` file
- [ ] Security rules deployed
- [ ] Firebase CLI installed (optional)

## Testing Firebase Connection

Once configured, test the connection:

```typescript
import { firestoreService } from '@/services/database/FirestoreService';

// In your app initialization
await firestoreService.initialize();
console.log('Firebase connected successfully!');
```

## Next Steps

1. **Complete Firebase Setup** - Follow steps above
2. **Add Environment Variables** - Create `.env` file with Firebase config
3. **Deploy Security Rules** - Protect your data
4. **Proceed with Phase 3** - UI development using Firebase services

## Architecture Benefits (Firebase)

✅ **No Backend Server Required** - Firebase handles all backend operations  
✅ **Real-time Sync** - Automatic data synchronization  
✅ **Offline Support** - Built-in offline persistence  
✅ **Scalable** - Handles traffic automatically  
✅ **Secure** - Security rules protect data  
✅ **Fast Development** - No server code to write/maintain  

---

**Status:** ✅ Ready for Firebase setup. Once configured, proceed with Phase 3 UI development.

