import XCTest
@testable import UncleTaxim

class UserTests: XCTestCase {
    
    func testUserCreation() {
        // This test will fail initially (RED status)
        let user = User(
            email: "test@example.com",
            phoneNumber: "+1234567890",
            fullName: "Test User"
        )
        
        XCTAssertNotNil(user, "User should be created")
        XCTAssertEqual(user.email, "test@example.com", "Email should match")
        XCTAssertEqual(user.fullName, "Test User", "Full name should match")
    }
    
    func testUserValidation_Success() {
        // This test will fail initially (RED status)
        let user = User(
            email: "test@example.com",
            phoneNumber: "+1234567890",
            fullName: "Test User"
        )
        
        XCTAssertNoThrow(try user.validate(), "Valid user should pass validation")
    }
    
    func testUserValidation_InvalidEmail() {
        // This test will fail initially (RED status)
        let user = User(
            email: "invalid-email",
            phoneNumber: "+1234567890",
            fullName: "Test User"
        )
        
        XCTAssertThrowsError(try user.validate(), "Invalid email should fail validation")
    }
    
    func testUserIsEligibleForRide() {
        // This test will fail initially (RED status)
        let activeUser = User(
            email: "test@example.com",
            phoneNumber: "+1234567890",
            fullName: "Test User",
            isActive: true
        )
        
        XCTAssertTrue(activeUser.isEligibleForRide(), "Active user should be eligible for ride")
        
        let inactiveUser = User(
            email: "test@example.com",
            phoneNumber: "+1234567890",
            fullName: "Test User",
            isActive: false
        )
        
        XCTAssertFalse(inactiveUser.isEligibleForRide(), "Inactive user should not be eligible")
    }
    
    func testUserUpdateProfile() {
        // This test will fail initially (RED status)
        var user = User(
            email: "test@example.com",
            phoneNumber: "+1234567890",
            fullName: "Old Name"
        )
        
        user.updateProfile(name: "New Name", phone: "+9876543210")
        
        XCTAssertEqual(user.fullName, "New Name", "Name should be updated")
        XCTAssertEqual(user.phoneNumber, "+9876543210", "Phone should be updated")
    }
}

