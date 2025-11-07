import Foundation

protocol TripSummaryServiceProtocol {
    func generateTripSummary(rideId: String, userId: String, driverId: String) async throws -> TripSummary
    func calculateCO2Emissions(distance: Double, rideType: RideType) -> Double
    func getTravelTimeRecommendations(currentTime: Date) -> [Date]
}

class TripSummaryService: TripSummaryServiceProtocol {
    private let dataService: FirebaseDataService
    private let co2Calculator: CO2Calculator
    private let timeRecommendationEngine: TimeRecommendationEngine
    
    init(dataService: FirebaseDataService, co2Calculator: CO2Calculator? = nil, timeRecommendationEngine: TimeRecommendationEngine? = nil) {
        self.dataService = dataService
        self.co2Calculator = co2Calculator ?? CO2Calculator()
        self.timeRecommendationEngine = timeRecommendationEngine ?? TimeRecommendationEngine()
    }
    
    /// Generates trip summary from completed ride
    func generateTripSummary(rideId: String, userId: String, driverId: String) async throws -> TripSummary {
        try validateInput(rideId: rideId, userId: userId, driverId: driverId)
        
        guard let ride = try await dataService.getRide(rideId: rideId) else {
            throw TripSummaryError.rideNotFound("Ride not found")
        }
        
        let tripDetails = try await buildTripDetails(from: ride, driverId: driverId)
        
        return TripSummary(
            rideId: rideId,
            userId: userId,
            driverId: driverId,
            tripSummary: tripDetails
        )
    }
    
    /// Calculates CO₂ emissions for a trip
    func calculateCO2Emissions(distance: Double, rideType: RideType) -> Double {
        return co2Calculator.calculateEmissions(distance: distance, rideType: rideType)
    }
    
    /// Gets travel time recommendations based on current time
    func getTravelTimeRecommendations(currentTime: Date) -> [Date] {
        return timeRecommendationEngine.getRecommendations(currentTime: currentTime)
    }
    
    // MARK: - Private Methods
    
    private func validateInput(rideId: String, userId: String, driverId: String) throws {
        guard !rideId.isEmpty else {
            throw TripSummaryError.invalidRideId("Ride ID cannot be empty")
        }
        guard !userId.isEmpty else {
            throw TripSummaryError.invalidUserId("User ID cannot be empty")
        }
        guard !driverId.isEmpty else {
            throw TripSummaryError.invalidDriverId("Driver ID cannot be empty")
        }
    }
    
    private func buildTripDetails(from ride: Ride, driverId: String) async throws -> TripDetails {
        let distance = CoordinateCalculator.calculateDistance(
            from: ride.pickupLocation,
            to: ride.dropoffLocation
        )
        
        let duration = ride.actualDuration ?? ride.estimatedDuration
        let cost = ride.actualPrice ?? ride.estimatedPrice
        
        // Calculate CO₂ footprint with enhanced factors
        // Estimate traffic condition based on actual/estimated duration
        let trafficCondition = co2Calculator.estimateTrafficCondition(
            distance: distance,
            duration: duration
        )
        
        // Fetch driver info to get vehicle fuel type
        var vehicleFuelType: VehicleFuelType? = nil
        if let driver = try? await dataService.getDriver(driverId: driverId),
           let fuelTypeString = driver.vehicleInfo.fuelType {
            vehicleFuelType = VehicleFuelType(rawValue: fuelTypeString.lowercased())
        }
        
        let co2Footprint = co2Calculator.calculateEmissions(
            distance: distance,
            rideType: ride.rideType,
            vehicleFuelType: vehicleFuelType,
            trafficCondition: trafficCondition
        )
        
        return TripDetails(
            totalDistance: distance,
            totalDuration: duration,
            totalCost: cost,
            pickupLocation: ride.pickupLocation.address,
            dropoffLocation: ride.dropoffLocation.address,
            route: [],
            stops: [],
            co2Footprint: co2Footprint,
            rideType: ride.rideType
        )
    }
}

// MARK: - CO₂ Calculator

/// Vehicle fuel type for CO₂ calculation
enum VehicleFuelType: String, Codable {
    case electric = "electric"
    case hybrid = "hybrid"
    case gasoline = "gasoline"
    case diesel = "diesel"
    case unknown = "unknown"
}

/// Enhanced CO₂ Calculator with EPA/European standards
class CO2Calculator {
    // MARK: - Emission Factors (kg CO₂ per km)
    // Based on EPA 2023 data and European Environment Agency standards
    
    // Base emission factors by vehicle fuel type (well-to-wheel)
    private let fuelTypeFactors: [VehicleFuelType: Double] = [
        .electric: 0.05,      // Grid average (varies by region, but using average)
        .hybrid: 0.10,        // Hybrid vehicles (gasoline-electric)
        .gasoline: 0.17,       // Average gasoline vehicle (EPA 2023)
        .diesel: 0.15,        // Average diesel vehicle
        .unknown: 0.17        // Default to gasoline average
    ]
    
    // Ride type multipliers (account for vehicle size/class)
    private let rideTypeMultipliers: [RideType: Double] = [
        .standard: 1.0,       // Standard sedan/compact
        .premium: 1.3,        // Larger vehicles (SUVs, luxury cars)
        .shared: 0.4          // Shared rides (emissions split among passengers)
    ]
    
