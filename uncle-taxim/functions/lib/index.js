"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentMethod = exports.createSetupIntent = exports.confirmPayment = exports.attachPaymentMethod = exports.createPaymentIntent = void 0;
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const v2_1 = require("firebase-functions/v2");
admin.initializeApp();
// Define the secret parameter for Firebase Functions v2
const stripeSecretKey = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
// Set global options for all v2 functions
(0, v2_1.setGlobalOptions)({
    region: "us-central1",
    maxInstances: 20,
    memory: "256MiB",
    timeoutSeconds: 60,
});
// Lazy initialization of Stripe client per secret value
// This prevents errors during module load if config is not yet set
const stripeInstances = new Map();
function getStripe(secretValue) {
    // Use provided secret value or try to get from environment
    const secret = secretValue || stripeSecretKey.value() || process.env.STRIPE_SECRET_KEY;
    if (!secret) {
        throw new Error("Stripe secret key not configured. " +
            "Set it using: firebase functions:secrets:set STRIPE_SECRET_KEY " +
            "Then redeploy: firebase deploy --only functions");
    }
    // Cache Stripe instance per secret value
    if (!stripeInstances.has(secret)) {
        stripeInstances.set(secret, new stripe_1.default(secret, {
            apiVersion: "2025-02-24.acacia",
        }));
    }
    return stripeInstances.get(secret);
}
/**
 * Creates a Stripe payment intent
 * Requires: Firebase Auth token, amount, currency
 */
exports.createPaymentIntent = (0, https_1.onCall)({
    invoker: "public",
    secrets: [stripeSecretKey], // Grant access to the secret
    // Global options are inherited, but can be overridden here if needed
}, async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated");
    }
    const { amount, currency = "usd", paymentMethodId, returnUrl } = request.data;
    if (!amount || amount <= 0) {
        throw new https_1.HttpsError("invalid-argument", "Amount must be greater than 0");
    }
    try {
        // Get Stripe secret key from the function context
        const secret = stripeSecretKey.value();
        if (!secret) {
            throw new https_1.HttpsError("internal", "Stripe secret key not available. Please contact support.");
        }
        // Get or create Stripe customer for this user
        const userId = request.auth.uid;
        let customerId = await getOrCreateStripeCustomer(userId, secret);
        // Create payment intent
        const paymentIntentParams = {
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            customer: customerId,
        };
        // If payment method is provided, use it with confirmation_method
        // Otherwise, use automatic_payment_methods (they are mutually exclusive)
        if (paymentMethodId) {
            paymentIntentParams.payment_method = paymentMethodId;
            paymentIntentParams.confirmation_method = "manual";
            paymentIntentParams.confirm = true;
            // Add return_url when confirming payment (required for redirect-based payment methods)
            if (returnUrl) {
                paymentIntentParams.return_url = returnUrl;
            }
            else {
                // Default return URL for iOS app (can be customized via URL scheme)
                // This will redirect back to the app after payment confirmation
                paymentIntentParams.return_url = "uncle-taxim://payment-return";
            }
            // IMPORTANT: Do NOT set automatic_payment_methods when using confirmation_method
            // They are mutually exclusive parameters
        }
        else {
            // Use automatic payment methods when no specific payment method is provided
            // Set allow_redirects to "never" to avoid redirect-based payment methods
            // This prevents the need for a return_url
            paymentIntentParams.automatic_payment_methods = {
                enabled: true,
                allow_redirects: "never", // Prevent redirect-based payment methods
            };
        }
        const paymentIntent = await getStripe(secret).paymentIntents.create(paymentIntentParams);
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
        };
    }
    catch (error) {
        console.error("Error creating payment intent:", error);
        throw new https_1.HttpsError("internal", error.message || "Failed to create payment intent");
    }
});
/**
 * Attaches a payment method to a customer
 * Requires: Firebase Auth token, paymentMethodId
 */
exports.attachPaymentMethod = (0, https_1.onCall)({
    invoker: "public",
    secrets: [stripeSecretKey], // Grant access to the secret
}, async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated");
    }
    const { paymentMethodId } = request.data;
    if (!paymentMethodId) {
        throw new https_1.HttpsError("invalid-argument", "Payment method ID is required");
    }
    try {
        // Get Stripe secret key from the function context
        const secret = stripeSecretKey.value();
        if (!secret) {
            throw new https_1.HttpsError("internal", "Stripe secret key not available. Please contact support.");
        }
        const userId = request.auth.uid;
        const customerId = await getOrCreateStripeCustomer(userId, secret);
        // Attach payment method to customer
        await getStripe(secret).paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });
        // Set as default if it's the first payment method
        const paymentMethods = await getStripe(secret).paymentMethods.list({
            customer: customerId,
            type: "card",
        });
        if (paymentMethods.data.length === 1) {
            await getStripe(secret).customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
        }
        return {
            success: true,
            customerId: customerId,
        };
    }
    catch (error) {
        console.error("Error attaching payment method:", error);
        throw new https_1.HttpsError("internal", error.message || "Failed to attach payment method");
    }
});
/**
 * Confirms a payment intent
 * Requires: Firebase Auth token, paymentIntentId
 */
