import Foundation

/// Dependency Injection Container for UncleTaxim services
class ServiceContainer {
    static let shared = ServiceContainer()
    
    // MARK: - Services
    private var _authService: FirebaseAuthServiceProtocol?
    private var _dataService: FirebaseDataService?
    private var _keychainService: KeychainServiceProtocol?
    private var _authorizationService: AuthorizationServiceProtocol?
    
    // MARK: - Lazy Initialized Services
    var authService: FirebaseAuthServiceProtocol {
        if _authService == nil {
            _authService = FirebaseAuthService(
                keychainService: keychainService,
                dataService: dataService
            )
        }
        return _authService!
    }
    
    var dataService: FirebaseDataService {
        if _dataService == nil {
            _dataService = FirebaseDataService(
                authService: authService
            )
        }
        return _dataService!
    }
    
    var keychainService: KeychainServiceProtocol {
        if _keychainService == nil {
            _keychainService = KeychainService()
        }
        return _keychainService!
    }
    
    var authorizationService: AuthorizationServiceProtocol {
        if _authorizationService == nil {
            _authorizationService = AuthorizationService(authService: authService)
        }
        return _authorizationService!
    }
    
    // MARK: - Initialization
    private init() {
        // Private initializer for singleton
    }
    
    // MARK: - Test Support
    /// Reset all services (useful for testing)
    func reset() {
        _authService = nil
        _dataService = nil
        _keychainService = nil
        _authorizationService = nil
    }
    
    /// Inject mock services for testing
    func inject(
        authService: FirebaseAuthServiceProtocol? = nil,
        dataService: FirebaseDataService? = nil,
        keychainService: KeychainServiceProtocol? = nil,
        authorizationService: AuthorizationServiceProtocol? = nil
    ) {
        if let authService = authService {
            _authService = authService
        }
        if let dataService = dataService {
            _dataService = dataService
        }
        if let keychainService = keychainService {
            _keychainService = keychainService
        }
        if let authorizationService = authorizationService {
            _authorizationService = authorizationService
        }
    }
}

