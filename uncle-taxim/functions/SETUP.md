# Firebase Functions Setup for Stripe Integration

This guide explains how to set up Firebase Functions to securely handle Stripe payments using your secret key.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Node.js 18+ installed
3. Firebase project initialized

## Setup Steps

### 1. Initialize Firebase Functions (if not already done)

```bash
cd /Users/asimsinanyuksel/Desktop/uncle-taxim
firebase init functions
```

When prompted:
- Select TypeScript (recommended) or JavaScript
- Install dependencies? Yes

### 2. Install Dependencies

```bash
cd functions
npm install
```

This will install:
- `firebase-functions`
- `firebase-admin`
- `stripe`

### 3. Set Stripe Secret Key

**Option A: Using Firebase Functions Config (Recommended for production)**
```bash
firebase functions:config:set stripe.secret_key="YOUR_STRIPE_SECRET_KEY_HERE"
```

**Option B: Using Environment Variables (for local development)**
Create a `.env` file in the `functions/` directory:
```
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY_HERE
```

### 4. Build and Deploy Functions

```bash
# Build TypeScript
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

### 5. Update iOS App

After deploying, run `pod install` in the iOS project root to install FirebaseFunctions:

```bash
cd /Users/asimsinanyuksel/Desktop/uncle-taxim
pod install
```

Then uncomment the Firebase Functions code in `PaymentService.swift`.

## Security Notes

✅ **DO:**
- Store the secret key in Firebase Functions config or environment variables
- Use Firebase Auth to verify users before processing payments
- Validate all input data in functions

❌ **DON'T:**
- Never commit the secret key to version control
- Never include the secret key in the iOS app
- Never expose the secret key in client-side code

## Function Endpoints

After deployment, these functions will be available:

- `createPaymentIntent` - Creates a Stripe payment intent
- `attachPaymentMethod` - Attaches a payment method to a customer
- `confirmPayment` - Confirms a payment intent

The functions automatically:
- Verify Firebase Auth tokens
- Create/get Stripe customers for users
- Store customer IDs in Firestore
- Handle errors securely

## Testing

You can test functions locally using the Firebase emulator:

```bash
firebase emulators:start --only functions
```

Then update the iOS app to point to the emulator URL for local testing.

