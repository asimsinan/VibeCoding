import XCTest
@testable import UncleTaxim

class TripSummaryServiceTests: XCTestCase {
    var tripService: TripSummaryService!
    var mockDataService: FirebaseDataService!
    
    override func setUp() {
        super.setUp()
        mockDataService = FirebaseDataService()
        tripService = TripSummaryService(dataService: mockDataService)
    }
    
    override func tearDown() {
        tripService = nil
        mockDataService = nil
        super.tearDown()
    }
    
    // MARK: - Summary Generation Tests
    
    func testGenerateTripSummary_Success() {
        // This test will fail initially (RED status)
        let rideId = "ride123"
        let userId = "user123"
        let driverId = "driver123"
        
        Task {
            do {
                let summary = try await tripService.generateTripSummary(rideId: rideId, userId: userId, driverId: driverId)
                XCTAssertNotNil(summary, "Trip summary should be generated")
                XCTAssertEqual(summary.rideId, rideId, "Ride ID should match")
            } catch {
                XCTFail("Trip summary generation should not throw error: \(error)")
            }
        }
    }
    
    func testGenerateTripSummary_WithInvalidRideId() {
        // This test will fail initially (RED status)
        let rideId = ""
        let userId = "user123"
        let driverId = "driver123"
        
        Task {
            do {
                _ = try await tripService.generateTripSummary(rideId: rideId, userId: userId, driverId: driverId)
                XCTFail("Should throw error for invalid ride ID")
            } catch {
                XCTAssertTrue(true, "Should throw error for invalid ride ID")
            }
        }
    }
    
    // MARK: - CO₂ Calculation Tests
    
    func testCalculateCO2Emissions() {
        // This test will fail initially (RED status)
        let distance = 15.5 // km
        let rideType = RideType.standard
        
        let co2Emissions = tripService.calculateCO2Emissions(distance: distance, rideType: rideType)
        
        XCTAssertGreaterThan(co2Emissions, 0, "CO₂ emissions should be positive")
        XCTAssertLessThan(co2Emissions, 10.0, "CO₂ emissions should be reasonable for 15.5km")
    }
    
    func testCalculateCO2Emissions_ForDifferentRideTypes() {
        // This test will fail initially (RED status)
        let distance = 15.5 // km
        
        let standardCO2 = tripService.calculateCO2Emissions(distance: distance, rideType: .standard)
        let premiumCO2 = tripService.calculateCO2Emissions(distance: distance, rideType: .premium)
        let sharedCO2 = tripService.calculateCO2Emissions(distance: distance, rideType: .shared)
        
        XCTAssertGreaterThan(standardCO2, sharedCO2, "Shared rides should have lower CO₂")
        XCTAssertGreaterThan(premiumCO2, standardCO2, "Premium rides may have higher CO₂")
    }
    
    // MARK: - Travel Time Recommendations Tests
    
    func testGetTravelTimeRecommendations() {
        // This test will fail initially (RED status)
        let currentTime = Date()
        let recommendations = tripService.getTravelTimeRecommendations(currentTime: currentTime)
        
        XCTAssertGreaterThan(recommendations.count, 0, "Should provide travel time recommendations")
    }
    
    func testGetTravelTimeRecommendations_ForDifferentTimes() {
        // This test will fail initially (RED status)
        let morningTime = Calendar.current.date(bySettingHour: 8, minute: 0, second: 0, of: Date())!
        let eveningTime = Calendar.current.date(bySettingHour: 18, minute: 0, second: 0, of: Date())!
        
        let morningRecs = tripService.getTravelTimeRecommendations(currentTime: morningTime)
        let eveningRecs = tripService.getTravelTimeRecommendations(currentTime: eveningTime)
        
        XCTAssertGreaterThan(morningRecs.count, 0, "Should provide morning recommendations")
        XCTAssertGreaterThan(eveningRecs.count, 0, "Should provide evening recommendations")
    }
    
    // MARK: - Integration Tests
    
    func testGenerateTripSummary_WithCO2AndRecommendations() {
        // This test will fail initially (RED status)
        let rideId = "ride123"
        let userId = "user123"
        let driverId = "driver123"
        
        Task {
            do {
                let summary = try await tripService.generateTripSummary(rideId: rideId, userId: userId, driverId: driverId)
                XCTAssertNotNil(summary.tripSummary, "Should include trip details")
                XCTAssertGreaterThan(summary.tripSummary.totalDistance, 0, "Should have distance")
            } catch {
                XCTFail("Trip summary with CO₂ and recommendations should work: \(error)")
            }
        }
    }
}

