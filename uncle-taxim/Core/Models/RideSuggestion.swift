import Foundation
import FirebaseFirestore

struct RideSuggestion: Codable, Identifiable, FirestoreCodable {
    @DocumentID var id: String?
    var userId: String
    var pickupLocation: LocationWithAddress
    var dropoffLocation: LocationWithAddress
    var waypoints: [LocationWithAddress] // Intermediate stops between pickup and dropoff
    var estimatedPrice: Double
    var estimatedDuration: Int // minutes
    var estimatedDistance: Double // kilometers
    var rideType: RideType
    var suggestedDrivers: [SuggestedDriver]
    var source: SuggestionSource
    var createdAt: Date
    var expiresAt: Date
    var isAccepted: Bool
    var acceptedRideId: String?
    
    enum CodingKeys: String, CodingKey {
        // Note: 'id' is excluded - @DocumentID is managed by Firestore
        case userId
        case pickupLocation
        case dropoffLocation
        case waypoints
        case estimatedPrice
        case estimatedDuration
        case estimatedDistance
        case rideType
        case suggestedDrivers
        case source
        case createdAt
        case expiresAt
        case isAccepted
        case acceptedRideId
    }
    
    // Custom decoder to handle missing fields for backward compatibility
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        userId = try container.decode(String.self, forKey: .userId)
        pickupLocation = try container.decode(LocationWithAddress.self, forKey: .pickupLocation)
        dropoffLocation = try container.decode(LocationWithAddress.self, forKey: .dropoffLocation)
        
        // Handle missing waypoints field (for backward compatibility with old suggestions)
        waypoints = (try? container.decode([LocationWithAddress].self, forKey: .waypoints)) ?? []
        
        estimatedPrice = try container.decode(Double.self, forKey: .estimatedPrice)
        estimatedDuration = try container.decode(Int.self, forKey: .estimatedDuration)
        
        // Handle missing estimatedDistance field (for backward compatibility)
        estimatedDistance = (try? container.decode(Double.self, forKey: .estimatedDistance)) ?? 0.0
        
        rideType = try container.decode(RideType.self, forKey: .rideType)
        suggestedDrivers = (try? container.decode([SuggestedDriver].self, forKey: .suggestedDrivers)) ?? []
        source = try container.decode(SuggestionSource.self, forKey: .source)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
        expiresAt = try container.decode(Date.self, forKey: .expiresAt)
        isAccepted = (try? container.decode(Bool.self, forKey: .isAccepted)) ?? false
        acceptedRideId = try? container.decode(String.self, forKey: .acceptedRideId)
    }
    
    init(
        id: String? = nil,
        userId: String,
        pickupLocation: LocationWithAddress,
        dropoffLocation: LocationWithAddress,
        waypoints: [LocationWithAddress] = [],
        estimatedPrice: Double,
        estimatedDuration: Int,
        estimatedDistance: Double,
        rideType: RideType = .standard,
        suggestedDrivers: [SuggestedDriver] = [],
        source: SuggestionSource,
        createdAt: Date = Date(),
        expiresAt: Date,
        isAccepted: Bool = false,
        acceptedRideId: String? = nil
    ) {
        // Only set id if provided (for reading from Firestore)
        // When writing, Firestore will generate the ID automatically
        self.id = id
        self.userId = userId
        self.pickupLocation = pickupLocation
        self.dropoffLocation = dropoffLocation
        self.waypoints = waypoints
        self.estimatedPrice = estimatedPrice
        self.estimatedDuration = estimatedDuration
        self.estimatedDistance = estimatedDistance
        self.rideType = rideType
        self.suggestedDrivers = suggestedDrivers
        self.source = source
        self.createdAt = createdAt
        self.expiresAt = expiresAt
        self.isAccepted = isAccepted
        self.acceptedRideId = acceptedRideId
    }
    
    // Validation rules
    func validate() throws {
        guard !userId.isEmpty else {
            throw ValidationError.invalidUserId("User ID cannot be empty")
        }
        guard estimatedPrice >= 0 else {
            throw ValidationError.invalidPrice("Estimated price cannot be negative")
        }
        guard estimatedDuration > 0 else {
            throw ValidationError.invalidDuration("Estimated duration must be positive")
        }
        guard expiresAt > createdAt else {
            throw ValidationError.invalidExpiration("Expiration time must be after creation time")
        }
    }
    
    // Business logic methods
    func isExpired() -> Bool {
        return Date() > expiresAt
    }
    
    func canBeAccepted() -> Bool {
        return !isAccepted && !isExpired()
    }
    
    mutating func accept(rideId: String) throws {
        guard canBeAccepted() else {
            throw RideSuggestionError.cannotAccept("Suggestion is expired or already accepted")
        }
        self.isAccepted = true
        self.acceptedRideId = rideId
    }
    
    // Computed property for unique identification in ForEach
    // Uses Firestore ID if available, otherwise generates a unique ID based on content
    var uniqueId: String {
        if let id = id, !id.isEmpty {
            return id
        }
        // Generate a unique ID based on content for items not yet saved to Firestore
        let contentHash = "\(userId)-\(pickupLocation.address)-\(dropoffLocation.address)-\(createdAt.timeIntervalSince1970)"
        return contentHash
    }
}

struct SuggestedDriver: Codable {
    var driverId: String
    var estimatedArrivalTime: Int // minutes
    var distance: Double // km
    
    init(driverId: String, estimatedArrivalTime: Int, distance: Double) {
        self.driverId = driverId
        self.estimatedArrivalTime = estimatedArrivalTime
        self.distance = distance
    }
}

enum SuggestionSource: String, Codable {
    case voice = "voice"
    case chat = "chat"
    case manual = "manual"
}

enum RideSuggestionError: Error {
    case cannotAccept(String)
}

