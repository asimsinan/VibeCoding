# Environment Variables Configuration

## Required Environment Variables

### Firebase Configuration
- `EXPO_PUBLIC_FIREBASE_API_KEY`: Firebase API key
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase authentication domain
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket name
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `EXPO_PUBLIC_FIREBASE_APP_ID`: Firebase application ID
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`: Firebase measurement ID (optional)

### Vercel AI Gateway
- `EXPO_PUBLIC_VERCEL_AI_GATEWAY_URL`: Vercel AI Gateway endpoint URL
- `EXPO_PUBLIC_VERCEL_AI_GATEWAY_API_KEY`: Vercel AI Gateway API key

### API Configuration
- `EXPO_PUBLIC_API_BASE_URL`: Base URL for API endpoints
- `EXPO_PUBLIC_API_VERSION`: API version (default: v1)

### App Configuration
- `EXPO_PUBLIC_APP_ENV`: Environment (development, testing, production)
- `EXPO_PUBLIC_APP_VERSION`: Application version
- `EXPO_PUBLIC_DEFAULT_LANGUAGE`: Default language (en or tr)
- `EXPO_PUBLIC_SUPPORTED_LANGUAGES`: Comma-separated list of supported languages

### Feature Flags
- `EXPO_PUBLIC_ENABLE_OFFLINE_MODE`: Enable offline mode (true/false)
- `EXPO_PUBLIC_ENABLE_ANALYTICS`: Enable analytics (true/false)
- `EXPO_PUBLIC_MAX_IMAGE_SIZE_MB`: Maximum image size in MB (default: 10)

### Security
- `EXPO_PUBLIC_RATE_LIMIT_SCANS_PER_HOUR`: Rate limit for scans per hour per user

## Environment Files
- `.env.development`: Development environment variables
- `.env.production`: Production environment variables
- `.env.test`: Testing environment variables

