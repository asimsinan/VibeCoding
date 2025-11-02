# Food Lens Deployment Guide

**Version**: 1.0.0  
**Last Updated**: 2025-01-27

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Configuration](#build-configuration)
4. [Deployment Steps](#deployment-steps)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment](#post-deployment)

## Prerequisites

### Required Accounts

- **Expo Account**: For EAS Build service
- **Firebase Account**: For backend services
- **Vercel Account**: For AI Gateway (optional, if using Vercel)
- **Apple Developer Account**: For iOS deployment
- **Google Play Console Account**: For Android deployment

### Required Tools

- **Node.js**: v18+ recommended
- **npm** or **yarn**: Package manager
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli`
- **Git**: Version control

### System Requirements

- macOS (for iOS builds) or Linux/Windows (for Android builds)
- Minimum 8GB RAM
- Stable internet connection

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/food-lens.git
cd food-lens
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the environment template:

```bash
cp config/env.example.md .env
```

Edit `.env` with your production values:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# AI Gateway Configuration
EXPO_PUBLIC_AI_GATEWAY_URL=https://ai-gateway.vercel.sh/v1
EXPO_PUBLIC_AI_GATEWAY_KEY=your-ai-gateway-key

# App Configuration
EXPO_PUBLIC_APP_ENV=production
```

### 4. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Get Firebase configuration keys
5. Update environment variables

See `docs/FIREBASE_SETUP.md` for detailed instructions.

### 5. Expo Account Setup

```bash
# Login to Expo
npx expo login

# Configure EAS
eas build:configure
```

## Build Configuration

### EAS Build Configuration

The `eas.json` file contains build profiles:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "development": {
      "developmentClient": true
    }
  }
}
```

### App Configuration

The `app.json` file contains app metadata:

- Bundle identifiers
- Permissions
- Icons and splash screens
- Plugin configurations

## Deployment Steps

### Step 1: Verify Production Readiness

Run the production verification script:

```bash
npm run verify-production-build
```

Ensure all checks pass:
- ✅ TypeScript compilation
- ✅ All required files present
- ✅ Configuration valid

### Step 2: Run Tests

```bash
# Run all tests
npm test

# Check test coverage
npm run test:coverage
```

### Step 3: Build for iOS

```bash
# Build iOS production app
eas build --platform ios --profile production

# Or build for App Store submission
eas build --platform ios --profile production --type archive
```

**Build Options**:
- `--platform ios`: Build for iOS
- `--profile production`: Use production profile
- `--type archive`: Create archive for App Store

### Step 4: Build for Android

```bash
# Build Android production APK
eas build --platform android --profile production --type apk

# Or build AAB for Play Store
eas build --platform android --profile production --type app-bundle
```

**Build Options**:
- `--platform android`: Build for Android
- `--profile production`: Use production profile
- `--type apk`: Create APK file
- `--type app-bundle`: Create AAB for Play Store

### Step 5: Submit to App Stores

#### iOS (App Store)

```bash
# Submit to App Store
eas submit --platform ios

# Or manually download and submit through App Store Connect
```

**Requirements**:
- Apple Developer account
- App Store Connect app created
- App Store review information prepared

#### Android (Google Play)

```bash
# Submit to Google Play
eas submit --platform android

# Or manually upload through Google Play Console
```

**Requirements**:
- Google Play Console account
- Google Play app created
- Store listing information prepared

### Step 6: Monitor Build Status

Check build status:

```bash
# View build list
eas build:list

# View specific build
eas build:view <build-id>
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run type-check
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm install -g eas-cli
      - run: eas build --platform all --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Environment Secrets

Configure in GitHub Secrets:
- `EXPO_TOKEN`: Expo access token
- `FIREBASE_API_KEY`: Firebase API key
- `AI_GATEWAY_KEY`: AI Gateway API key

## Environment Variables

### Production Environment Variables

Required variables for production:

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase API key | `AIza...` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `project.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `food-lens-prod` |
| `EXPO_PUBLIC_AI_GATEWAY_URL` | AI Gateway URL | `https://ai-gateway.vercel.sh/v1` |
| `EXPO_PUBLIC_AI_GATEWAY_KEY` | AI Gateway API key | `sk-...` |
| `EXPO_PUBLIC_APP_ENV` | App environment | `production` |

### Setting Environment Variables

#### For EAS Build

```bash
# Set environment variables
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value your-key
eas secret:create --scope project --name EXPO_PUBLIC_AI_GATEWAY_KEY --value your-key
```

#### For Local Development

Use `.env` file (not committed to git).

## Post-Deployment

### 1. Verify Deployment

- Test authentication flows
- Test scan creation and processing
- Verify database connectivity
- Check error logging

### 2. Monitor Performance

- Monitor app crashes
- Track API response times
- Check error rates
- Review user feedback

### 3. Update Documentation

- Update API documentation if changes made
- Update user guides
- Document any deployment-specific configurations

### 4. Backup & Recovery

- Ensure Firebase backups are enabled
- Document recovery procedures
- Test restore procedures

## Troubleshooting

### Build Failures

**Problem**: Build fails with errors

**Solutions**:
1. Check environment variables are set correctly
2. Verify all dependencies are installed
3. Check EAS build logs for specific errors
4. Ensure Expo SDK version is compatible

### Deployment Issues

**Problem**: App doesn't work after deployment

**Solutions**:
1. Verify environment variables in production
2. Check Firebase configuration
3. Verify API endpoints are accessible
4. Check app logs for errors

### Common Issues

- **Missing Environment Variables**: Ensure all required variables are set
- **Firebase Configuration**: Verify Firebase project settings
- **Permissions**: Check app permissions are configured correctly
- **API Keys**: Verify API keys are valid and have correct permissions

## Additional Resources

- **EAS Build Documentation**: https://docs.expo.dev/build/introduction/
- **Firebase Setup**: `docs/FIREBASE_SETUP.md`
- **API Documentation**: `docs/API_DOCUMENTATION.md`
- **Production Verification**: `scripts/verify-production-build.ts`

