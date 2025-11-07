import XCTest
@testable import UncleTaxim

class TripSummaryTests: XCTestCase {
    
    func testTripSummaryCreation() {
        // This test will fail initially (RED status)
        let tripDetails = TripDetails(
            totalDistance: 15.5,
            totalDuration: 45,
            totalCost: 28.50,
            pickupLocation: "123 Main St",
            dropoffLocation: "456 Broadway"
        )
        
        let summary = TripSummary(
            rideId: "ride123",
            userId: "user123",
            driverId: "driver123",
            tripSummary: tripDetails
        )
        
        XCTAssertNotNil(summary, "TripSummary should be created")
        XCTAssertEqual(summary.rideId, "ride123", "Ride ID should match")
        XCTAssertEqual(summary.tripSummary.totalDistance, 15.5, "Distance should match")
    }
    
    func testTripSummaryValidation_Success() {
        // This test will fail initially (RED status)
        let tripDetails = TripDetails(
            totalDistance: 15.5,
            totalDuration: 45,
            totalCost: 28.50,
            pickupLocation: "123 Main St",
            dropoffLocation: "456 Broadway"
        )
        
        let summary = TripSummary(
            rideId: "ride123",
            userId: "user123",
            driverId: "driver123",
            tripSummary: tripDetails
        )
        
        XCTAssertNoThrow(try summary.validate(), "Valid trip summary should pass validation")
    }
    
    func testTripSummaryAddUserRating() {
        // This test will fail initially (RED status)
        let tripDetails = TripDetails(
            totalDistance: 15.5,
            totalDuration: 45,
            totalCost: 28.50,
            pickupLocation: "123 Main St",
            dropoffLocation: "456 Broadway"
        )
        
        var summary = TripSummary(
            rideId: "ride123",
            userId: "user123",
            driverId: "driver123",
            tripSummary: tripDetails
        )
        
        XCTAssertNoThrow(try summary.addUserRating(4.5, feedback: "Great ride!"), "Should add valid rating")
        XCTAssertEqual(summary.userRating, 4.5, "User rating should be set")
        XCTAssertEqual(summary.userFeedback, "Great ride!", "User feedback should be set")
    }
    
    func testTripSummaryHasRatings() {
        // This test will fail initially (RED status)
        let tripDetails = TripDetails(
            totalDistance: 15.5,
            totalDuration: 45,
            totalCost: 28.50,
            pickupLocation: "123 Main St",
            dropoffLocation: "456 Broadway"
        )
        
        var summary = TripSummary(
            rideId: "ride123",
            userId: "user123",
            driverId: "driver123",
            tripSummary: tripDetails
        )
        
        XCTAssertFalse(summary.hasRatings(), "Should not have ratings initially")
        
        try? summary.addUserRating(4.5)
        XCTAssertTrue(summary.hasRatings(), "Should have ratings after adding")
    }
}

