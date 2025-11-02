# Firestore Collections Guide

## Required Collections

Your app uses **2 collections** in Firestore. You **DO NOT need to create them manually** - they will be created automatically when your app first writes data.

However, here's what collections your app expects:

### 1. `users` Collection

**Collection ID:** `users`

**Purpose:** Stores user profile data and preferences

**Document Structure:**
- **Document ID:** Firebase Auth UID (user's unique ID)
- **Fields:**
  - `uid` (string)
  - `email` (string)
  - `displayName` (string)
  - `language` (string) - 'en' or 'tr'
  - `dietaryRestrictions` (array of strings)
  - `createdAt` (Timestamp)
  - `lastLoginAt` (Timestamp)
  - `preferences` (object)
    - `language` (string)
    - `notifications` (boolean)
    - `offlineMode` (boolean)
    - `dietaryRestrictions` (array)
    - `isAdmin` (boolean, optional)
    - `isPremium` (boolean, optional)
  - `stats` (object)
    - `totalScans` (number)
    - `lastScanAt` (Timestamp or null)

**Created by:** `AuthService.register()` when user signs up

### 2. `scans` Collection

**Collection ID:** `scans`

**Purpose:** Stores food label scan data, nutrition info, and allergens

**Document Structure:**
- **Document ID:** scanId (unique scan identifier)
- **Fields:**
  - `scanId` (string)
  - `userId` (string) - references user's UID
  - `status` (string) - 'pending' | 'processing' | 'completed' | 'failed'
  - `imageUrl` (string)
  - `imageMetadata` (object)
    - `size` (number)
    - `format` (string)
    - `width` (number)
    - `height` (number)
    - `uploadedAt` (Timestamp)
  - `language` (string) - 'en' or 'tr'
  - `createdAt` (Timestamp)
  - `processedAt` (Timestamp or null)
  - `nutritionData` (object or null) - NutritionInfo JSON
  - `allergens` (array) - Array of AllergenInfo JSON
  - `alternatives` (array or null) - Array of AlternativeSuggestion JSON
  - `error` (object or null)
    - `code` (string)
    - `message` (string)
    - `timestamp` (Timestamp)

**Created by:** `ScanService.createScan()` when user scans a food label

## Do You Need to Create Them Manually?

**No!** Collections are created automatically when your app first writes data:

1. **`users` collection** - Created when first user registers
2. **`scans` collection** - Created when first scan is performed

## Security Rules

After collections are created, you should add security rules. See `docs/FIREBASE_SETUP.md` for Firestore security rules.

## Firebase Console Setup

When setting up Firestore in Firebase Console:

1. **Database Name:** `(default)` ✅
2. **Collections:** Will be created automatically ✅
3. **Security Rules:** Add after collections are created (see setup guide)

## Summary

**You don't need to create collections manually.** Just:
1. Create the Firestore database with name `(default)`
2. Enable the database
3. Collections will be created automatically when your app runs

---

**Collections used by your app:**
- ✅ `users` - User profiles
- ✅ `scans` - Food scans

No other collections needed!

