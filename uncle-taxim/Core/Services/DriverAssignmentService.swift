import Foundation
import CoreLocation

/// Service for assigning drivers to rides based on availability, proximity, and rating
class DriverAssignmentService {
    private let dataService: FirebaseDataService
    
    init(dataService: FirebaseDataService = FirebaseDataService()) {
        self.dataService = dataService
    }
    
    /// Assigns the best available driver to a ride
    /// - Parameters:
    ///   - ride: The ride to assign a driver to
    ///   - pickupLocation: The pickup location for calculating proximity
    /// - Returns: The assigned driver ID, or nil if no driver is available
    func assignBestDriver(to ride: Ride, pickupLocation: LocationWithAddress) async throws -> String? {
        
        // Get all available drivers
        let availableDrivers = try await dataService.getAvailableDrivers()
        
        guard !availableDrivers.isEmpty else {
            return nil
        }
        
        
        // Filter drivers that can accept rides (rating >= 4.0)
        let eligibleDrivers = availableDrivers.filter { driver in
            driver.canAcceptRide()
        }
        
        guard !eligibleDrivers.isEmpty else {
            return nil
        }
        
        
        // Score and rank drivers based on:
        // 1. Rating (higher is better)
        // 2. Proximity to pickup (closer is better)
        // 3. Total rides (more experience is better)
        let scoredDrivers = eligibleDrivers.map { driver -> (driver: Driver, score: Double) in
            var score = 0.0
            
            // Rating score (0-5, weighted 40%)
            let ratingScore = (driver.rating / 5.0) * 0.4
            score += ratingScore
            
            // Proximity score (0-1, weighted 40%)
            let proximityScore = calculateProximityScore(
                driverLocation: driver.currentLocation,
                pickupLocation: pickupLocation
            ) * 0.4
            score += proximityScore
            
            // Experience score (0-1, weighted 20%)
            // Normalize total rides (assume max 1000 rides = 1.0)
            let experienceScore = min(Double(driver.totalRides) / 1000.0, 1.0) * 0.2
            score += experienceScore
            
            return (driver: driver, score: score)
        }
        
        // Sort by score (highest first)
        let sortedDrivers = scoredDrivers.sorted { $0.score > $1.score }
        
        guard let bestDriver = sortedDrivers.first?.driver,
              let driverId = bestDriver.id else {
            return nil
        }
        
        
        return driverId
    }
    
    /// Calculates proximity score based on distance to pickup location
    /// - Parameters:
    ///   - driverLocation: Driver's current location
    ///   - pickupLocation: Ride pickup location
    /// - Returns: Score from 0.0 (far) to 1.0 (very close)
    private func calculateProximityScore(
        driverLocation: Location?,
        pickupLocation: LocationWithAddress
    ) -> Double {
        guard let driverLoc = driverLocation else {
            // If driver location is unknown, give medium score
            return 0.5
        }
        
        // Calculate distance in kilometers
        let distance = CoordinateCalculator.calculateDistance(
            from: LocationWithAddress(
                latitude: driverLoc.latitude,
                longitude: driverLoc.longitude,
                address: ""
            ),
            to: pickupLocation
        )
        
        // Score based on distance:
        // 0-2 km: 1.0 (very close)
        // 2-5 km: 0.8 (close)
        // 5-10 km: 0.6 (moderate)
        // 10-20 km: 0.4 (far)
        // 20+ km: 0.2 (very far)
        if distance <= 2.0 {
            return 1.0
        } else if distance <= 5.0 {
            return 0.8
        } else if distance <= 10.0 {
            return 0.6
        } else if distance <= 20.0 {
            return 0.4
        } else {
            return 0.2
        }
    }
}

