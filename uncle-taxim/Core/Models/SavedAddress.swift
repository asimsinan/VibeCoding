import Foundation
import FirebaseFirestore
import CoreLocation

struct SavedAddress: Codable, Identifiable, FirestoreCodable {
    @DocumentID var id: String?
    var userId: String
    var name: String // e.g., "Home", "Work"
    var address: String
    var latitude: Double
    var longitude: Double
    var isDefault: Bool // For quick access
    var createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId
        case name
        case address
        case latitude
        case longitude
        case isDefault
        case createdAt
        case updatedAt
    }
    
    init(
        id: String? = nil,
        userId: String,
        name: String,
        address: String,
        latitude: Double,
        longitude: Double,
        isDefault: Bool = false,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.userId = userId
        self.name = name
        self.address = address
        self.latitude = latitude
        self.longitude = longitude
        self.isDefault = isDefault
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    /// Convert to LocationWithAddress for use in ride booking
    func toLocationWithAddress() -> LocationWithAddress {
        return LocationWithAddress(
            latitude: latitude,
            longitude: longitude,
            address: address
        )
    }
    
    /// Create from LocationWithAddress
    static func from(location: LocationWithAddress, userId: String, name: String, isDefault: Bool = false) -> SavedAddress {
        return SavedAddress(
            userId: userId,
            name: name,
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
            isDefault: isDefault
        )
    }
    
    // MARK: - FirestoreCodable Conformance
    
    func validate() throws {
        guard !userId.isEmpty else {
            throw ValidationError.invalidValue("User ID cannot be empty")
        }
        guard !name.isEmpty else {
            throw ValidationError.invalidValue("Address name cannot be empty")
        }
        guard !address.isEmpty else {
            throw ValidationError.invalidValue("Address cannot be empty")
        }
        guard latitude >= -90 && latitude <= 90 else {
            throw ValidationError.invalidValue("Latitude must be between -90 and 90")
        }
        guard longitude >= -180 && longitude <= 180 else {
            throw ValidationError.invalidValue("Longitude must be between -180 and 180")
        }
    }
}