exports.confirmPayment = (0, https_1.onCall)({
    invoker: "public",
    secrets: [stripeSecretKey], // Grant access to the secret
}, async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated");
    }
    const { paymentIntentId } = request.data;
    if (!paymentIntentId) {
        throw new https_1.HttpsError("invalid-argument", "Payment intent ID is required");
    }
    try {
        // Get Stripe secret key from the function context
        const secret = stripeSecretKey.value();
        if (!secret) {
            throw new https_1.HttpsError("internal", "Stripe secret key not available. Please contact support.");
        }
        const paymentIntent = await getStripe(secret).paymentIntents.retrieve(paymentIntentId);
        // Verify the payment intent belongs to the user's customer
        const userId = request.auth.uid;
        const customerId = await getOrCreateStripeCustomer(userId, secret);
        if (paymentIntent.customer !== customerId) {
            throw new https_1.HttpsError("permission-denied", "Payment intent does not belong to this user");
        }
        return {
            success: paymentIntent.status === "succeeded",
            status: paymentIntent.status,
            paymentIntentId: paymentIntent.id,
        };
    }
    catch (error) {
        console.error("Error confirming payment:", error);
        throw new https_1.HttpsError("internal", error.message || "Failed to confirm payment");
    }
});
/**
 * Creates a setup intent for collecting payment methods without charging
 * Requires: Firebase Auth token
 */
exports.createSetupIntent = (0, https_1.onCall)({
    // Allow unauthenticated requests (authentication is checked inside)
    // Cloud Run IAM will allow allUsers to invoke, but we check auth inside
    invoker: "public",
    // Grant access to the Stripe secret
    secrets: [stripeSecretKey],
}, async (request) => {
    var _a;
    // Verify user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated");
    }
    try {
        // Get Stripe secret key from the function context
        const secret = stripeSecretKey.value();
        if (!secret) {
            throw new https_1.HttpsError("internal", "Stripe secret key not available. Please contact support.");
        }
        const userId = request.auth.uid;
        const customerId = await getOrCreateStripeCustomer(userId, secret);
        // Create setup intent
        const setupIntent = await getStripe(secret).setupIntents.create({
            customer: customerId,
            payment_method_types: ["card"],
        });
        return {
            clientSecret: setupIntent.client_secret,
            setupIntentId: setupIntent.id,
        };
    }
    catch (error) {
        console.error("Error creating setup intent:", error);
        // Provide more detailed error message
        const errorMessage = error.message || error.toString() || "Failed to create setup intent";
        console.error("Error details:", {
            message: errorMessage,
            stack: error.stack,
            type: (_a = error.constructor) === null || _a === void 0 ? void 0 : _a.name
        });
        throw new https_1.HttpsError("internal", `Failed to create setup intent: ${errorMessage}`);
    }
});
/**
 * Creates a payment method from PaymentSheet
 * Requires: Firebase Auth token, paymentMethodId or setupIntentId
 */
exports.createPaymentMethod = (0, https_1.onCall)({
    invoker: "public",
    secrets: [stripeSecretKey],
}, async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated");
    }
    const { paymentMethodId, setupIntentId } = request.data;
    let paymentMethodIdToUse;
    // Get Stripe secret key from the function context
    const secret = stripeSecretKey.value();
    if (!secret) {
        throw new https_1.HttpsError("internal", "Stripe secret key not available. Please contact support.");
    }
    // If setupIntentId is provided, retrieve payment method from setup intent
    if (setupIntentId) {
        try {
            const setupIntent = await getStripe(secret).setupIntents.retrieve(setupIntentId);
            if (!setupIntent.payment_method) {
                throw new https_1.HttpsError("invalid-argument", "Setup intent does not have a payment method");
            }
            paymentMethodIdToUse = setupIntent.payment_method;
        }
        catch (error) {
            throw new https_1.HttpsError("internal", error.message || "Failed to retrieve setup intent");
        }
    }
    else if (paymentMethodId) {
        paymentMethodIdToUse = paymentMethodId;
    }
    else {
        throw new https_1.HttpsError("invalid-argument", "Payment method ID or setup intent ID is required");
    }
    try {
        const userId = request.auth.uid;
        const customerId = await getOrCreateStripeCustomer(userId, secret);
        // Retrieve the payment method from Stripe
        const paymentMethod = await getStripe(secret).paymentMethods.retrieve(paymentMethodIdToUse);
        // Attach payment method to customer
        await getStripe(secret).paymentMethods.attach(paymentMethodIdToUse, {
            customer: customerId,
        });
        // Get payment method details
        const card = paymentMethod.card;
        const last4 = (card === null || card === void 0 ? void 0 : card.last4) || "";
        const brand = (card === null || card === void 0 ? void 0 : card.brand) || "unknown";
        const expMonth = (card === null || card === void 0 ? void 0 : card.exp_month) || 0;
        const expYear = (card === null || card === void 0 ? void 0 : card.exp_year) || 0;
        return {
            success: true,
            paymentMethodId: paymentMethodIdToUse,
            last4: last4,
            brand: brand,
            expiryMonth: expMonth,
            expiryYear: expYear,
            customerId: customerId,
        };
    }
    catch (error) {
        console.error("Error creating payment method:", error);
        throw new https_1.HttpsError("internal", error.message || "Failed to create payment method");
    }
});
/**
 * Helper function to get or create a Stripe customer for a Firebase user
 */
async function getOrCreateStripeCustomer(userId, secret) {
    // Check if customer ID is already stored in Firestore
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const userData = userDoc.data();
    if (userData === null || userData === void 0 ? void 0 : userData.stripeCustomerId) {
        // Verify customer still exists in Stripe
        try {
            await getStripe(secret).customers.retrieve(userData.stripeCustomerId);
            return userData.stripeCustomerId;
        }
        catch (error) {
            // Customer doesn't exist, create a new one
        }
    }
    // Get user email from Firebase Auth
    const userRecord = await admin.auth().getUser(userId);
    const email = userRecord.email || "";
    // Create new Stripe customer
    const customer = await getStripe(secret).customers.create({
        email: email,
        metadata: {
            firebaseUserId: userId,
        },
    });
    // Store customer ID in Firestore
    await admin.firestore().collection("users").doc(userId).update({
        stripeCustomerId: customer.id,
    });
    return customer.id;
}
//# sourceMappingURL=index.js.map