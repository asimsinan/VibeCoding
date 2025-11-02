# Food Lens User Guide

**Version**: 1.0.0  
**Last Updated**: 2025-01-27

## Table of Contents

1. [Getting Started](#getting-started)
2. [Features](#features)
3. [Using the App](#using-the-app)
4. [Tips & Best Practices](#tips--best-practices)
5. [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

Food Lens is available as a mobile app for iOS and Android.

#### iOS

1. Download from the App Store
2. Open the app
3. Grant camera and photo library permissions when prompted

#### Android

1. Download from Google Play Store
2. Open the app
3. Grant camera and storage permissions when prompted

### First-Time Setup

1. **Create Account**: Tap "Register" and enter your email, password, and display name
2. **Set Preferences**: Choose your preferred language (English or Turkish)
3. **Enable Camera**: Grant camera permissions to start scanning

### Quick Start

1. Open the app
2. Tap the camera icon to start scanning
3. Point your camera at a food label
4. Tap "Scan" to capture and process
5. View nutrition information and allergen warnings

## Features

### Core Features

#### 1. Food Label Scanning

- **Camera Scan**: Use your device camera to scan food labels in real-time
- **Photo Library**: Select existing photos from your gallery
- **Auto-Detection**: AI automatically detects nutrition facts and ingredients
- **Multi-Language**: Supports English and Turkish

#### 2. Nutrition Information

- **Complete Nutrition Facts**: Calories, macronutrients (protein, carbs, fat)
- **Detailed Micronutrients**: Vitamins and minerals when available
- **Serving Size**: Accurate serving size information
- **Brand Information**: Product brand and name detection

#### 3. Allergen Detection

- **Severity Levels**: High, medium, and low allergen warnings
- **Allergen List**: Comprehensive allergen identification
- **Safety Information**: Clear descriptions of allergen presence
- **User Preferences**: Filter by your dietary restrictions

#### 4. Healthier Alternatives

- **Smart Suggestions**: AI-powered healthier alternative recommendations
- **Comparison View**: Side-by-side nutrition comparison
- **Health Scores**: Health score for current and alternative products
- **Reasoning**: Explanations for why alternatives are healthier

#### 5. Scan History

- **Complete History**: View all your past scans
- **Quick Access**: Tap any scan to view full details
- **Delete Scans**: Remove scans from your history
- **Search & Filter**: Find specific scans quickly

### Advanced Features

#### Dietary Restrictions

Set your dietary restrictions in your profile:
- Common allergens (peanuts, dairy, gluten, etc.)
- Dietary preferences (vegetarian, vegan, etc.)
- Custom restrictions

The app will highlight matching allergens in your scans.

#### Language Support

- **English**: Full English language support
- **Turkish**: Complete Turkish language support
- **Auto-Detect**: Automatic language detection based on label language

## Using the App

### Scanning a Food Label

1. **Open Scanner**: Tap the camera icon on the home screen
2. **Position Label**: Point camera at the nutrition facts label
3. **Ensure Good Lighting**: Make sure the label is well-lit and clear
4. **Capture**: Tap the scan button or capture automatically
5. **Wait for Processing**: The app processes the image (typically 10-30 seconds)
6. **View Results**: Review nutrition information and allergens

### Viewing Scan Results

#### Nutrition Card

The nutrition card displays:
- Food name and brand
- Serving size
- Total calories
- Macronutrients breakdown
- Micronutrients (when available)

**Tap to expand** for detailed information.

#### Allergen Warnings

Allergen warnings appear with:
- Allergen name
- Severity level (color-coded)
- Description

**High severity** allergens are highlighted in red.

#### Alternatives

Scroll down to see healthier alternatives:
- Alternative product name
- Health score comparison
- Key nutrition differences
- Reason for recommendation

### Managing Scan History

#### View History

1. Tap "History" in the bottom navigation
2. See all your scans in chronological order
3. Tap any scan to view full details

#### Delete Scans

1. Open scan details
2. Tap "Delete" button
3. Confirm deletion

#### Filtering

Use filters to find specific scans:
- Date range
- Food name
- Allergen presence

## Tips & Best Practices

### Getting the Best Scan Results

1. **Good Lighting**: Ensure the label is well-lit
2. **Clear Focus**: Keep the label in focus
3. **Complete Label**: Capture the entire nutrition facts panel
4. **Steady Camera**: Keep your hand steady while scanning
5. **Multiple Angles**: If first scan fails, try different angles

### Understanding Nutrition Information

- **Serving Size**: Always check the serving size - values are per serving
- **Percent Daily Value**: Based on a 2000 calorie diet
- **Macronutrients**: Protein, carbohydrates, and fats
- **Micronutrients**: Vitamins and minerals (when detected)

### Using Allergen Information

- **High Severity**: Allergens you should avoid completely
- **Medium Severity**: Allergens to be cautious about
- **Low Severity**: Minor allergen presence

### Making Healthier Choices

- **Compare Alternatives**: Use the alternatives feature to find better options
- **Check Health Scores**: Higher scores indicate healthier options
- **Review Nutrients**: Pay attention to sugar, sodium, and fiber content

## Troubleshooting

### Common Issues

#### Scan Not Processing

**Problem**: Scan stays in "pending" status

**Solutions**:
1. Check your internet connection
2. Ensure the image is clear and readable
3. Try scanning again
4. Restart the app

#### Camera Not Working

**Problem**: Camera won't open or capture images

**Solutions**:
1. Check app permissions in device settings
2. Ensure no other app is using the camera
3. Restart your device
4. Reinstall the app

#### Incorrect Nutrition Information

**Problem**: Nutrition data doesn't match the label

**Solutions**:
1. Try scanning again with better lighting
2. Ensure the entire label is visible
3. Check if the label is in a supported language
4. Report the issue through the app

#### App Crashes

**Problem**: App crashes or freezes

**Solutions**:
1. Close and restart the app
2. Clear app cache (Android: Settings > Apps > Food Lens > Clear Cache)
3. Update to the latest version
4. Reinstall the app

### Getting Help

- **In-App Support**: Use the "Help & Support" section in your profile
- **Email Support**: Contact support@foodlens.app
- **Documentation**: Check this user guide and FAQ

### Privacy & Data

- **Your Data**: Your scan history is stored securely
- **Privacy**: Your data is encrypted and never shared
- **Deletion**: You can delete scans at any time
- **Account**: You can delete your account in profile settings

## Code Examples

### Using the API (For Developers)

#### Register User

```typescript
import { authService } from '@services/AuthService';

const response = await authService.register(
  'user@example.com',
  'SecurePassword123!',
  'John Doe'
);
console.log('User registered:', response.user);
```

#### Create Scan

```typescript
import { scanService } from '@services/ScanService';

const scan = await scanService.createScan(userId, {
  image: base64ImageData,
  language: 'en'
});
console.log('Scan created:', scan.scanId);
```

#### Get Scan Results

```typescript
const scan = await scanService.getScan(scanId);
if (scan.status === 'completed') {
  console.log('Nutrition:', scan.nutritionData);
  console.log('Allergens:', scan.allergens);
}
```

## Additional Resources

- **API Documentation**: `docs/API_DOCUMENTATION.md`
- **Technical Documentation**: `docs/`
- **FAQ**: Check the in-app FAQ section

