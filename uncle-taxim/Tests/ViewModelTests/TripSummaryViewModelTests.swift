import XCTest
import Combine
@testable import UncleTaxim

class TripSummaryViewModelTests: XCTestCase {
    var viewModel: TripSummaryViewModel!
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        cancellables = Set<AnyCancellable>()
        viewModel = TripSummaryViewModel()
    }
    
    override func tearDown() {
        cancellables = nil
        viewModel = nil
        super.tearDown()
    }
    
    // MARK: - State Management Tests
    
    func testInitialState() {
        // This test will fail initially (RED status)
        XCTAssertNil(viewModel.tripSummary, "Should have no trip summary initially")
        XCTAssertFalse(viewModel.isLoading, "Should not be loading initially")
    }
    
    func testLoadSummaryStateManagement() {
        // This test will fail initially (RED status)
        viewModel.loadSummary(rideId: "ride123")
        
        XCTAssertTrue(viewModel.isLoading, "Should be loading when fetching summary")
    }
    
    // MARK: - Service Integration Tests
    
    func testLoadSummaryServiceIntegration() {
        // This test will fail initially (RED status)
        let expectation = XCTestExpectation(description: "Summary loaded")
        
        viewModel.$tripSummary
            .dropFirst()
            .sink { summary in
                if summary != nil {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)
        
        viewModel.loadSummary(rideId: "ride123")
        
        wait(for: [expectation], timeout: 5.0)
    }
}

