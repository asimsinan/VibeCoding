import XCTest
import Combine
@testable import UncleTaxim

class BookingViewModelTests: XCTestCase {
    var viewModel: BookingViewModel!
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        cancellables = Set<AnyCancellable>()
        viewModel = BookingViewModel()
    }
    
    override func tearDown() {
        cancellables = nil
        viewModel = nil
        super.tearDown()
    }
    
    // MARK: - State Management Tests
    
    func testInitialState() {
        // This test will fail initially (RED status)
        XCTAssertNil(viewModel.currentRide, "Should have no current ride initially")
        XCTAssertFalse(viewModel.isBooking, "Should not be booking initially")
        XCTAssertFalse(viewModel.isLoading, "Should not be loading initially")
    }
    
    func testBookRideStateManagement() {
        // This test will fail initially (RED status)
        let suggestion = createRideSuggestion()
        viewModel.bookRide(suggestion: suggestion)
        
        XCTAssertTrue(viewModel.isBooking, "Should be booking when creating ride")
    }
    
    func testCancelRideStateManagement() {
        // This test will fail initially (RED status)
        viewModel.cancelRide()
        
        XCTAssertNil(viewModel.currentRide, "Should clear current ride after cancel")
    }
    
    // MARK: - Service Integration Tests
    
    func testBookRideServiceIntegration() {
        // This test will fail initially (RED status)
        let suggestion = createRideSuggestion()
        
        let expectation = XCTestExpectation(description: "Ride booked")
        
        viewModel.$currentRide
            .dropFirst()
            .sink { ride in
                if ride != nil {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)
        
        viewModel.bookRide(suggestion: suggestion)
        
        wait(for: [expectation], timeout: 5.0)
    }
    
    // MARK: - Helper Methods
    
    private func createRideSuggestion() -> RideSuggestion {
        let pickup = LocationWithAddress(latitude: 40.7128, longitude: -74.0060, address: "123 Main St")
        let dropoff = LocationWithAddress(latitude: 40.7589, longitude: -73.9851, address: "456 Broadway")
        
        return RideSuggestion(
            userId: "user123",
            pickupLocation: pickup,
            dropoffLocation: dropoff,
            estimatedPrice: 25.0,
            estimatedDuration: 30,
            source: .manual,
            expiresAt: Date().addingTimeInterval(3600)
        )
    }
}

