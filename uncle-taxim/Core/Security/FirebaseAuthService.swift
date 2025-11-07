import Foundation
import FirebaseAuth
import FirebaseCore
import Combine

protocol FirebaseAuthServiceProtocol {
    func register(email: String, password: String, fullName: String, phoneNumber: String) async throws -> User
    func login(email: String, password: String) async throws -> User
    func logout() async throws
    func getCurrentUser() async -> User?
    func getCurrentFirebaseUser() -> FirebaseAuth.User?
    func isAuthenticated() -> Bool
    var currentUser: AnyPublisher<User?, Never> { get }
}

class FirebaseAuthService: FirebaseAuthServiceProtocol {
    private var auth: Auth {
        // Lazy initialization - ensure Firebase is configured first
        if FirebaseApp.app() == nil {
            // If Firebase isn't configured, try to configure it
            FirebaseConfigManager.configure()
            // Continue anyway - Auth.auth() will fail when used if not configured
        }
        return Auth.auth()
    }
    private let keychainService: KeychainServiceProtocol
    private let _dataService: FirebaseDataService?
    private let subject = PassthroughSubject<User?, Never>()
    private var authStateListener: AuthStateDidChangeListenerHandle?
    
    // Lazy computed property to get dataService, creating it if needed
    private var dataService: FirebaseDataService {
        if let service = _dataService {
            return service
        }
        // Create FirebaseDataService with this FirebaseAuthService to break circular dependency
        return FirebaseDataService(authService: self)
    }
    
    var currentUser: AnyPublisher<User?, Never> {
        subject.eraseToAnyPublisher()
    }
    
    init(
        keychainService: KeychainServiceProtocol? = nil,
        dataService: FirebaseDataService? = nil
    ) {
        // Store services - create them lazily if not provided to avoid circular dependencies
        if let keychainService = keychainService {
            self.keychainService = keychainService
        } else {
            // Create KeychainService - this is safe, no dependencies
            self.keychainService = KeychainService()
        }
        
        // Store dataService - if nil, we'll create it lazily when needed
        // This breaks the circular dependency during initialization
        self._dataService = dataService
        
        // Ensure Firebase is configured before setting up listener
        // Note: This will be called after FirebaseApp.configure() in AppDelegate
        // For tests, we may need to call setupAuthListener() manually
        setupAuthListener()
    }
    
    private func setupAuthListener() {
        // Ensure Firebase is configured
        guard FirebaseApp.app() != nil else {
            // If Firebase isn't configured yet, set up listener later
            // This can happen during tests or if configure() hasn't been called
            return
        }
        
        // Listen to auth state changes
        authStateListener = auth.addStateDidChangeListener { [weak self] _, firebaseUser in
            Task {
                if let firebaseUser = firebaseUser,
                   let user = try? await self?.dataService.getUser(userId: firebaseUser.uid) {
                    await MainActor.run {
                        self?.subject.send(user)
                    }
                } else {
                    await MainActor.run {
                        self?.subject.send(nil)
                    }
                }
            }
        }
    }
    
    /// Register a new user with Firebase Authentication
    func register(email: String, password: String, fullName: String, phoneNumber: String) async throws -> User {
        
        guard !email.isEmpty else {
            throw AuthError.invalidEmail("Email cannot be empty")
        }
        guard !password.isEmpty else {
            throw AuthError.invalidPassword("Password cannot be empty")
        }
        guard password.count >= 6 else {
            throw AuthError.weakPassword("Password must be at least 6 characters")
        }
        guard !phoneNumber.isEmpty else {
            throw AuthError.invalidPhoneNumber("Phone number cannot be empty")
        }
        
        // Ensure Firebase is configured
        guard FirebaseApp.app() != nil else {
            throw AuthError.configurationError("Firebase is not configured")
        }
        
        let authResult = try await auth.createUser(withEmail: email, password: password)
        
        // Update user profile with display name
        let changeRequest = authResult.user.createProfileChangeRequest()
        changeRequest.displayName = fullName
        try await changeRequest.commitChanges()
        
        // Store token in Keychain
        let idToken = try await authResult.user.getIDToken()
        try keychainService.storeToken(idToken, forKey: "firebase_id_token")
        
        // Create user profile in Firestore
        let user = User(
            id: authResult.user.uid,
            email: email,
            phoneNumber: phoneNumber,
            fullName: fullName
        )
        let createdUser = try await dataService.createUser(user)
        
        return createdUser
    }
    
    /// Login with email and password
    func login(email: String, password: String) async throws -> User {
        
        guard !email.isEmpty else {
            throw AuthError.invalidEmail("Email cannot be empty")
        }
        guard !password.isEmpty else {
            throw AuthError.invalidPassword("Password cannot be empty")
        }
        
        // Ensure Firebase is configured
        guard FirebaseApp.app() != nil else {
            throw AuthError.configurationError("Firebase is not configured")
        }
        
        let authResult = try await auth.signIn(withEmail: email, password: password)
        
        // Store token in Keychain
        let idToken = try await authResult.user.getIDToken()
        try keychainService.storeToken(idToken, forKey: "firebase_id_token")
        
        // Fetch user profile from Firestore
        if let user = try await dataService.getUser(userId: authResult.user.uid) {
            return user
        } else {
            // If user profile doesn't exist, create a default one
            // This can happen if registration failed partway through
            // Use a placeholder phone number that indicates it needs to be updated
            let defaultUser = User(
                id: authResult.user.uid,
                email: email,
                phoneNumber: "0000000000", // Placeholder - user should update this
                fullName: authResult.user.displayName ?? "User"
            )
            
            do {
                let createdUser = try await dataService.createUser(defaultUser)
                return createdUser
            } catch {
                // Even if we can't create the profile, we can still return a basic user
                // The user can update their profile later
                // But we need to ensure the user object is valid
                var fallbackUser = defaultUser
                // Try to validate, but if it fails, we'll still return it
                do {
                    try fallbackUser.validate()
                }
                return fallbackUser
            }
        }
    }
    
    /// Logout current user
    func logout() async throws {
        try keychainService.deleteToken(forKey: "firebase_id_token")
        try auth.signOut()
    }
    
    /// Get current authenticated user (custom User model)
    func getCurrentUser() async -> User? {
        guard let firebaseUser = auth.currentUser else { return nil }
        return try? await dataService.getUser(userId: firebaseUser.uid)
    }
    
    /// Get current Firebase authenticated user (for authorization checks)
    func getCurrentFirebaseUser() -> FirebaseAuth.User? {
        return auth.currentUser
    }
    
    /// Check if user is authenticated
    func isAuthenticated() -> Bool {
        return auth.currentUser != nil
    }
    
    /// Get stored ID token
    func getStoredToken() throws -> String? {
        return try keychainService.getToken(forKey: "firebase_id_token")
    }
}

enum AuthError: Error, LocalizedError {
    case invalidEmail(String)
    case invalidPassword(String)
    case invalidPhoneNumber(String)
    case weakPassword(String)
    case authenticationFailed(String)
    case userNotFound(String)
    case configurationError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidEmail(let message):
            return "Invalid email: \(message)"
        case .invalidPassword(let message):
            return "Invalid password: \(message)"
        case .invalidPhoneNumber(let message):
            return "Invalid phone number: \(message)"
        case .weakPassword(let message):
            return "Weak password: \(message)"
        case .authenticationFailed(let message):
            return "Authentication failed: \(message)"
        case .userNotFound(let message):
            return "User not found: \(message)"
        case .configurationError(let message):
            return "Firebase configuration error: \(message)"
        }
    }
}

