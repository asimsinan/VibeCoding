# Food Lens Mobile App Deployment Guide

This guide will walk you through deploying your Food Lens mobile app to production.

## 📱 Deployment Options

You have several options for deploying your app:

1. **App Stores** (iOS App Store & Google Play) - Public distribution
2. **Internal Testing** (TestFlight, Internal Testing) - Beta testing
3. **Preview Builds** (APK/IPA files) - Direct installation

## 🚀 Quick Start (Recommended: EAS Build)

### Prerequisites

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   npx expo login
   ```

3. **Link your project to EAS:**
   ```bash
   eas build:configure
   ```

This will create/update your `eas.json` and `app.json` files.

## 📋 Step-by-Step Deployment

### Step 1: Configure App Details

Update `app.json` with your app information:

```json
{
  "expo": {
    "name": "Food Lens",
    "slug": "food-lens",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.foodlens", // Change this!
    },
    "android": {
      "package": "com.yourcompany.foodlens", // Change this!
    }
  }
}
```

### Step 2: Set Environment Variables

Create environment variables in EAS (for production builds):

```bash
# Firebase API Key
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-api-key"

# Firebase Auth Domain
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-project.firebaseapp.com"

# Firebase Project ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"

# Firebase Storage Bucket
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-project.appspot.com"

# Firebase Messaging Sender ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "123456789"

# Firebase App ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:123456789:web:abcdef"

# AI Gateway URL (optional, if using custom gateway)
eas secret:create --scope project --name EXPO_PUBLIC_AI_GATEWAY_URL --value "https://ai-gateway.vercel.sh/v1"
```

Or set them locally in `.env` file (for preview builds):
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Step 3: Build for Android

#### Option A: Build APK (for direct installation)

```bash
eas build --platform android --profile production --type apk
```

#### Option B: Build AAB (for Google Play Store)

```bash
eas build --platform android --profile production --type app-bundle
```

#### Option C: Preview Build (for testing)

```bash
eas build --platform android --profile preview
```

### Step 4: Build for iOS

#### Option A: Build for App Store

```bash
eas build --platform ios --profile production
```

#### Option B: Build for TestFlight (Beta Testing)

```bash
eas build --platform ios --profile production
# Then submit to TestFlight
eas submit --platform ios
```

#### Option C: Preview Build (for Simulator)

```bash
eas build --platform ios --profile preview
```

### Step 5: Submit to App Stores

#### iOS App Store

1. **Create App Store Connect listing:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create a new app
   - Fill in app details (name, description, screenshots, etc.)

2. **Submit via EAS:**
   ```bash
   eas submit --platform ios
   ```

   EAS will guide you through:
   - Apple ID credentials
   - App Store Connect API key (recommended)
   - Or App-Specific Password

3. **Or submit manually:**
   - Download the build from EAS dashboard
   - Upload via Xcode or Transporter app

#### Google Play Store

1. **Create Play Console listing:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create a new app
   - Fill in store listing (name, description, screenshots, etc.)

2. **Submit via EAS:**
   ```bash
   eas submit --platform android
   ```

   EAS will guide you through:
   - Google Play service account JSON key
   - Or manual upload option

3. **Or submit manually:**
   - Download the AAB file from EAS dashboard
   - Upload to Google Play Console → Production → Create Release

## 🎯 Internal Testing Options

### iOS: TestFlight

1. Build with production profile:
   ```bash
   eas build --platform ios --profile production
   ```

2. Submit to TestFlight:
   ```bash
   eas submit --platform ios
   ```

3. Invite testers via App Store Connect → TestFlight

### Android: Internal Testing

1. Build AAB:
   ```bash
   eas build --platform android --profile production --type app-bundle
   ```

2. Upload to Google Play Console → Internal Testing track

3. Add testers via email or Google Groups

## 📦 Building Locally (Alternative)

If you prefer to build locally:

### Android (Requires Android Studio)

```bash
# Install dependencies
npm install

# Generate Android project
npx expo prebuild --platform android

# Build APK
cd android && ./gradlew assembleRelease
```

### iOS (Requires macOS & Xcode)

```bash
# Install dependencies
npm install

# Generate iOS project
npx expo prebuild --platform ios

# Open in Xcode
cd ios && open FoodLens.xcworkspace

# Archive and upload via Xcode
```

## 🔧 Troubleshooting

### Common Issues

**1. Build fails with "Missing projectId"**
```bash
eas build:configure
```

**2. Environment variables not loading**
- Check variable names start with `EXPO_PUBLIC_`
- Verify secrets are set: `eas secret:list`
- For local builds, ensure `.env` file exists

**3. iOS build requires credentials**
```bash
# Configure credentials
eas credentials

# Or let EAS manage automatically
eas build --platform ios --auto-submit
```

**4. Android signing key issues**
```bash
# Generate new keystore
eas credentials

# Or let EAS manage automatically
```

## 📊 Build Status & Downloads

Check your builds:

```bash
# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Download build
eas build:download [BUILD_ID]
```

## 🔐 Security Checklist

Before deploying:

- [ ] Environment variables set securely
- [ ] API keys rotated and secure
- [ ] Firebase security rules configured
- [ ] No hardcoded secrets in code
- [ ] App permissions properly configured
- [ ] Privacy policy added (if required)
- [ ] Terms of service added (if required)

## 📱 Post-Deployment

1. **Monitor crashes:**
   - Set up Firebase Crashlytics or Sentry
   - Monitor App Store Connect / Play Console crash reports

2. **Update users:**
   - Use EAS Update for OTA updates (non-native changes)
   - Submit new builds for native changes

3. **Gather feedback:**
   - App Store reviews
   - TestFlight feedback
   - Analytics (Firebase Analytics, etc.)

## 🔄 Updating Your App

### For Native Changes (New builds required)

```bash
# Update version in app.json
"version": "1.0.1"

# Build and submit
eas build --platform all --profile production
eas submit --platform all
```

### For JavaScript Changes (OTA Updates)

```bash
# Install EAS Update
npm install --save expo-updates

# Configure app.json
"updates": {
  "enabled": true,
  "fallbackToCacheTimeout": 0
}

# Publish update
eas update --branch production --message "Bug fixes and improvements"
```

## 📚 Additional Resources

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS Submit Docs**: https://docs.expo.dev/submit/introduction/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
- **Firebase Console**: https://console.firebase.google.com

## 🎉 Next Steps

1. ✅ Install EAS CLI and login
2. ✅ Configure app.json with your bundle IDs
3. ✅ Set environment variables
4. ✅ Build your first preview build
5. ✅ Test thoroughly
6. ✅ Submit to app stores

Need help? Check the [Expo documentation](https://docs.expo.dev) or reach out to Expo support.

