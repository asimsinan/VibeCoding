import Foundation
import FirebaseFirestore

struct TripSummary: Codable, Identifiable, FirestoreCodable {
    @DocumentID var id: String?
    var rideId: String
    var userId: String
    var driverId: String
    var tripSummary: TripDetails
    var userRating: Double?
    var driverRating: Double?
    var userFeedback: String?
    var driverFeedback: String?
    var createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case rideId
        case userId
        case driverId
        case tripSummary
        case userRating
        case driverRating
        case userFeedback
        case driverFeedback
        case createdAt
    }
    
    init(
        id: String? = nil,
        rideId: String,
        userId: String,
        driverId: String,
        tripSummary: TripDetails,
        userRating: Double? = nil,
        driverRating: Double? = nil,
        userFeedback: String? = nil,
        driverFeedback: String? = nil,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.rideId = rideId
        self.userId = userId
        self.driverId = driverId
        self.tripSummary = tripSummary
        self.userRating = userRating
        self.driverRating = driverRating
        self.userFeedback = userFeedback
        self.createdAt = createdAt
    }
    
    // Validation rules
    func validate() throws {
        guard !rideId.isEmpty else {
            throw ValidationError.invalidRideId("Ride ID cannot be empty")
        }
        guard !userId.isEmpty else {
            throw ValidationError.invalidUserId("User ID cannot be empty")
        }
        guard !driverId.isEmpty else {
            throw ValidationError.invalidDriverId("Driver ID cannot be empty")
        }
        if let userRating = userRating {
            guard userRating >= 0.0 && userRating <= 5.0 else {
                throw ValidationError.invalidRating("User rating must be between 0.0 and 5.0")
            }
        }
        if let driverRating = driverRating {
            guard driverRating >= 0.0 && driverRating <= 5.0 else {
                throw ValidationError.invalidRating("Driver rating must be between 0.0 and 5.0")
            }
        }
    }
    
    // Business logic methods
    func hasRatings() -> Bool {
        return userRating != nil || driverRating != nil
    }
    
    mutating func addUserRating(_ rating: Double, feedback: String? = nil) throws {
        guard rating >= 0.0 && rating <= 5.0 else {
            throw ValidationError.invalidRating("Rating must be between 0.0 and 5.0")
        }
        self.userRating = rating
        if let feedback = feedback {
            self.userFeedback = feedback
        }
    }
    
    mutating func addDriverRating(_ rating: Double, feedback: String? = nil) throws {
        guard rating >= 0.0 && rating <= 5.0 else {
            throw ValidationError.invalidRating("Rating must be between 0.0 and 5.0")
        }
        self.driverRating = rating
        if let feedback = feedback {
            self.driverFeedback = feedback
        }
    }
}

struct TripDetails: Codable {
    var totalDistance: Double // km
    var totalDuration: Int // minutes
    var totalCost: Double
    var pickupLocation: String
    var dropoffLocation: String
    var route: [RoutePoint]
    var stops: [Stop]
    var co2Footprint: Double? // kg CO₂ emissions
    var rideType: RideType? // Store ride type for CO₂ calculation
    
    init(
        totalDistance: Double,
        totalDuration: Int,
        totalCost: Double,
        pickupLocation: String,
        dropoffLocation: String,
        route: [RoutePoint] = [],
        stops: [Stop] = [],
        co2Footprint: Double? = nil,
        rideType: RideType? = nil
    ) {
        self.totalDistance = totalDistance
        self.totalDuration = totalDuration
        self.totalCost = totalCost
        self.pickupLocation = pickupLocation
        self.dropoffLocation = dropoffLocation
        self.route = route
        self.stops = stops
        self.co2Footprint = co2Footprint
        self.rideType = rideType
    }
    
    /// Returns CO₂ footprint, calculating it if missing
    var calculatedCO2Footprint: Double? {
        if let existing = co2Footprint {
            return existing
        }
        
        // Calculate on-the-fly if missing
        guard let rideType = rideType else {
            return nil
        }
        
        let calculator = CO2Calculator()
        return calculator.calculateEmissions(distance: totalDistance, rideType: rideType)
    }
}

struct RoutePoint: Codable {
    var latitude: Double
    var longitude: Double
    var timestamp: Date
    
    init(latitude: Double, longitude: Double, timestamp: Date) {
        self.latitude = latitude
        self.longitude = longitude
        self.timestamp = timestamp
    }
}

struct Stop: Codable {
    var location: LocationWithAddress
    var timestamp: Date
    
    init(location: LocationWithAddress, timestamp: Date) {
        self.location = location
        self.timestamp = timestamp
    }
}


