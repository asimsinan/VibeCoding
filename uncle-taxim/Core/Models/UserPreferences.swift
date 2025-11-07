import Foundation
import FirebaseFirestore

struct UserPreferences: Codable, Identifiable, FirestoreCodable {
    @DocumentID var id: String?
    var userId: String
    var language: String
    var currency: String
    var notificationSettings: NotificationSettings
    var ridePreferences: RidePreferences
    var createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId
        case language
        case currency
        case notificationSettings
        case ridePreferences
        case createdAt
        case updatedAt
    }
    
    init(
        id: String? = nil,
        userId: String,
        language: String = "en",
        currency: String = "USD",
        notificationSettings: NotificationSettings = NotificationSettings(),
        ridePreferences: RidePreferences = RidePreferences(),
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.userId = userId
        self.language = language
        self.currency = currency
        self.notificationSettings = notificationSettings
        self.ridePreferences = ridePreferences
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    // Validation rules
    func validate() throws {
        guard !userId.isEmpty else {
            throw ValidationError.invalidUserId("User ID cannot be empty")
        }
        guard !language.isEmpty else {
            throw ValidationError.invalidLanguage("Language cannot be empty")
        }
        guard !currency.isEmpty else {
            throw ValidationError.invalidCurrency("Currency cannot be empty")
        }
    }
    
    // Business logic methods
    mutating func updateLanguage(_ language: String) {
        self.language = language
        self.updatedAt = Date()
    }
    
    mutating func updateCurrency(_ currency: String) {
        self.currency = currency
        self.updatedAt = Date()
    }
    
    mutating func updateNotificationSettings(_ settings: NotificationSettings) {
        self.notificationSettings = settings
        self.updatedAt = Date()
    }
    
    mutating func updateRidePreferences(_ preferences: RidePreferences) {
        self.ridePreferences = preferences
        self.updatedAt = Date()
    }
}

struct NotificationSettings: Codable {
    var pushEnabled: Bool
    var emailEnabled: Bool
    var smsEnabled: Bool
    var rideUpdates: Bool
    var promotions: Bool
    
    init(
        pushEnabled: Bool = true,
        emailEnabled: Bool = true,
        smsEnabled: Bool = false,
        rideUpdates: Bool = true,
        promotions: Bool = false
    ) {
        self.pushEnabled = pushEnabled
        self.emailEnabled = emailEnabled
        self.smsEnabled = smsEnabled
        self.rideUpdates = rideUpdates
        self.promotions = promotions
    }
}

struct RidePreferences: Codable {
    var defaultRideType: RideType
    var preferredPaymentMethod: String
    var accessibilityNeeds: String?
    
    init(
        defaultRideType: RideType = .standard,
        preferredPaymentMethod: String = "credit_card",
        accessibilityNeeds: String? = nil
    ) {
        self.defaultRideType = defaultRideType
        self.preferredPaymentMethod = preferredPaymentMethod
        self.accessibilityNeeds = accessibilityNeeds
    }
}


