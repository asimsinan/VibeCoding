import Foundation
import Combine
import SwiftUI
import FirebaseAuth

class ProfileViewModel: ObservableObject {
    @Published var user: User?
    @Published var userPreferences: UserPreferences?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    private let dataService: FirebaseDataService
    private var cancellables = Set<AnyCancellable>()
    
    init(dataService: FirebaseDataService = FirebaseDataService()) {
        self.dataService = dataService
    }
    
    func loadProfile() {
        guard let userId = getCurrentUserId() else {
            Task { @MainActor in
                errorMessage = "User not authenticated"
                isLoading = false
            }
            return
        }
        
        
        Task { @MainActor in
            isLoading = true
            errorMessage = nil
        }
        
        Task {
            do {
                let fetchedUser = try await dataService.getUser(userId: userId)
                
                
                
                let preferences = try await fetchUserPreferences(userId: userId)
                
                await MainActor.run {
                    self.user = fetchedUser
                    self.userPreferences = preferences
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }
    
    func updatePreferences(_ preferences: UserPreferences) {
        userPreferences = preferences
        
        Task {
            do {
                try await dataService.updateUserPreferences(preferences)
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    private func fetchUserPreferences(userId: String) async throws -> UserPreferences {
        if let preferences = try await dataService.getUserPreferences(userId: userId) {
            return preferences
        } else {
            // Create default preferences if none exist
            let defaultPreferences = UserPreferences(userId: userId)
            return try await dataService.createUserPreferences(defaultPreferences)
        }
    }
    
    private func getCurrentUserId() -> String? {
        // Get the actual Firebase Auth user ID
        return Auth.auth().currentUser?.uid
    }
}

