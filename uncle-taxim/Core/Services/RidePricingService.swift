import Foundation
import MapKit

/// Service for calculating ride pricing and duration estimates
class RidePricingService {
    
    private let locationService = LocationService()
    
    // MARK: - Pricing Constants
    
    struct PricingModel {
        let baseFare: Double        // Base fare in local currency
        let perKilometer: Double    // Cost per kilometer
        let perMinute: Double       // Cost per minute
        let minimumFare: Double     // Minimum fare
        
        static let standard = PricingModel(
            baseFare: 60.0,      // 60 TRY base fare
            perKilometer: 18.0,  // 18 TRY per km
            perMinute: 3.0,      // 3 TRY per minute
            minimumFare: 120.0   // 120 TRY minimum
        )
        
        static let premium = PricingModel(
            baseFare: 90.0,      // 90 TRY base fare
            perKilometer: 28.0,  // 28 TRY per km
            perMinute: 4.5,     // 4.5 TRY per minute
            minimumFare: 200.0   // 200 TRY minimum
        )
        
        static let shared = PricingModel(
            baseFare: 40.0,      // 40 TRY base fare
            perKilometer: 12.0, // 12 TRY per km
            perMinute: 2.0,      // 2 TRY per minute
            minimumFare: 80.0    // 80 TRY minimum
        )
    }
    
    // Average speed in km/h (accounts for city traffic)
    private let averageSpeedKmh: Double = 35.0
    
    // MARK: - Public Methods
    
    /// Calculates estimated price and duration for a ride
    /// - Parameters:
    ///   - distance: Distance in kilometers
    ///   - duration: Duration in minutes (if provided from MapKit, otherwise calculated)
    ///   - rideType: Type of ride (standard, premium, shared)
    /// - Returns: Tuple of (estimatedPrice, estimatedDuration in minutes)
    func calculateEstimate(distance: Double, duration: Int? = nil, rideType: RideType) -> (price: Double, duration: Int) {
        let model = pricingModel(for: rideType)
        
        // Use provided duration (from MapKit) or calculate based on distance
        let durationMinutes: Int
        if let providedDuration = duration {
            durationMinutes = providedDuration
        } else {
            // Calculate duration based on distance and average speed
            let durationHours = distance / averageSpeedKmh
            durationMinutes = Int(ceil(durationHours * 60.0))
        }
        
        // Calculate price: base fare + (distance * per km) + (duration * per minute)
        let distanceCost = distance * model.perKilometer
        let timeCost = Double(durationMinutes) * model.perMinute
        let totalPrice = model.baseFare + distanceCost + timeCost
        
        // Ensure minimum fare
        let finalPrice = max(totalPrice, model.minimumFare)
        
        return (price: finalPrice, duration: durationMinutes)
    }
    
    /// Calculates estimate from addresses using MapKit (with real distance and duration)
    /// - Parameters:
    ///   - pickup: Pickup address
    ///   - dropoff: Dropoff address
    ///   - waypoints: Optional array of intermediate stop addresses
    ///   - rideType: Type of ride
    /// - Returns: Tuple of (estimatedPrice, estimatedDuration in minutes, distance in km)
    func calculateEstimateFromAddresses(pickup: String?, dropoff: String, waypoints: [String] = [], rideType: RideType) async -> (price: Double, duration: Int, distance: Double) {
        // Try to get real distance and duration from MapKit
        do {
            if let route = try await locationService.geocodeAndCalculateRoute(
                pickupAddress: pickup,
                dropoffAddress: dropoff,
                waypointAddresses: waypoints
            ) {
                // Use real distance and duration from MapKit
                // The route.distance and route.duration already include waypoints
                // (calculated as sum of all segments: pickup -> waypoint1 -> waypoint2 -> ... -> dropoff)
                
                let (basePrice, duration) = calculateEstimate(
                    distance: route.distance,  // Distance already includes waypoints
                    duration: route.duration,  // Duration already includes waypoints
                    rideType: rideType
                )
                
                // Add a fixed fee per waypoint (40 TRY per waypoint)
                let waypointFee = Double(route.waypoints.count) * 40.0
                let finalPrice = basePrice + waypointFee
                
                print("🔍 [DEBUG] RidePricingService - Price calculated:")
                print("   - Base price: \(String(format: "%.2f", basePrice)) ₺")
                print("   - Waypoints: \(route.waypoints.count)")
                print("   - Waypoint fee: \(String(format: "%.2f", waypointFee)) ₺")
                print("   - Final price: \(String(format: "%.2f", finalPrice)) ₺")
                print("   - Distance: \(String(format: "%.2f", route.distance)) km")
                print("   - Duration: \(duration) minutes")
                
                // Return the actual route distance (which includes waypoints)
                return (price: finalPrice, duration: duration, distance: route.distance)
            }
        } catch {
            print("⚠️ [WARNING] RidePricingService - Failed to calculate route with waypoints: \(error)")
            // Fallback to heuristic if geocoding/route calculation fails
        }
        
        // Fallback to heuristic (doesn't account for waypoints)
        let distance = estimateDistanceHeuristic(pickup: pickup, dropoff: dropoff)
        let (price, duration) = calculateEstimate(distance: distance, rideType: rideType)
        // Add waypoint fee even in fallback (40 TRY per waypoint)
        let waypointFee = Double(waypoints.count) * 40.0
        return (price: price + waypointFee, duration: duration, distance: distance)
    }
    
