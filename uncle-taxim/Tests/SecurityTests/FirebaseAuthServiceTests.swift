import XCTest
@testable import UncleTaxim

class FirebaseAuthServiceTests: XCTestCase {
    var authService: FirebaseAuthServiceProtocol!
    var keychainService: KeychainServiceProtocol!
    
    override func setUp() {
        super.setUp()
        keychainService = KeychainService()
        authService = FirebaseAuthService(keychainService: keychainService)
    }
    
    override func tearDown() {
        authService = nil
        keychainService = nil
        super.tearDown()
    }
    
    // MARK: - Registration Tests
    
    func testUserRegistration() {
        // This test will verify registration functionality
        let email = "test@example.com"
        let password = "password123"
        let fullName = "Test User"
        
        Task {
            do {
                let user = try await authService.register(email: email, password: password, fullName: fullName)
                XCTAssertNotNil(user, "User should be registered")
            } catch {
                XCTFail("Registration should succeed: \(error)")
            }
        }
    }
    
    // MARK: - Login Tests
    
    func testUserLogin() {
        // This test will verify login functionality
        let email = "test@example.com"
        let password = "password123"
        
        Task {
            do {
                let user = try await authService.login(email: email, password: password)
                XCTAssertNotNil(user, "User should be logged in")
            } catch {
                XCTFail("Login should succeed: \(error)")
            }
        }
    }
    
    // MARK: - Session Management Tests
    
    func testSessionManagement() {
        // This test will verify session management
        XCTAssertFalse(authService.isAuthenticated(), "Should not be authenticated initially")
    }
    
    // MARK: - Keychain Storage Tests
    
    func testTokenStorageInKeychain() {
        // This test will verify token storage
        let token = "test_token_123"
        
        do {
            try keychainService.storeToken(token, forKey: "test_token")
            let retrieved = try keychainService.getToken(forKey: "test_token")
            XCTAssertEqual(retrieved, token, "Token should be stored and retrieved correctly")
        } catch {
            XCTFail("Keychain storage should work: \(error)")
        }
    }
}

