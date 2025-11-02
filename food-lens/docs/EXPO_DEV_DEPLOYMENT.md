# Deploy to Expo.dev - Step by Step Guide

This guide shows you how to deploy your Food Lens app to expo.dev so it's accessible via Expo Go or as a web app.

## 🚀 Quick Start

### Option 1: Publish Updates (Expo Go Compatible)

Perfect for sharing your app via Expo Go or development builds:

```bash
# 1. Login to Expo
npx expo login

# 2. Publish your app
npx expo publish
```

After publishing, your app will be available at:
- **Web**: `https://expo.dev/@your-username/food-lens`
- **Expo Go**: Scan QR code from `expo start` or Expo dashboard

### Option 2: EAS Update (Recommended for Production)

Modern way to push updates OTA (Over-The-Air):

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configure project
eas update:configure

# 4. Publish update
eas update --branch main --message "Initial deployment"
```

### Option 3: Web Deployment

Deploy as a web app hosted on expo.dev:

```bash
# Build web version
npx expo export:web

# The build will be available at:
# https://expo.dev/@your-username/food-lens
```

## 📋 Detailed Steps

### Step 1: Login to Expo

```bash
npx expo login
```

Enter your Expo credentials. Don't have an account? Create one at [expo.dev](https://expo.dev).

### Step 2: Configure Your Project

Make sure your `app.json` has the correct slug:

```json
{
  "expo": {
    "slug": "food-lens",
    "name": "Food Lens",
    ...
  }
}
```

### Step 3: Choose Deployment Method

#### Method A: Classic Publishing (Expo Classic)

```bash
# Publish to expo.dev
npx expo publish

# Or with specific channel
npx expo publish --release-channel production
```

**Note**: Classic publishing is being phased out. Use EAS Update instead.

#### Method B: EAS Update (Recommended)

1. **Install and configure:**
   ```bash
   npm install -g eas-cli
   eas login
   eas update:configure
   ```

2. **Publish update:**
   ```bash
   # Publish to default branch (production)
   eas update --branch production --message "Production release"

   # Or publish to preview branch
   eas update --branch preview --message "Preview release"
   ```

3. **View your published app:**
   - Go to [expo.dev](https://expo.dev)
   - Navigate to your project
   - Find the published update

#### Method C: Web Deployment

1. **Build for web:**
   ```bash
   npx expo export:web
   ```

2. **Host the build:**
   The build outputs to `web-build/` directory. You can:
   - Deploy to Vercel/Netlify
   - Or use Expo's hosting (automatic with `expo publish`)

## 🌐 Accessing Your Deployed App

### Via Expo Go App

1. Download **Expo Go** from App Store/Play Store
2. Scan the QR code from:
   - Terminal after running `expo start`
   - Expo dashboard at [expo.dev](https://expo.dev)
   - Or share URL: `exp://expo.dev/@your-username/food-lens`

### Via Web Browser

After publishing, your app is available at:
```
https://expo.dev/@your-username/food-lens
```

### Via Development Build

If you've created a development build:
1. Install your development build on device
2. Run: `eas update --branch development`
3. Open the app - it will fetch the latest update

## 🔧 Configuration

### Update app.json

Add publishing configuration:

```json
{
  "expo": {
    "slug": "food-lens",
    "name": "Food Lens",
    "owner": "your-username", // Optional: if under different account
    "updates": {
      "enabled": true,
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/your-project-id"
    },
    "runtimeVersion": {
      "policy": "appVersion" // or "sdkVersion"
    }
  }
}
```

### Set Runtime Version

For EAS Update, you need to set a runtime version:

**Option 1: Use app version**
```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "version": "1.0.0"
  }
}
```

**Option 2: Use SDK version**
```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

**Option 3: Custom version**
```json
{
  "expo": {
    "runtimeVersion": "1.0.0"
  }
}
```

## 📱 Environment Variables

For production builds, set environment variables:

```bash
# Using EAS secrets
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"
# ... add all your environment variables
```

Or in `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_FIREBASE_API_KEY": "your-key",
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

## 🔄 Updating Your Published App

### Using EAS Update (Recommended)

```bash
# Make your code changes
# ...

# Publish update
eas update --branch production --message "Bug fixes and improvements"

# Users will get the update automatically on next app open
```

### Using Classic Publish

```bash
# Increment version in app.json first
"version": "1.0.1"

# Then publish
npx expo publish
```

## 🌍 Sharing Your App

### Share via QR Code

1. Run: `npx expo start`
2. Share the QR code with others
3. They scan with Expo Go app

### Share via URL

```
exp://expo.dev/@your-username/food-lens
```

### Share via Link

```
https://expo.dev/@your-username/food-lens
```

## 📊 Monitoring

Check your published updates:

```bash
# List all updates
eas update:list

# View specific update
eas update:view [UPDATE_ID]

# Check update status
eas update:status
```

Or visit your dashboard:
- [expo.dev/accounts/your-username/projects/food-lens](https://expo.dev)

## 🎯 Best Practices

1. **Use EAS Update** instead of classic publishing
2. **Set runtime version** before first publish
3. **Use branches** for different environments:
   - `production` - for stable releases
   - `preview` - for testing
   - `development` - for dev builds

4. **Increment version** when making breaking changes
5. **Test updates** before publishing to production

## 🚨 Troubleshooting

### "Project not found"
- Make sure you're logged in: `npx expo whoami`
- Check your slug in `app.json` matches Expo dashboard

### "Runtime version mismatch"
- Ensure `runtimeVersion` is set in `app.json`
- Use same runtime version for compatible builds

### "Update not showing"
- Check if app is using correct branch
- Verify update was published to correct branch
- Check network connection

### "Cannot access expo.dev"
- Ensure you're logged in
- Check internet connection
- Verify project exists in Expo dashboard

## 📝 Commands Cheat Sheet

```bash
# Login
npx expo login
eas login

# Publish (classic)
npx expo publish

# Publish (EAS Update)
eas update --branch production

# Build web
npx expo export:web

# View projects
npx expo projects

# Check login status
npx expo whoami

# List updates
eas update:list
```

## 🔗 Useful Links

- **Expo Dashboard**: https://expo.dev
- **EAS Update Docs**: https://docs.expo.dev/eas-update/introduction/
- **Expo Publishing Guide**: https://docs.expo.dev/distribution/publishing-websites/
- **Runtime Versions**: https://docs.expo.dev/eas-update/runtime-versions/

## ✅ Quick Checklist

Before deploying:

- [ ] Logged into Expo account
- [ ] `app.json` configured correctly
- [ ] `runtimeVersion` set (for EAS Update)
- [ ] Environment variables configured
- [ ] Tested locally with `expo start`
- [ ] Version number updated (if needed)
- [ ] Firebase/AI Gateway credentials ready

Ready to deploy? Start with:

```bash
npx expo login
eas update:configure
eas update --branch production --message "Initial deployment"
```

