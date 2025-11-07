import XCTest
import Combine
@testable import UncleTaxim

class RideSuggestionsViewModelTests: XCTestCase {
    var viewModel: RideSuggestionsViewModel!
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        cancellables = Set<AnyCancellable>()
        viewModel = RideSuggestionsViewModel()
    }
    
    override func tearDown() {
        cancellables = nil
        viewModel = nil
        super.tearDown()
    }
    
    // MARK: - State Management Tests
    
    func testInitialState() {
        // This test will fail initially (RED status)
        XCTAssertTrue(viewModel.suggestions.isEmpty, "Should have no suggestions initially")
        XCTAssertFalse(viewModel.isLoading, "Should not be loading initially")
        XCTAssertNil(viewModel.selectedSuggestion, "Should have no selected suggestion initially")
    }
    
    func testLoadSuggestionsStateManagement() {
        // This test will fail initially (RED status)
        viewModel.loadSuggestions()
        
        XCTAssertTrue(viewModel.isLoading, "Should be loading when fetching suggestions")
    }
    
    func testSelectSuggestionStateManagement() {
        // This test will fail initially (RED status)
        let suggestion = createRideSuggestion()
        viewModel.selectSuggestion(suggestion)
        
        XCTAssertEqual(viewModel.selectedSuggestion?.id, suggestion.id, "Should set selected suggestion")
    }
    
    // MARK: - Service Integration Tests
    
    func testFetchSuggestionsServiceIntegration() {
        // This test will fail initially (RED status)
        let expectation = XCTestExpectation(description: "Suggestions loaded")
        
        viewModel.$suggestions
            .dropFirst()
            .sink { suggestions in
                if !suggestions.isEmpty {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)
        
        viewModel.loadSuggestions()
        
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

