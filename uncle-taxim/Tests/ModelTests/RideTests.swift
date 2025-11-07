import XCTest
@testable import UncleTaxim

class RideTests: XCTestCase {
    
    func testRideCreation() {
        // This test will fail initially (RED status)
        let pickup = LocationWithAddress(
            latitude: 40.7128,
            longitude: -74.0060,
            address: "123 Main St"
        )
        let dropoff = LocationWithAddress(
            latitude: 40.7589,
            longitude: -73.9851,
            address: "456 Broadway"
        )
        
        let ride = Ride(
            userId: "user123",
            pickupLocation: pickup,
            dropoffLocation: dropoff,
            estimatedPrice: 25.50,
            estimatedDuration: 30
        )
        
        XCTAssertNotNil(ride, "Ride should be created")
        XCTAssertEqual(ride.status, RideStatus.pending, "Initial status should be pending")
        XCTAssertEqual(ride.estimatedPrice, 25.50, "Estimated price should match")
    }
    
    func testRideValidation_Success() {
        // This test will fail initially (RED status)
        let pickup = LocationWithAddress(
            latitude: 40.7128,
            longitude: -74.0060,
            address: "123 Main St"
        )
        let dropoff = LocationWithAddress(
            latitude: 40.7589,
            longitude: -73.9851,
            address: "456 Broadway"
        )
        
        let ride = Ride(
            userId: "user123",
            pickupLocation: pickup,
            dropoffLocation: dropoff,
            estimatedPrice: 25.50,
            estimatedDuration: 30
        )
        
        XCTAssertNoThrow(try ride.validate(), "Valid ride should pass validation")
    }
    
    func testRideCanBeCancelled() {
        // This test will fail initially (RED status)
        let pickup = LocationWithAddress(
            latitude: 40.7128,
            longitude: -74.0060,
            address: "123 Main St"
        )
        let dropoff = LocationWithAddress(
            latitude: 40.7589,
            longitude: -73.9851,
            address: "456 Broadway"
        )
        
        var ride = Ride(
            userId: "user123",
            status: .pending,
            pickupLocation: pickup,
            dropoffLocation: dropoff,
            estimatedPrice: 25.50,
            estimatedDuration: 30
        )
        
        XCTAssertTrue(ride.canBeCancelled(), "Pending ride should be cancellable")
        
        ride.status = RideStatus.accepted
        XCTAssertTrue(ride.canBeCancelled(), "Accepted ride should be cancellable")
        
        ride.status = RideStatus.inProgress
        XCTAssertFalse(ride.canBeCancelled(), "In progress ride should not be cancellable")
    }
    
    func testRideAccept() {
        // This test will fail initially (RED status)
        let pickup = LocationWithAddress(
            latitude: 40.7128,
            longitude: -74.0060,
            address: "123 Main St"
        )
        let dropoff = LocationWithAddress(
            latitude: 40.7589,
            longitude: -73.9851,
            address: "456 Broadway"
        )
        
        var ride = Ride(
            userId: "user123",
            status: .pending,
            pickupLocation: pickup,
            dropoffLocation: dropoff,
            estimatedPrice: 25.50,
            estimatedDuration: 30
        )
        
        XCTAssertNoThrow(try ride.accept(driverId: "driver123"), "Should accept pending ride")
        XCTAssertEqual(ride.status, RideStatus.accepted, "Status should be accepted")
        XCTAssertEqual(ride.driverId, "driver123", "Driver ID should be set")
    }
    
    func testRideComplete() {
        // This test will fail initially (RED status)
        let pickup = LocationWithAddress(
            latitude: 40.7128,
            longitude: -74.0060,
            address: "123 Main St"
        )
        let dropoff = LocationWithAddress(
            latitude: 40.7589,
            longitude: -73.9851,
            address: "456 Broadway"
        )
        
        var ride = Ride(
            userId: "user123",
            status: .inProgress,
            pickupLocation: pickup,
            dropoffLocation: dropoff,
            estimatedPrice: 25.50,
            estimatedDuration: 30
        )
        
        XCTAssertNoThrow(try ride.complete(actualPrice: 27.00, actualDuration: 32), "Should complete ride")
        XCTAssertEqual(ride.status, RideStatus.completed, "Status should be completed")
        XCTAssertEqual(ride.actualPrice, 27.00, "Actual price should be set")
    }
}