    // Traffic condition multipliers
    private let trafficMultipliers: [String: Double] = [
        "light": 0.9,         // Light traffic (10% reduction)
        "normal": 1.0,        // Normal traffic
        "heavy": 1.2,         // Heavy traffic (20% increase)
        "congested": 1.4      // Congested traffic (40% increase)
    ]
    
    /// Calculate CO₂ emissions with enhanced factors
    /// - Parameters:
    ///   - distance: Distance in kilometers
    ///   - rideType: Type of ride (standard, premium, shared)
    ///   - vehicleFuelType: Fuel type of the vehicle (optional, defaults to gasoline)
    ///   - trafficCondition: Traffic condition (optional, defaults to normal)
    /// - Returns: CO₂ emissions in kg
    func calculateEmissions(
        distance: Double,
        rideType: RideType,
        vehicleFuelType: VehicleFuelType? = nil,
        trafficCondition: String? = nil
    ) -> Double {
        // Determine fuel type (default to gasoline if unknown)
        let fuelType = vehicleFuelType ?? .unknown
        
        // Get base emission factor for fuel type
        let baseFactor = fuelTypeFactors[fuelType] ?? fuelTypeFactors[.unknown]!
        
        // Apply ride type multiplier
        let rideMultiplier = rideTypeMultipliers[rideType] ?? 1.0
        
        // Apply traffic condition multiplier
        let trafficMultiplier = trafficMultipliers[trafficCondition ?? "normal"] ?? 1.0
        
        // Calculate: distance × base factor × ride multiplier × traffic multiplier
        let emissions = distance * baseFactor * rideMultiplier * trafficMultiplier
        
        return round(emissions * 100) / 100 // Round to 2 decimal places
    }
    
    /// Legacy method for backward compatibility
    func calculateEmissions(distance: Double, rideType: RideType) -> Double {
        return calculateEmissions(
            distance: distance,
            rideType: rideType,
            vehicleFuelType: nil,
            trafficCondition: nil
        )
    }
    
    /// Estimate traffic condition based on duration and distance
    /// - Parameters:
    ///   - distance: Distance in km
    ///   - duration: Duration in minutes
    /// - Returns: Estimated traffic condition
    func estimateTrafficCondition(distance: Double, duration: Int) -> String {
        guard distance > 0 else { return "normal" }
        
        // Average speed in km/h
        let speed = (distance / Double(duration)) * 60
        
        // Estimate traffic based on average speed
        if speed < 20 {
            return "congested"  // Very slow (< 20 km/h)
        } else if speed < 40 {
            return "heavy"      // Slow (20-40 km/h)
        } else if speed > 60 {
            return "light"      // Fast (> 60 km/h)
        } else {
            return "normal"    // Normal (40-60 km/h)
        }
    }
    
    /// Get emission factor breakdown for transparency
    func getEmissionBreakdown(
        distance: Double,
        rideType: RideType,
        vehicleFuelType: VehicleFuelType? = nil,
        trafficCondition: String? = nil
    ) -> (baseFactor: Double, rideMultiplier: Double, trafficMultiplier: Double, total: Double) {
        let fuelType = vehicleFuelType ?? .unknown
        let baseFactor = fuelTypeFactors[fuelType] ?? fuelTypeFactors[.unknown]!
        let rideMultiplier = rideTypeMultipliers[rideType] ?? 1.0
        let trafficMultiplier = trafficMultipliers[trafficCondition ?? "normal"] ?? 1.0
        let total = calculateEmissions(
            distance: distance,
            rideType: rideType,
            vehicleFuelType: vehicleFuelType,
            trafficCondition: trafficCondition
        )
        
        return (baseFactor, rideMultiplier, trafficMultiplier, total)
    }
}

// MARK: - Time Recommendation Engine

class TimeRecommendationEngine {
    func getRecommendations(currentTime: Date) -> [Date] {
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: currentTime)
        
        var recommendations: [Date] = []
        
        if hour < 12 {
            // Morning: recommend afternoon times
            recommendations.append(calendar.date(bySettingHour: 14, minute: 0, second: 0, of: currentTime) ?? currentTime)
            recommendations.append(calendar.date(bySettingHour: 16, minute: 0, second: 0, of: currentTime) ?? currentTime)
        } else if hour < 18 {
            // Afternoon: recommend evening times
            recommendations.append(calendar.date(bySettingHour: 18, minute: 0, second: 0, of: currentTime) ?? currentTime)
            recommendations.append(calendar.date(bySettingHour: 20, minute: 0, second: 0, of: currentTime) ?? currentTime)
        } else {
            // Evening: recommend next day morning
            let nextDay = calendar.date(byAdding: .day, value: 1, to: currentTime) ?? currentTime
            recommendations.append(calendar.date(bySettingHour: 9, minute: 0, second: 0, of: nextDay) ?? nextDay)
            recommendations.append(calendar.date(bySettingHour: 11, minute: 0, second: 0, of: nextDay) ?? nextDay)
        }
        
        return recommendations
    }
}

enum TripSummaryError: Error, LocalizedError {
    case invalidRideId(String)
    case invalidUserId(String)
    case invalidDriverId(String)
    case rideNotFound(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidRideId(let message):
            return "Invalid ride ID: \(message)"
        case .invalidUserId(let message):
            return "Invalid user ID: \(message)"
        case .invalidDriverId(let message):
            return "Invalid driver ID: \(message)"
        case .rideNotFound(let message):
            return "Ride not found: \(message)"
        }
    }
}