    /// Estimates distance from address strings using MapKit (falls back to heuristic if geocoding fails)
    /// - Parameters:
    ///   - pickup: Pickup address
    ///   - dropoff: Dropoff address
    /// - Returns: Estimated distance in kilometers
    func estimateDistanceFromAddresses(pickup: String?, dropoff: String) async -> Double {
        // Try to use MapKit to get real distance and duration
        do {
            if let route = try await locationService.geocodeAndCalculateRoute(
                pickupAddress: pickup,
                dropoffAddress: dropoff
            ) {
                return route.distance
            }
        } catch {
            // Fallback to heuristic if MapKit fails
        }
        
        // Fallback to heuristic if MapKit fails
        return estimateDistanceHeuristic(pickup: pickup, dropoff: dropoff)
    }
    
    /// Heuristic distance estimation (fallback when MapKit is unavailable)
    private func estimateDistanceHeuristic(pickup: String?, dropoff: String) -> Double {
        let pickupLength = pickup?.count ?? 0
        let dropoffLength = dropoff.count
        
        // Base distance estimate (minimum 2km for any ride)
        var estimatedDistance: Double = 2.0
        
        // Add distance based on address complexity
        let addressComplexity = Double(pickupLength + dropoffLength) / 2.0
        estimatedDistance += addressComplexity * 0.1
        
        // Check for common distance indicators in addresses
        let combinedAddress = ((pickup ?? "") + " " + dropoff).lowercased()
        
        // Airport indicators (usually longer distances)
        if combinedAddress.contains("airport") {
            estimatedDistance += 15.0
        }
        
        // City center indicators
        if combinedAddress.contains("center") || combinedAddress.contains("downtown") {
            estimatedDistance += 5.0
        }
        
        // Highway/expressway indicators
        if combinedAddress.contains("highway") || combinedAddress.contains("expressway") {
            estimatedDistance += 8.0
        }
        
        // Common city names (inter-city travel)
        let cityNames = ["istanbul", "ankara", "izmir", "antalya", "bursa"]
        var cityCount = 0
        for city in cityNames {
            if combinedAddress.contains(city) {
                cityCount += 1
            }
        }
        if cityCount >= 2 {
            // Different cities mentioned - likely longer distance
            estimatedDistance += 20.0
        }
        
        // Cap at reasonable maximum (50km for estimation purposes)
        return min(estimatedDistance, 50.0)
    }
    
    /// Estimates distance from coordinates (when available)
    /// - Parameters:
    ///   - pickup: Pickup location
    ///   - dropoff: Dropoff location
    /// - Returns: Distance in kilometers, or nil if coordinates are invalid
    func estimateDistanceFromCoordinates(pickup: LocationWithAddress, dropoff: LocationWithAddress) -> Double? {
        // Check if coordinates are valid (not placeholder 0.0, 0.0)
        let pickupValid = pickup.latitude != 0.0 || pickup.longitude != 0.0
        let dropoffValid = dropoff.latitude != 0.0 || dropoff.longitude != 0.0
        
        guard pickupValid && dropoffValid else {
            return nil
        }
        
        return CoordinateCalculator.calculateDistance(from: pickup, to: dropoff)
    }
    
    // MARK: - Private Methods
    
    private func pricingModel(for rideType: RideType) -> PricingModel {
        switch rideType {
        case .premium:
            return .premium
        case .shared:
            return .shared
        case .standard:
            return .standard
        }
    }
}

