# Frontend Platform Configuration Documentation

## Platform Overview

**Platform:** Mobile (React Native with Expo)  
**Framework:** React Native 0.74.5 with Expo SDK 51  
**Language:** TypeScript 5.3.3  
**Status:** ✅ Fully Configured

## Development Environment

### Prerequisites
- Node.js 18+
- npm 11+
- Expo CLI (via npx)
- TypeScript 5.3.3
- React 18.2.0
- React Native 0.74.5

### Installed Tools
✅ **Build Tools:**
- Expo SDK ~51.0.0
- Metro Bundler (via Expo)
- Babel 7.28.5
- TypeScript 5.3.3
- Jest 29.7.0

✅ **Development Dependencies:**
- @babel/core
- jest-expo
- @testing-library/react-native
- @testing-library/jest-native
- eslint
- typescript

## Project Structure

```
food-lens/
├── app/                    # Expo Router entry point
├── src/                     # Source code
│   ├── components/          # UI components
│   ├── screens/            # App screens
│   ├── lib/                # Core library (Phase 2)
│   ├── hooks/              # React hooks
│   ├── contexts/           # React contexts
│   ├── navigation/         # Navigation config
│   └── types/              # TypeScript types
├── assets/                 # Images, fonts, etc.
├── tests/                  # Test files
├── config/                 # Configuration files
└── docs/                    # Documentation
```

## Build Configuration

### 1. TypeScript Configuration (`tsconfig.json`)
- ✅ Target: ES2020+
- ✅ JSX: react-native
- ✅ Strict mode enabled
- ✅ Path aliases configured (@/*)
- ✅ Module resolution: node

### 2. Metro Bundler (`metro.config.js`)
- ✅ Expo default config
- ✅ NativeWind integration
- ✅ CSS processing configured

### 3. Babel Configuration (`babel.config.js`)
- ✅ Expo preset
- ✅ React Native Reanimated plugin
- ✅ Test environment configuration

### 4. Jest Configuration (`jest.config.js`)
- ✅ jest-expo preset
- ✅ Transform ignore patterns for native modules
- ✅ Coverage thresholds: 85%
- ✅ Path mapping (@/ aliases)
- ✅ Test environment: node

### 5. Expo Configuration (`app.json`)
- ✅ App name: Food Lens
- ✅ Bundle identifiers configured
- ✅ iOS/Android permissions set
- ✅ Camera plugin configured
- ✅ Splash screen configured

### 6. EAS Build Configuration (`eas.json`)
- ✅ Development builds configured
- ✅ Preview builds configured
- ✅ Production builds configured
- ✅ Distribution settings set

## Build Commands

### Development
```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run in web browser
```

### Testing
```bash
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
```

### Production Builds
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Type Checking
```bash
npm run type-check     # TypeScript type checking
```

### Linting
```bash
npm run lint           # ESLint code analysis
```

## Environment Variables

Configuration via `.env` file:
- Firebase credentials (EXPO_PUBLIC_FIREBASE_*)
- AI Gateway credentials (EXPO_PUBLIC_AI_GATEWAY_*)

See `config/env.example.md` for full list.

## Verification Checklist

✅ Frontend platform configured  
✅ Development environment working  
✅ Build tools installed  
✅ Project structure created  
✅ Build configuration complete  
✅ Development builds working  
✅ Testing builds configured  
✅ Production builds ready (EAS configured)  
✅ All configurations documented  

## Next Steps

1. **Design System (TASK-002)**: Implement UI components and styling
2. **Application Structure (TASK-003)**: Set up routing and navigation
3. **UI Components (TASK-004)**: Build interactive components

---

**Last Updated:** Phase 3, Task 1 Complete  
**Status:** ✅ Platform Ready for UI Development

