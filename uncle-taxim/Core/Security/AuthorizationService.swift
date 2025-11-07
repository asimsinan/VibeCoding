import Foundation
import FirebaseAuth

enum UserRole {
    case user
    case driver
    case admin
}

protocol AuthorizationServiceProtocol {
    func canAccessRide(userId: String, ride: Ride) -> Bool
    func canAccessUserData(userId: String, targetUserId: String) -> Bool
    func canAccessSuggestion(userId: String, suggestion: RideSuggestion) -> Bool
    func canAccessTripSummary(userId: String, summary: TripSummary) -> Bool
    func getUserRole(userId: String) -> UserRole
}

class AuthorizationService: AuthorizationServiceProtocol {
    private let authService: FirebaseAuthServiceProtocol
    
    init(authService: FirebaseAuthServiceProtocol) {
        self.authService = authService
    }
    
    /// Check if user can access a specific ride
    func canAccessRide(userId: String, ride: Ride) -> Bool {
        guard authService.isAuthenticated() else {
            print("❌ [DEBUG] AuthorizationService - User not authenticated")
            return false
        }
        guard let currentUser = authService.getCurrentFirebaseUser() else {
            print("❌ [DEBUG] AuthorizationService - No current user")
            return false
        }
        let currentUserId = currentUser.uid
        
        print("🔍 [DEBUG] AuthorizationService - Checking access:")
        print("   - Current user ID: \(currentUserId)")
        print("   - Ride user ID: \(ride.userId)")
        print("   - Ride driver ID: \(ride.driverId ?? "nil")")
        print("   - Ride status: \(ride.status)")
        
        // User can access their own rides or rides they're driving
        if ride.userId == currentUserId {
            print("✅ [DEBUG] AuthorizationService - Access granted: User is the passenger")
            return true
        }
        
        if ride.driverId == currentUserId {
            print("✅ [DEBUG] AuthorizationService - Access granted: User is the driver")
            return true
        }
        
        // Drivers can access pending rides (to accept them)
        // This allows drivers to accept rides even if they're not yet assigned
        if ride.status == .pending && ride.driverId == nil {
            print("✅ [DEBUG] AuthorizationService - Access granted: Driver can accept pending ride")
            return true
        }
        
        print("❌ [DEBUG] AuthorizationService - Access denied")
        return false
    }
    
    /// Check if user can access another user's data
    func canAccessUserData(userId: String, targetUserId: String) -> Bool {
        guard authService.isAuthenticated() else { return false }
        guard let currentUser = authService.getCurrentFirebaseUser() else { return false }
        let currentUserId = currentUser.uid
        
        // Users can only access their own data
        return currentUserId == targetUserId
    }
    
    /// Check if user can access a ride suggestion
    func canAccessSuggestion(userId: String, suggestion: RideSuggestion) -> Bool {
        guard authService.isAuthenticated() else { return false }
        guard let currentUser = authService.getCurrentFirebaseUser() else { return false }
        let currentUserId = currentUser.uid
        
        // Users can only access their own suggestions
        return suggestion.userId == currentUserId
    }
    
    /// Check if user can access a trip summary
    func canAccessTripSummary(userId: String, summary: TripSummary) -> Bool {
        guard authService.isAuthenticated() else { return false }
        guard let currentUser = authService.getCurrentFirebaseUser() else { return false }
        let currentUserId = currentUser.uid
        
        // Users can only access their own trip summaries
        return summary.userId == currentUserId
    }
    
    /// Get user role (simplified - in production, this would be stored in user profile)
    func getUserRole(userId: String) -> UserRole {
        guard authService.isAuthenticated() else { return .user }
        guard let currentUser = authService.getCurrentFirebaseUser() else { return .user }
        let _ = currentUser.uid
        
        // In production, check user profile for role
        // For now, default to user role
        return .user
    }
}

