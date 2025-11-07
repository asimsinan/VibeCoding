import Foundation
import FirebaseFirestore

/// Transaction model for storing payment transactions
struct Transaction: Codable, Identifiable, FirestoreCodable {
    @DocumentID var id: String?
    var userId: String
    var rideId: String
    var type: TransactionType
    var amount: Double
    var currency: String
    var status: TransactionStatus
    var paymentMethodId: String?
    var stripePaymentIntentId: String?
    var stripeRefundId: String?
    var description: String?
    var metadata: [String: String]?
    var createdAt: Date
    var updatedAt: Date
    
    enum TransactionType: String, Codable {
        case charge = "charge"
        case refund = "refund"
        case cancellationFee = "cancellation_fee"
    }
    
    enum TransactionStatus: String, Codable {
        case pending = "pending"
        case processing = "processing"
        case succeeded = "succeeded"
        case failed = "failed"
        case refunded = "refunded"
        case partiallyRefunded = "partially_refunded"
        
        /// Returns a formatted display name with underscores replaced by spaces and proper capitalization
        var displayName: String {
            return rawValue.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId
        case rideId
        case type
        case amount
        case currency
        case status
        case paymentMethodId
        case stripePaymentIntentId
        case stripeRefundId
        case description
        case metadata
        case createdAt
        case updatedAt
    }
    
    init(
        id: String? = nil,
        userId: String,
        rideId: String,
        type: TransactionType,
        amount: Double,
        currency: String = "usd",
        status: TransactionStatus = .pending,
        paymentMethodId: String? = nil,
        stripePaymentIntentId: String? = nil,
        stripeRefundId: String? = nil,
        description: String? = nil,
        metadata: [String: String]? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.userId = userId
        self.rideId = rideId
        self.type = type
        self.amount = amount
        self.currency = currency
        self.status = status
        self.paymentMethodId = paymentMethodId
        self.stripePaymentIntentId = stripePaymentIntentId
        self.stripeRefundId = stripeRefundId
        self.description = description
        self.metadata = metadata
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    /// Display name for the transaction type
    var typeDisplayName: String {
        switch type {
        case .charge:
            return "Payment"
        case .refund:
            return "Refund"
        case .cancellationFee:
            return "Cancellation Fee"
        }
    }
    
    /// Formatted amount with currency symbol
    var formattedAmount: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency.uppercased()
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(String(format: "%.2f", amount))"
    }
    
    /// Check if transaction is successful
    var isSuccessful: Bool {
        return status == .succeeded || status == .refunded
    }
    
    // MARK: - FirestoreCodable Conformance
    
    func validate() throws {
        guard !userId.isEmpty else {
            throw ValidationError.invalidValue("User ID cannot be empty")
        }
        guard !rideId.isEmpty else {
            throw ValidationError.invalidValue("Ride ID cannot be empty")
        }
        guard amount >= 0 else {
            throw ValidationError.invalidValue("Amount cannot be negative")
        }
    }
}

