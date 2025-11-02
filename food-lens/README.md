# Food Lens

AI-powered mobile app that scans food labels and provides instant nutrition information, allergen detection, and healthier alternative suggestions.

## 🚀 Live Demo

📱 **[View on Expo (Mobile)](https://expo.dev/preview/update?message=FoodLens+App&updateRuntimeVersion=1.0.0&createdAt=2025-11-02T13%3A43%3A49.076Z&slug=exp&projectId=4f804c34-f237-470b-9ee6-b8fce1e1dc3d&group=d0d7332c-6197-4701-a134-751ac44c4f84)**

🌐 **[Web Version](https://food-lens--yayyjdno8l.expo.app)**

## 📋 Overview

**Food Lens** is a cross-platform React Native mobile application that uses AI-powered image recognition to scan food labels and instantly extract detailed nutrition information, allergen warnings, and healthier alternative suggestions. The app supports both English and Turkish languages, making it accessible to a wide range of users.

## ✨ Key Features

### 📷 Food Label Scanning
- **Camera Integration** - Real-time camera scanning with visual feedback
- **Photo Library Support** - Select existing photos from your gallery
- **Auto-Detection** - AI automatically detects and extracts nutrition facts and ingredients
- **Multi-Language Support** - English and Turkish language support with auto-detection

### 📊 Nutrition Information
- **Complete Nutrition Facts** - Calories, macronutrients (protein, carbs, fat)
- **Detailed Micronutrients** - Vitamins and minerals when available
- **Serving Size Information** - Accurate serving size details
- **Brand Detection** - Automatic product brand and name recognition
- **Beautiful Cards** - Human-readable, visually appealing nutrition cards

### 🚨 Allergen Detection
- **Severity Levels** - High, medium, and low allergen warnings with color coding
- **Comprehensive Allergen List** - Identifies common allergens (nuts, dairy, gluten, eggs, etc.)
- **Safety Information** - Clear descriptions of allergen presence
- **User Preferences** - Filter by your dietary restrictions and allergies

### 💚 Healthier Alternatives
- **AI-Powered Suggestions** - Smart recommendations for healthier products
- **Comparison View** - Side-by-side nutrition comparison
- **Health Scores** - Health score ratings for current and alternative products
- **Reasoning** - Explanations for why alternatives are healthier

### 📱 User Experience
- **Scan History** - View and manage all your past scans
- **Offline Support** - Basic functionality works offline with sync when online
- **Secure Authentication** - Firebase Authentication with email/password
- **Privacy Protection** - Encrypted image storage and secure data handling

## 🛠️ Tech Stack

### Mobile Framework
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tooling
- **TypeScript** - Type-safe code
- **Expo Router** - File-based navigation

### AI & Processing
- **Vercel AI Gateway** - AI model integration and processing
- **AI SDK** - Unified AI SDK for model calls
- **Image Processing** - Advanced OCR and text extraction

### Backend Services
- **Firebase Authentication** - User authentication and security
- **Firebase Firestore** - NoSQL database for scan history and user data
- **Firebase Cloud Storage** - Secure image storage
- **Firebase Cloud Functions** - Serverless backend functions

### UI & Styling
- **NativeWind** - Tailwind CSS for React Native
- **React Navigation** - Navigation and routing
- **React Native Reanimated** - Smooth animations and transitions
- **Expo Linear Gradient** - Beautiful gradient effects

### Development Tools
- **Jest** - Testing framework
- **React Native Testing Library** - Component testing
- **TypeScript** - Type checking
- **ESLint** - Code linting

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd food-lens
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Enable Cloud Storage
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the appropriate directories

4. **Configure environment variables**
   - Create a `.env` file or configure in Firebase console:
   ```env
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VERCEL_AI_GATEWAY_URL=your-vercel-ai-gateway-url
   ```

5. **Start the development server**
```bash
npm start
```

6. **Run on your device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

## 🧪 Testing

### Run tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Structure
- **Unit Tests** - Individual component and function testing
- **Integration Tests** - Service and API integration testing
- **E2E Tests** - End-to-end user flow testing

## 📱 Building for Production

### iOS
```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android
```bash
# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

### Environment Setup for EAS
Ensure `eas.json` is configured with your project settings:
```json
{
  "build": {
    "production": {
      "env": {
        "FIREBASE_API_KEY": "your-key",
        "VERCEL_AI_GATEWAY_URL": "your-url"
      }
    }
  }
}
```

## 💻 Usage

### For Health-Conscious Consumers
1. Download and install the app
2. Create an account or log in
3. Grant camera permissions when prompted
4. Point camera at a food label and tap scan
5. View nutrition information and allergen warnings
6. Explore healthier alternatives

### For Parents with Food-Allergic Children
1. Set dietary restrictions in your profile
2. Scan food labels before purchasing
3. Review allergen warnings (highlighted in red for high severity)
4. Check alternative suggestions for safer options

### For Users with Dietary Restrictions
1. Configure your dietary preferences in settings
2. Scan products to check compatibility
3. View detailed nutrition breakdowns
4. Discover suitable alternatives

## 🔒 Security Features

- **Secure Authentication** - Firebase Authentication with encrypted credentials
- **Encrypted Storage** - All images and data encrypted at rest
- **Secure API Calls** - Vercel AI Gateway with authentication
- **Privacy Controls** - User data isolated and protected
- **Offline Security** - Secure local storage with encryption

## 🌍 Internationalization

The app supports:
- **English** - Full English language support
- **Turkish** - Complete Turkish language support
- **Auto-Detection** - Automatic language detection based on label content

## 📚 API Documentation

### Firebase Collections

**Users Collection**
```typescript
{
  userId: string;
  email: string;
  displayName: string;
  dietaryRestrictions: string[];
  createdAt: timestamp;
}
```

**Scans Collection**
```typescript
{
  scanId: string;
  userId: string;
  imageUrl: string;
  nutritionInfo: NutritionInfo;
  allergens: AllergenInfo[];
  alternatives: AlternativeSuggestion[];
  createdAt: timestamp;
}
```

### Vercel AI Gateway

The app integrates with Vercel AI Gateway for processing food label images. Ensure your gateway is configured to:
- Accept image uploads
- Return structured nutrition data
- Support bilingual responses (EN/TR)

## 🐛 Troubleshooting

### Camera Permissions
- **iOS**: Go to Settings > Privacy > Camera > Food Lens > Enable
- **Android**: Go to Settings > Apps > Food Lens > Permissions > Camera > Allow

### Firebase Connection Issues
- Verify Firebase configuration files are correctly placed
- Check network connectivity
- Ensure Firebase project has necessary services enabled

### AI Processing Errors
- Check Vercel AI Gateway configuration
- Verify API keys are correctly set
- Ensure image quality is sufficient for processing

### Build Issues
- Clear Expo cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check EAS configuration in `eas.json`

## 🤝 Contributing

This is a learning project built with SDD-MCP methodology. Feel free to:
- Study the code and architecture
- Run the tests and experiments
- Suggest improvements
- Share your learnings

## 📄 License

MIT License - Feel free to use this code for learning and experimentation.

## 🙏 Acknowledgments

Built with ❤️ using [AI-SDD-MCP](https://www.npmjs.com/package/ai-sdd-mcp) methodology.

---

**Note**: This app is for informational purposes only. Always consult with healthcare professionals for dietary and nutritional advice, especially if you have food allergies or specific health conditions.

