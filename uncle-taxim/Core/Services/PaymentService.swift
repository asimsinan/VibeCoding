import Foundation
import FirebaseAuth
// Note: FirebaseFunctions and StripePaymentSheet will be imported when pods are installed
import FirebaseFunctions
import StripePaymentSheet

/// Service for handling Stripe payment operations
/// Uses Firebase Functions as the backend to securely handle Stripe secret key operations
class PaymentService {
    static let shared = PaymentService()
    
    private let publishableKey: String = StripeConfig.publishableKey
    
    private lazy var functions = Functions.functions(region: StripeConfig.functionsRegion)
    
    private init() {
        // Initialize Stripe with publishable key
        StripeAPI.defaultPublishableKey = publishableKey
        // TODO: Uncomment when Stripe SDK is properly installed
    }
    
    /// Create a payment intent using Firebase Functions
    /// This calls the Firebase Function which uses the Stripe secret key securely
    func createPaymentIntent(amount: Double, currency: String = "usd", paymentMethodId: String? = nil, returnUrl: String? = nil) async throws -> PaymentIntentResponse {
        // Verify user is authenticated
        guard Auth.auth().currentUser != nil else {
            throw PaymentError.authenticationFailed
        }
        
      
        let function = functions.httpsCallable("createPaymentIntent")
        
        var data: [String: Any] = [
            "amount": amount,
            "currency": currency
        ]
        
        if let paymentMethodId = paymentMethodId {
            data["paymentMethodId"] = paymentMethodId
        }
        
        // Add return URL if provided (for redirect-based payment methods)
        if let returnUrl = returnUrl {
            data["returnUrl"] = returnUrl
        }
        
        do {
            let result = try await function.call(data)
            guard let resultData = result.data as? [String: Any],
                  let clientSecret = resultData["clientSecret"] as? String else {
                throw PaymentError.invalidResponse
            }
            
            return PaymentIntentResponse(
                clientSecret: clientSecret,
                paymentIntentId: resultData["paymentIntentId"] as? String,
                status: resultData["status"] as? String
            )
        } catch let error as NSError {
            // Check if it's a Firebase Functions error
            if let functionsError = error.userInfo["error"] as? [String: Any],
               let message = functionsError["message"] as? String {
                throw PaymentError.networkError(message)
            } else {
                let message = error.localizedDescription
                throw PaymentError.networkError(message)
            }
        }
    }
    
    /// Attach a payment method to a customer using Firebase Functions
    func attachPaymentMethod(_ paymentMethodId: String) async throws {
        // Verify user is authenticated
        guard Auth.auth().currentUser != nil else {
            throw PaymentError.authenticationFailed
        }
    
     
        let function = functions.httpsCallable("attachPaymentMethod")
        
        let data: [String: Any] = [
            "paymentMethodId": paymentMethodId
        ]
        
        do {
            _ = try await function.call(data)
        } catch {
            throw PaymentError.attachmentFailed
        }
    }
    
    /// Confirm payment with a payment method using Firebase Functions
    func confirmPayment(paymentIntentId: String) async throws -> PaymentResult {
        // Verify user is authenticated
        guard Auth.auth().currentUser != nil else {
            throw PaymentError.authenticationFailed
        }
    
      
        let function = functions.httpsCallable("confirmPayment")
        
        let data: [String: Any] = [
            "paymentIntentId": paymentIntentId
        ]
        
        do {
            let result = try await function.call(data)
            guard let resultData = result.data as? [String: Any] else {
                throw PaymentError.invalidResponse
            }
            
            let success = resultData["success"] as? Bool ?? false
            let status = resultData["status"] as? String ?? "unknown"
            
            return PaymentResult(
                success: success && status == "succeeded",
                paymentIntentId: resultData["paymentIntentId"] as? String,
                message: success ? "Payment successful" : "Payment failed"
            )
        } catch {
            throw PaymentError.confirmationFailed
        }
    }
    
