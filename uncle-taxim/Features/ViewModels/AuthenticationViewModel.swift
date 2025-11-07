import Foundation
import Combine
import SwiftUI

class AuthenticationViewModel: BaseViewModel {
    @Published var isAuthenticated: Bool = false
    @Published var currentUser: User?
    
    private let authService: FirebaseAuthServiceProtocol
    private let dataService: FirebaseDataService
    private let persistenceService: StatePersistenceService
    private var authStateCancellable: AnyCancellable?
    
    init(
        authService: FirebaseAuthServiceProtocol? = nil,
        dataService: FirebaseDataService? = nil,
        persistenceService: StatePersistenceService = .shared
    ) {
        // Create services if not provided
        let keychainService = KeychainService()
        self.dataService = dataService ?? FirebaseDataService()
        self.authService = authService ?? FirebaseAuthService(
            keychainService: keychainService,
            dataService: self.dataService
        )
        self.persistenceService = persistenceService
        super.init()
        
        // Listen to auth state changes
        setupAuthStateListener()
        
        // Check initial auth state
        checkAuthState()
    }
    
    private func setupAuthStateListener() {
        authStateCancellable = authService.currentUser
            .receive(on: DispatchQueue.main)
            .sink { [weak self] user in
                guard let self = self else { return }
                self.currentUser = user
                self.isAuthenticated = user != nil
                if let user = user {
                    self.persistenceService.saveIsAuthenticated(true)
                    if let userId = user.id {
                        self.persistenceService.saveUserId(userId)
                    }
                } else {
                    self.persistenceService.saveIsAuthenticated(false)
                    self.persistenceService.saveUserId("")
                }
            }
    }
    
    private func checkAuthState() {
        Task {
            if let user = await authService.getCurrentUser() {
                await MainActor.run {
                    self.currentUser = user
                    self.isAuthenticated = true
                }
            } else {
                // Load persisted state as fallback
                await MainActor.run {
                    self.isAuthenticated = persistenceService.loadIsAuthenticated()
                }
            }
        }
    }
    
    func login(email: String, password: String) async {
 
        
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            let user = try await authService.login(email: email, password: password)
            
            await MainActor.run {
                self.currentUser = user
                self.isAuthenticated = true
                self.isLoading = false
                self.errorMessage = nil
            }
        } catch {
            
            // Provide user-friendly error messages
            let userFriendlyMessage: String
            if let nsError = error as NSError? {
                switch nsError.code {
                case 17008: // ERROR_INVALID_EMAIL
                    userFriendlyMessage = "Please enter a valid email address."
                case 17009: // ERROR_WRONG_PASSWORD
                    userFriendlyMessage = "Incorrect password. Please try again."
                case 17011: // ERROR_USER_NOT_FOUND
                    userFriendlyMessage = "No account found with this email. Please sign up first."
                case 17020: // ERROR_NETWORK_REQUEST_FAILED
                    userFriendlyMessage = "Network error. Please check your internet connection and try again."
                case 17010: // ERROR_USER_DISABLED
                    userFriendlyMessage = "This account has been disabled. Please contact support."
                default:
                    // Check if it's a custom AuthError
                    if let authError = error as? AuthError {
                        userFriendlyMessage = error.localizedDescription
                    } else {
                        userFriendlyMessage = error.localizedDescription
                    }
                }
            } else {
                userFriendlyMessage = error.localizedDescription
            }
            
            await MainActor.run {
                self.errorMessage = userFriendlyMessage
                self.isLoading = false
            }
        }
    }
    
    func register(email: String, password: String, fullName: String, phoneNumber: String) async {
        
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            let user = try await authService.register(email: email, password: password, fullName: fullName, phoneNumber: phoneNumber)
            
            await MainActor.run {
                self.currentUser = user
                self.isAuthenticated = true
                self.isLoading = false
                self.errorMessage = nil
                
                // Persist authentication state
                self.persistenceService.saveIsAuthenticated(true)
                if let userId = user.id {
                    self.persistenceService.saveUserId(userId)
                }
                
            }
        } catch {
            
            // Provide user-friendly error messages
            let userFriendlyMessage: String
            if let nsError = error as NSError? {
                switch nsError.code {
                case 17007: // ERROR_EMAIL_ALREADY_IN_USE
                    userFriendlyMessage = "This email is already registered. Please sign in or use a different email."
                case 17008: // ERROR_INVALID_EMAIL
                    userFriendlyMessage = "Please enter a valid email address."
                case 17026: // ERROR_WEAK_PASSWORD
                    userFriendlyMessage = "Password is too weak. Please use a stronger password."
                case 17020: // ERROR_NETWORK_REQUEST_FAILED
                    userFriendlyMessage = "Network error. Please check your internet connection and try again."
                default:
                    userFriendlyMessage = error.localizedDescription
                }
            } else {
                userFriendlyMessage = error.localizedDescription
            }
            
            await MainActor.run {
                self.errorMessage = userFriendlyMessage
                self.isLoading = false
            }
        }
    }
    
    func logout() async {
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            try await authService.logout()
            await MainActor.run {
                self.isAuthenticated = false
                self.currentUser = nil
                self.errorMessage = nil
                self.handleSuccess()
            }
            
            // Clear persisted state
            persistenceService.saveIsAuthenticated(false)
            persistenceService.saveUserId("")
        } catch {
            await MainActor.run {
                self.handleError(error)
            }
        }
    }
}

