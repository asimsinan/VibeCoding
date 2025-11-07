import XCTest
import Combine
@testable import UncleTaxim

class AuthenticationViewModelTests: XCTestCase {
    var viewModel: AuthenticationViewModel!
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        cancellables = Set<AnyCancellable>()
        viewModel = AuthenticationViewModel()
    }
    
    override func tearDown() {
        cancellables = nil
        viewModel = nil
        super.tearDown()
    }
    
    // MARK: - State Management Tests
    
    func testInitialState() {
        // This test will fail initially (RED status)
        XCTAssertFalse(viewModel.isAuthenticated, "Should not be authenticated initially")
        XCTAssertNil(viewModel.currentUser, "Should have no current user initially")
        XCTAssertFalse(viewModel.isLoading, "Should not be loading initially")
    }
    
    func testLoginStateManagement() async {
        // This test will fail initially (RED status)
        let email = "test@example.com"
        let password = "password123"
        
        await viewModel.login(email: email, password: password)
        
        XCTAssertTrue(viewModel.isLoading, "Should be loading during login")
    }
    
    func testLogoutStateManagement() {
        // This test will fail initially (RED status)
        viewModel.logout()
        
        XCTAssertFalse(viewModel.isAuthenticated, "Should not be authenticated after logout")
        XCTAssertNil(viewModel.currentUser, "Should have no current user after logout")
    }
    
    // MARK: - Service Integration Tests
    
    func testLoginServiceIntegration() async {
        // This test will fail initially (RED status)
        let email = "test@example.com"
        let password = "password123"
        
        let expectation = XCTestExpectation(description: "Login completes")
        
        viewModel.$isAuthenticated
            .dropFirst()
            .sink { isAuthenticated in
                if isAuthenticated {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)
        
        await viewModel.login(email: email, password: password)
        
        await fulfillment(of: [expectation], timeout: 5.0)
    }
}

