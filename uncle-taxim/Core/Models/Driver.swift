import Foundation
import FirebaseFirestore

struct Driver: Codable, Identifiable, FirestoreCodable {
    @DocumentID var id: String?
    var email: String
    var phoneNumber: String
    var fullName: String
    var licenseNumber: String
    var vehicleInfo: VehicleInfo
    var profileImageUrl: String?
    var rating: Double
    var totalRides: Int
    var isAvailable: Bool
    var currentLocation: Location?
    var createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case phoneNumber
        case fullName
        case licenseNumber
        case vehicleInfo
        case profileImageUrl
        case rating
        case totalRides
        case isAvailable
        case currentLocation
        case createdAt
        case updatedAt
    }
    
    init(
        id: String? = nil,
        email: String,
        phoneNumber: String,
        fullName: String,
        licenseNumber: String,
        vehicleInfo: VehicleInfo,
        profileImageUrl: String? = nil,
        rating: Double = 0.0,
        totalRides: Int = 0,
        isAvailable: Bool = false,
        currentLocation: Location? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.email = email
        self.phoneNumber = phoneNumber
        self.fullName = fullName
        self.licenseNumber = licenseNumber
        self.vehicleInfo = vehicleInfo
        self.profileImageUrl = profileImageUrl
        self.rating = rating
        self.totalRides = totalRides
        self.isAvailable = isAvailable
        self.currentLocation = currentLocation
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    // Validation rules
    func validate() throws {
        guard !email.isEmpty else {
            throw ValidationError.invalidEmail("Email cannot be empty")
        }
        guard email.contains("@") && email.contains(".") else {
            throw ValidationError.invalidEmail("Invalid email format")
        }
        guard !licenseNumber.isEmpty else {
            throw ValidationError.invalidLicenseNumber("License number cannot be empty")
        }
        guard rating >= 0.0 && rating <= 5.0 else {
            throw ValidationError.invalidRating("Rating must be between 0.0 and 5.0")
        }
    }
    
    // Business logic methods
    func canAcceptRide() -> Bool {
        return isAvailable && rating >= 4.0
    }
    
    mutating func updateLocation(latitude: Double, longitude: Double) {
        self.currentLocation = Location(latitude: latitude, longitude: longitude, timestamp: Date())
        self.updatedAt = Date()
    }
    
    mutating func updateAvailability(_ available: Bool) {
        self.isAvailable = available
        self.updatedAt = Date()
    }
}

struct VehicleInfo: Codable {
    var make: String
    var model: String
    var year: Int
    var licensePlate: String
    var color: String
    var fuelType: String? // "electric", "hybrid", "gasoline", "diesel"
    
    init(
        make: String,
        model: String,
        year: Int,
        licensePlate: String,
        color: String,
        fuelType: String? = nil
    ) {
        self.make = make
        self.model = model
        self.year = year
        self.licensePlate = licensePlate
        self.color = color
        self.fuelType = fuelType
    }
}

struct Location: Codable {
    var latitude: Double
    var longitude: Double
    var timestamp: Date
    
    init(latitude: Double, longitude: Double, timestamp: Date = Date()) {
        self.latitude = latitude
        self.longitude = longitude
        self.timestamp = timestamp
    }
}


