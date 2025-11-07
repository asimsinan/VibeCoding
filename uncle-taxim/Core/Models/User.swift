import Foundation
import FirebaseFirestore

struct User: Codable, Identifiable, FirestoreCodable {
    @DocumentID var id: String?
    var email: String
    var phoneNumber: String
    var fullName: String
    var profileImageUrl: String?
    var createdAt: Date
    var updatedAt: Date
    var isActive: Bool
    var preferences: UserBasicPreferences
    var userPreferencesId: String?
    
    enum CodingKeys: String, CodingKey {
        // Note: 'id' is excluded - @DocumentID is managed by Firestore
        case email
        case phoneNumber
        case fullName
        case profileImageUrl
        case createdAt
        case updatedAt
        case isActive
        case preferences
        case userPreferencesId
    }
    
    init(
        id: String? = nil,
        email: String,
        phoneNumber: String,
        fullName: String,
        profileImageUrl: String? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        isActive: Bool = true,
        preferences: UserBasicPreferences = UserBasicPreferences(),
        userPreferencesId: String? = nil
    ) {
        self.id = id
        self.email = email
        self.phoneNumber = phoneNumber
        self.fullName = fullName
        self.profileImageUrl = profileImageUrl
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.isActive = isActive
        self.preferences = preferences
        self.userPreferencesId = userPreferencesId
    }
    
    // Validation rules
    func validate() throws {
        guard !email.isEmpty else {
            throw ValidationError.invalidEmail("Email cannot be empty")
        }
        guard email.contains("@") && email.contains(".") else {
            throw ValidationError.invalidEmail("Invalid email format")
        }
        guard !phoneNumber.isEmpty else {
            throw ValidationError.invalidPhoneNumber("Phone number cannot be empty")
        }
        guard !fullName.isEmpty else {
            throw ValidationError.invalidName("Full name cannot be empty")
        }
    }
    
    // Business logic methods
    func isEligibleForRide() -> Bool {
        return isActive && !email.isEmpty && !phoneNumber.isEmpty
    }
    
    mutating func updateProfile(name: String?, phone: String?) {
        if let name = name, !name.isEmpty {
            self.fullName = name
        }
        if let phone = phone, !phone.isEmpty {
            self.phoneNumber = phone
        }
        self.updatedAt = Date()
    }
}

struct UserBasicPreferences: Codable {
    var language: String
    var currency: String
    var notificationEnabled: Bool
    
    init(language: String = "en", currency: String = "USD", notificationEnabled: Bool = true) {
        self.language = language
        self.currency = currency
        self.notificationEnabled = notificationEnabled
    }
}


