import Foundation
import FirebaseFirestore

struct Ride: Codable, Identifiable, FirestoreCodable {
    @DocumentID var id: String?
    var userId: String
    var driverId: String?
    var driverName: String? // Cached driver name to avoid fetching every time
    var status: RideStatus
    var pickupLocation: LocationWithAddress
    var dropoffLocation: LocationWithAddress
    var waypoints: [LocationWithAddress] // Intermediate stops between pickup and dropoff
    var scheduledTime: Date?
    var actualPickupTime: Date?
    var actualDropoffTime: Date?
    var estimatedPrice: Double
    var actualPrice: Double?
    var estimatedDuration: Int // minutes
    var actualDuration: Int? // minutes
    var estimatedDistance: Double // kilometers
    var actualDistance: Double? // kilometers
    var rideType: RideType
    var paymentMethodId: String?
    var createdAt: Date
    var updatedAt: Date
    var rideSuggestionId: String?
    var tripSummaryId: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId
        case driverId
        case driverName
        case status
        case pickupLocation
        case dropoffLocation
        case waypoints
        case scheduledTime
        case actualPickupTime
        case actualDropoffTime
        case estimatedPrice
        case actualPrice
        case estimatedDuration
        case actualDuration
        case estimatedDistance
        case actualDistance
        case rideType
        case paymentMethodId
        case createdAt
        case updatedAt
        case rideSuggestionId
        case tripSummaryId
    }
    
    // Custom decoder to handle missing fields for backward compatibility
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try? container.decode(String.self, forKey: .id)
        userId = try container.decode(String.self, forKey: .userId)
        driverId = try? container.decode(String.self, forKey: .driverId)
        driverName = try? container.decode(String.self, forKey: .driverName)
        status = try container.decode(RideStatus.self, forKey: .status)
        pickupLocation = try container.decode(LocationWithAddress.self, forKey: .pickupLocation)
        dropoffLocation = try container.decode(LocationWithAddress.self, forKey: .dropoffLocation)
        
        // Handle missing waypoints field (for backward compatibility with old rides)
        waypoints = (try? container.decode([LocationWithAddress].self, forKey: .waypoints)) ?? []
        
        scheduledTime = try? container.decode(Date.self, forKey: .scheduledTime)
        actualPickupTime = try? container.decode(Date.self, forKey: .actualPickupTime)
        actualDropoffTime = try? container.decode(Date.self, forKey: .actualDropoffTime)
        estimatedPrice = try container.decode(Double.self, forKey: .estimatedPrice)
        actualPrice = try? container.decode(Double.self, forKey: .actualPrice)
        estimatedDuration = try container.decode(Int.self, forKey: .estimatedDuration)
        actualDuration = try? container.decode(Int.self, forKey: .actualDuration)
        
        // Handle missing estimatedDistance field (for backward compatibility)
        estimatedDistance = (try? container.decode(Double.self, forKey: .estimatedDistance)) ?? 0.0
        
        actualDistance = try? container.decode(Double.self, forKey: .actualDistance)
        rideType = try container.decode(RideType.self, forKey: .rideType)
        paymentMethodId = try? container.decode(String.self, forKey: .paymentMethodId)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
        updatedAt = try container.decode(Date.self, forKey: .updatedAt)
        rideSuggestionId = try? container.decode(String.self, forKey: .rideSuggestionId)
        tripSummaryId = try? container.decode(String.self, forKey: .tripSummaryId)
    }
    
    init(
        id: String? = nil,
        userId: String,
        driverId: String? = nil,
        driverName: String? = nil,
        status: RideStatus = .pending,
        pickupLocation: LocationWithAddress,
        dropoffLocation: LocationWithAddress,
        waypoints: [LocationWithAddress] = [],
        scheduledTime: Date? = nil,
        actualPickupTime: Date? = nil,
        actualDropoffTime: Date? = nil,
        estimatedPrice: Double,
        actualPrice: Double? = nil,
        estimatedDuration: Int,
        actualDuration: Int? = nil,
        estimatedDistance: Double,
        actualDistance: Double? = nil,
        rideType: RideType = .standard,
        paymentMethodId: String? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        rideSuggestionId: String? = nil,
        tripSummaryId: String? = nil
    ) {
        self.id = id
        self.userId = userId
        self.driverId = driverId
        self.driverName = driverName
        self.status = status
        self.pickupLocation = pickupLocation
        self.dropoffLocation = dropoffLocation
        self.waypoints = waypoints
        self.scheduledTime = scheduledTime
        self.actualPickupTime = actualPickupTime
        self.actualDropoffTime = actualDropoffTime
        self.estimatedPrice = estimatedPrice
        self.actualPrice = actualPrice
        self.estimatedDuration = estimatedDuration
        self.actualDuration = actualDuration
        self.estimatedDistance = estimatedDistance
        self.actualDistance = actualDistance
        self.rideType = rideType
        self.paymentMethodId = paymentMethodId
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.rideSuggestionId = rideSuggestionId
        self.tripSummaryId = tripSummaryId
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
    }
    
    // Business logic methods
    func canBeCancelled() -> Bool {
        return status == .pending || status == .accepted
    }
    
    func isCompleted() -> Bool {
        return status == .completed
    }
    
    mutating func accept(driverId: String, driverName: String? = nil) throws {
        guard status == .pending else {
            throw RideError.invalidStatusTransition("Can only accept pending rides")
        }
        self.driverId = driverId
        self.driverName = driverName
        self.status = .accepted
        self.updatedAt = Date()
    }
    
    mutating func start() throws {
        guard status == .accepted else {
            throw RideError.invalidStatusTransition("Can only start accepted rides")
        }
        self.status = .inProgress
        self.actualPickupTime = Date()
        self.updatedAt = Date()
    }
    
    mutating func complete(actualPrice: Double, actualDuration: Int, actualDistance: Double? = nil) throws {
        guard status == .inProgress else {
            throw RideError.invalidStatusTransition("Can only complete rides in progress")
        }
        self.status = .completed
        self.actualPrice = actualPrice
        self.actualDuration = actualDuration
        if let distance = actualDistance {
            self.actualDistance = distance
        }
        self.actualDropoffTime = Date()
        self.updatedAt = Date()
    }
    
    mutating func cancel() throws {
        guard canBeCancelled() else {
            throw RideError.invalidStatusTransition("Cannot cancel ride in current status")
        }
        self.status = .cancelled
        self.updatedAt = Date()
    }
}

enum RideStatus: String, Codable {
    case pending = "pending"
    case accepted = "accepted"
    case inProgress = "in_progress"
    case completed = "completed"
    case cancelled = "cancelled"
    
    /// Returns a formatted display name with underscores replaced by spaces and proper capitalization
    var displayName: String {
        return rawValue.replacingOccurrences(of: "_", with: " ").capitalized
    }
}

enum RideType: String, Codable {
    case standard = "standard"
    case premium = "premium"
    case shared = "shared"
}

struct LocationWithAddress: Codable {
    var latitude: Double
    var longitude: Double
    var address: String
    
    init(latitude: Double, longitude: Double, address: String) {
        self.latitude = latitude
        self.longitude = longitude
        self.address = address
    }
}

enum RideError: Error {
    case invalidStatusTransition(String)
}