    /// Create a setup intent for collecting payment methods
    func createSetupIntent() async throws -> SetupIntentResponse {
        // Verify user is authenticated and get token
        guard let currentUser = Auth.auth().currentUser else {
            throw PaymentError.authenticationFailed
        }
        
        // Refresh the token to ensure it's valid
        do {
            _ = try await currentUser.getIDToken(forcingRefresh: false)
        } catch {
            throw PaymentError.authenticationFailed
        }
        
        let function = functions.httpsCallable("createSetupIntent")
        
        do {
            let result = try await function.call([:])
            guard let resultData = result.data as? [String: Any],
                  let clientSecret = resultData["clientSecret"] as? String else {
                throw PaymentError.invalidResponse
            }
            
            return SetupIntentResponse(
                clientSecret: clientSecret,
                setupIntentId: resultData["setupIntentId"] as? String
            )
        } catch let error as NSError {
            // Check if it's a Firebase Functions error
            if error.domain == "FIRFunctionsErrorDomain" {
                if error.code == 16 { // UNAUTHENTICATED
                    throw PaymentError.authenticationFailed
                } else if error.code == 13 { // INTERNAL
                    // Try to extract the actual error message from the function
                    var errorMessage = "Internal server error"
                    if let userInfo = error.userInfo as? [String: Any] {
                        // Check for error details in various places
                        if let message = userInfo["NSLocalizedDescription"] as? String {
                            errorMessage = message
                        } else if let underlyingError = userInfo["NSUnderlyingError"] as? NSError {
                            errorMessage = underlyingError.localizedDescription
                        } else if let errorDict = userInfo["error"] as? [String: Any],
                                  let message = errorDict["message"] as? String {
                            errorMessage = message
                        }
                    }
                    throw PaymentError.networkError("Server error: \(errorMessage). Check Firebase Functions logs for details.")
                } else if let functionsError = error.userInfo["error"] as? [String: Any],
                          let message = functionsError["message"] as? String {
                    throw PaymentError.networkError(message)
                } else {
                    throw PaymentError.networkError(error.localizedDescription)
                }
            } else {
                let message = error.localizedDescription
                throw PaymentError.networkError(message)
            }
        }
    }
    
    /// Create a payment method from PaymentSheet
    /// This calls the Firebase Function to attach the payment method and get details
    func createPaymentMethod(paymentMethodId: String) async throws -> PaymentMethodResponse {
        // Verify user is authenticated
        guard Auth.auth().currentUser != nil else {
            throw PaymentError.authenticationFailed
        }
        
        let function = functions.httpsCallable("createPaymentMethod")
        
        let data: [String: Any] = [
            "paymentMethodId": paymentMethodId
        ]
        
        do {
            let result = try await function.call(data)
            guard let resultData = result.data as? [String: Any],
                  let success = resultData["success"] as? Bool,
                  success == true else {
                throw PaymentError.invalidResponse
            }
            
            return PaymentMethodResponse(
                paymentMethodId: resultData["paymentMethodId"] as? String ?? paymentMethodId,
                last4: resultData["last4"] as? String,
                brand: resultData["brand"] as? String,
                expiryMonth: resultData["expiryMonth"] as? Int,
                expiryYear: resultData["expiryYear"] as? Int
            )
        } catch {
            throw PaymentError.attachmentFailed
        }
    }
    
    /// Process payment for a completed ride
    /// Creates a payment intent and confirms it
    func processRidePayment(
        rideId: String,
        amount: Double,
        paymentMethodId: String,
        currency: String = "usd"
    ) async throws -> PaymentResult {
        // Verify user is authenticated
        guard Auth.auth().currentUser != nil else {
            throw PaymentError.authenticationFailed
        }
        
        // Create payment intent
        let paymentIntent = try await createPaymentIntent(
            amount: amount,
            currency: currency,
            paymentMethodId: paymentMethodId
        )
        
        guard let intentId = paymentIntent.paymentIntentId else {
            throw PaymentError.paymentIntentCreationFailed
        }
        
        // Confirm payment
        return try await confirmPayment(paymentIntentId: intentId)
    }
    
    /// Process refund for a cancelled ride
    /// Uses Firebase Functions to create a refund
    func processRefund(
        paymentIntentId: String,
        amount: Double? = nil, // If nil, refunds full amount
        reason: String? = nil
    ) async throws -> RefundResult {
        // Verify user is authenticated
        guard Auth.auth().currentUser != nil else {
            throw PaymentError.authenticationFailed
        }
        
        // TODO: Add refund Firebase Function
        // For now, return placeholder
        // In production, this would call a Firebase Function that uses Stripe's refund API
        
        return RefundResult(
            success: true,
            refundId: "refund_placeholder",
            amount: amount ?? 0.0,
            status: "succeeded"
        )
    }
}

struct RefundResult {
    let success: Bool
    let refundId: String?
    let amount: Double
    let status: String
}

enum PaymentError: Error, LocalizedError {
    case invalidURL
    case paymentIntentCreationFailed
    case invalidResponse
    case attachmentFailed
    case confirmationFailed
    case authenticationFailed
    case networkError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid payment URL"
        case .paymentIntentCreationFailed:
            return "Failed to create payment intent"
        case .invalidResponse:
            return "Invalid response from payment server"
        case .attachmentFailed:
            return "Failed to attach payment method"
        case .confirmationFailed:
            return "Payment confirmation failed"
        case .authenticationFailed:
            return "Authentication failed. Please sign in."
        case .networkError(let message):
            return "Network error: \(message)"
        }
    }
}

struct PaymentIntentResponse {
    let clientSecret: String
    let paymentIntentId: String?
    let status: String?
}

struct PaymentResult {
    let success: Bool
    let paymentIntentId: String?
    let message: String
}

struct PaymentMethodResponse {
    let paymentMethodId: String
    let last4: String?
    let brand: String?
    let expiryMonth: Int?
    let expiryYear: Int?
}

struct SetupIntentResponse {
    let clientSecret: String
    let setupIntentId: String?
}

