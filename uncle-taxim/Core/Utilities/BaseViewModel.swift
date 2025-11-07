import Foundation
import Combine
import SwiftUI

/// Service for persisting application state using UserDefaults
class StatePersistenceService {
    static let shared = StatePersistenceService()
    private let defaults: UserDefaults
    
    private init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }
    
    func saveIsAuthenticated(_ isAuthenticated: Bool) {
        defaults.set(isAuthenticated, forKey: "isAuthenticated")
        defaults.synchronize()
    }
    
    func loadIsAuthenticated() -> Bool {
        return defaults.bool(forKey: "isAuthenticated")
    }
    
    func saveUserId(_ userId: String) {
        defaults.set(userId, forKey: "userId")
        defaults.synchronize()
    }
    
    func loadUserId() -> String? {
        return defaults.string(forKey: "userId")
    }
    
    func clearAllState() {
        guard let domain = Bundle.main.bundleIdentifier else {
            return
        }
        defaults.removePersistentDomain(forName: domain)
        defaults.synchronize()
    }
}

/// Base ViewModel protocol with common state management
protocol BaseViewModelProtocol: ObservableObject {
    var isLoading: Bool { get set }
    var errorMessage: String? { get set }
}

/// Base ViewModel class with common functionality
class BaseViewModel: ObservableObject {
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    var cancellables = Set<AnyCancellable>()
    
    deinit {
        // Cancel all subscriptions when view model is deallocated
        cancellables.removeAll()
    }
    
    /// Common error handling for async operations
    func handleError(_ error: Error) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.errorMessage = error.localizedDescription
            self.isLoading = false
        }
    }
    
    /// Common success handling for async operations
    func handleSuccess() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.isLoading = false
            self.errorMessage = nil
        }
    }
}

/// Authentication service protocol for user management
protocol AuthenticationServiceProtocol {
    func getCurrentUserId() -> String?
    func isAuthenticated() -> Bool
}

/// Default authentication service implementation
class DefaultAuthenticationService: AuthenticationServiceProtocol {
    func getCurrentUserId() -> String? {
        // Placeholder - in real implementation, get from Firebase Auth
        return "user123"
    }
    
    func isAuthenticated() -> Bool {
        // Placeholder - in real implementation, check Firebase Auth
        return true
    }
}

