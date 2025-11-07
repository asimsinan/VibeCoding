# Firebase Functions for Stripe Integration

This directory contains Firebase Cloud Functions for handling Stripe payment operations that require the secret key.

## Setup Instructions

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase Functions** (if not already done):
   ```bash
   firebase init functions
   ```
   Select TypeScript or JavaScript when prompted.

3. **Set Stripe Secret Key as Environment Variable**:
   ```bash
   firebase functions:config:set stripe.secret_key="YOUR_STRIPE_SECRET_KEY_HERE"
   ```

4. **Deploy Functions**:
   ```bash
   firebase deploy --only functions
   ```

## Functions to Implement

The following functions should be created in `functions/src/index.ts`:

- `createPaymentIntent` - Creates a Stripe payment intent
- `attachPaymentMethod` - Attaches a payment method to a customer
- `confirmPayment` - Confirms a payment
- `createCustomer` - Creates a Stripe customer for a user

## Security

- The Stripe secret key is stored securely in Firebase Functions config
- Functions validate Firebase Auth tokens before processing requests
- Only authenticated users can call these functions

