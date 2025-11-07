import Foundation
import Combine

/// Service for persisting application state using UserDefaults
class StatePersistenceService {
    static let shared = StatePersistenceService()
    private let defaults: UserDefaults
    
    private init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }
    
    // MARK: - User Preferences
    
    func saveUserPreferences(_ preferences: UserPreferences) {
        if let encoded = try? JSONEncoder().encode(preferences) {
            defaults.set(encoded, forKey: "userPreferences")
            defaults.synchronize()
        }
    }
    
    func loadUserPreferences() -> UserPreferences? {
        guard let data = defaults.data(forKey: "userPreferences"),
              let preferences = try? JSONDecoder().decode(UserPreferences.self, from: data) else {
            return nil
        }
        return preferences
    }
    
    // MARK: - Authentication State
    
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
    
    // MARK: - Application State
    
    func saveLastActiveTab(_ tabIndex: Int) {
        defaults.set(tabIndex, forKey: "lastActiveTab")
        defaults.synchronize()
    }
    
    func loadLastActiveTab() -> Int {
        return defaults.integer(forKey: "lastActiveTab")
    }
    
    func saveSessionId(_ sessionId: String) {
        defaults.set(sessionId, forKey: "sessionId")
        defaults.synchronize()
    }
    
    func loadSessionId() -> String? {
        return defaults.string(forKey: "sessionId")
    }
    
    // MARK: - Clear State
    
    func clearAllState() {
        let domain = Bundle.main.bundleIdentifier!
        defaults.removePersistentDomain(forName: domain)
        defaults.synchronize()
    }
}

/// State management utilities for Combine publishers
class StateManagementUtilities {
    
    /// Creates a publisher that emits values after debouncing
    static func debouncedPublisher<T>(
        _ publisher: AnyPublisher<T, Never>,
        delay: TimeInterval = 0.5
    ) -> AnyPublisher<T, Never> {
        return publisher
            .debounce(for: .seconds(delay), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
    
    /// Creates a publisher that combines multiple state sources
    static func combineState<T, U>(
        _ publisher1: AnyPublisher<T, Never>,
        _ publisher2: AnyPublisher<U, Never>
    ) -> AnyPublisher<(T, U), Never> {
        return Publishers.CombineLatest(publisher1, publisher2)
            .eraseToAnyPublisher()
    }
    
    /// Creates a state publisher that persists to UserDefaults
    static func persistedPublisher<T: Codable>(
        initialValue: T,
        key: String,
        persistenceService: StatePersistenceService = .shared
    ) -> (subject: CurrentValueSubject<T, Never>, cancellable: AnyCancellable) {
        let subject = CurrentValueSubject<T, Never>(initialValue)
        
        // Load from persistence
        if let data = UserDefaults.standard.data(forKey: key),
           let value = try? JSONDecoder().decode(T.self, from: data) {
            subject.send(value)
        }
        
        // Persist on changes
        let cancellable = subject
            .dropFirst()
            .sink { value in
                if let encoded = try? JSONEncoder().encode(value) {
                    UserDefaults.standard.set(encoded, forKey: key)
                    UserDefaults.standard.synchronize()
                }
            }
        
        return (subject, cancellable)
    }
}

