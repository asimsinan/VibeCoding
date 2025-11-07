import XCTest
import Combine
@testable import UncleTaxim

class ProfileViewModelTests: XCTestCase {
    var viewModel: ProfileViewModel!
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        cancellables = Set<AnyCancellable>()
        viewModel = ProfileViewModel()
    }
    
    override func tearDown() {
        cancellables = nil
        viewModel = nil
        super.tearDown()
    }
    
    // MARK: - State Management Tests
    
    func testInitialState() {
        // This test will fail initially (RED status)
        XCTAssertNil(viewModel.user, "Should have no user initially")
        XCTAssertNil(viewModel.userPreferences, "Should have no preferences initially")
        XCTAssertFalse(viewModel.isLoading, "Should not be loading initially")
    }
    
    func testLoadProfileStateManagement() {
        // This test will fail initially (RED status)
        viewModel.loadProfile()
        
        XCTAssertTrue(viewModel.isLoading, "Should be loading when fetching profile")
    }
    
    func testUpdatePreferencesStateManagement() {
        // This test will fail initially (RED status)
        var preferences = UserPreferences(userId: "user123")
        viewModel.updatePreferences(preferences)
        
        XCTAssertNotNil(viewModel.userPreferences, "Should have preferences after update")
    }
    
    // MARK: - Service Integration Tests
    
    func testLoadProfileServiceIntegration() {
        // This test will fail initially (RED status)
        let expectation = XCTestExpectation(description: "Profile loaded")
        
        viewModel.$user
            .dropFirst()
            .sink { user in
                if user != nil {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)
        
        viewModel.loadProfile()
        
        wait(for: [expectation], timeout: 5.0)
    }
}

