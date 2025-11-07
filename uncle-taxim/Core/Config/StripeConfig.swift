import Foundation

/// Configuration for Stripe payment integration
struct StripeConfig {
    /// Stripe publishable key (safe to use in client apps)
    /// This key is used to initialize Stripe SDK on the client
    static let publishableKey: String = "pk_test_51SDPsvQKOnIzM7xzMzlMow7nVIEN5VITLibhd5pQkTFQU41gRMVUPVgnLyDXsjEhqveJoZ5C36NtsUTd1vQDf3P100Swo1UQmg"
    
    /// Firebase Functions region (update if you deploy to a different region)
    /// The functions URL will be constructed automatically based on your Firebase project
    static let functionsRegion: String = "us-central1" // Default Firebase Functions region
    
    /// Webhook secret for verifying webhook signatures (backend only)
    /// This should also only be used on the backend
    static let webhookSecret: String = "whsec_your_webhook_secret" // Backend only - not used in iOS app
    
    /// Initialize Stripe SDK with publishable key
    static func configure() {
        // This will be called when Stripe SDK is installed
        // StripeAPI.defaultPublishableKey = publishableKey
    }
}

