import Foundation
import FirebaseFirestore

/// Payment method model for storing user payment information
struct PaymentMethod: Codable, Identifiable, FirestoreCodable {
    @DocumentID var id: String?
    var userId: String
    var type: PaymentMethodType
    var last4: String? // Last 4 digits of card
    var brand: String? // Card brand (Visa, Mastercard, etc.)
    var expiryMonth: Int?
    var expiryYear: Int?
    var isDefault: Bool
    var stripePaymentMethodId: String? // Stripe payment method ID
    var createdAt: Date
    var updatedAt: Date
    
    enum PaymentMethodType: String, Codable {
        case creditCard = "credit_card"
        case debitCard = "debit_card"
        case applePay = "apple_pay"
        case googlePay = "google_pay"
        
        var displayName: String {
            switch self {
            case .creditCard: return "Credit Card"
            case .debitCard: return "Debit Card"
            case .applePay: return "Apple Pay"
            case .googlePay: return "Google Pay"
            }
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId
        case type
        case last4
        case brand
        case expiryMonth
        case expiryYear
        case isDefault
        case stripePaymentMethodId
        case createdAt
        case updatedAt
    }
    
    init(
        id: String? = nil,
        userId: String,
        type: PaymentMethodType,
        last4: String? = nil,
        brand: String? = nil,
        expiryMonth: Int? = nil,
        expiryYear: Int? = nil,
        isDefault: Bool = false,
        stripePaymentMethodId: String? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.userId = userId
        self.type = type
        self.last4 = last4
        self.brand = brand
        self.expiryMonth = expiryMonth
        self.expiryYear = expiryYear
        self.isDefault = isDefault
        self.stripePaymentMethodId = stripePaymentMethodId
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    /// Display name for the payment method
    var displayName: String {
        if let last4 = last4, !last4.isEmpty {
            if let brand = brand {
                return "\(brand) •••• \(last4)"
            }
            return "•••• \(last4)"
        }
        return type.displayName
    }
    
    /// Formatted expiry date
    var formattedExpiry: String? {
        guard let month = expiryMonth, let year = expiryYear else { return nil }
        return String(format: "%02d/%d", month, year)
    }
    
    /// Check if payment method is expired
    var isExpired: Bool {
        guard let month = expiryMonth, let year = expiryYear else { return false }
        let calendar = Calendar.current
        let currentDate = Date()
        let currentYear = calendar.component(.year, from: currentDate)
        let currentMonth = calendar.component(.month, from: currentDate)
        
        if year < currentYear {
            return true
        } else if year == currentYear && month < currentMonth {
            return true
        }
        return false
    }
    
    // MARK: - FirestoreCodable Conformance
    
    func validate() throws {
        guard !userId.isEmpty else {
            throw ValidationError.invalidValue("User ID cannot be empty")
        }
        if let last4 = last4, last4.count != 4 {
            throw ValidationError.invalidValue("Last 4 digits must be exactly 4 characters")
        }
        if let month = expiryMonth, (month < 1 || month > 12) {
            throw ValidationError.invalidValue("Expiry month must be between 1 and 12")
        }
        if let year = expiryYear, year < 2000 || year > 2100 {
            throw ValidationError.invalidValue("Expiry year must be between 2000 and 2100")
        }
    }
}

