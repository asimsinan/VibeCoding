import Foundation
import Combine
import SwiftUI
import FirebaseFirestore
import FirebaseAuth

class RideSuggestionsViewModel: ObservableObject {
    @Published var suggestions: [RideSuggestion] = []
    @Published var isLoading: Bool = false
    @Published var selectedSuggestion: RideSuggestion?
    @Published var errorMessage: String?
    @Published var lastUpdated: Date?
    @Published var isDataFromCache: Bool = false
    
    private let rankingService: RideRankingService
    private let dataService: FirebaseDataService
    private let networkMonitor = NetworkMonitorService.shared
    private var cancellables = Set<AnyCancellable>()
    
    init(
        rankingService: RideRankingService = RideRankingService(),
        dataService: FirebaseDataService = FirebaseDataService()
    ) {
        self.rankingService = rankingService
        self.dataService = dataService
    }
    
    func loadSuggestions() {
        Task { @MainActor in
            isLoading = true
            errorMessage = nil
        }
        
        Task {
            do {
                let fetched = try await fetchSuggestions()
                let ranked = rankingService.rankRideSuggestions(
                    fetched,
                    userPreferences: getUserPreferences()
                )
                
                await MainActor.run {
                    self.suggestions = ranked
                    self.lastUpdated = Date()
                    self.isDataFromCache = !networkMonitor.isConnected
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
    
    func selectSuggestion(_ suggestion: RideSuggestion) {
        selectedSuggestion = suggestion
    }
    
    private func fetchSuggestions() async throws -> [RideSuggestion] {
        // Real Firestore query through data service
        guard let userId = getCurrentUserId() else {
            throw RideSuggestionsError.userNotAuthenticated
        }
        
        
        // Query Firestore for ride suggestions - using real Firestore queries
        // Only get suggestions that are not accepted
        let db = Firestore.firestore()
        
        do {
            let snapshot = try await db.collection("rideSuggestions")
                .whereField("userId", isEqualTo: userId)
                .whereField("isAccepted", isEqualTo: false)
                .order(by: "createdAt", descending: true)
                .getDocuments()
            
            // Filter out expired suggestions client-side (since Firestore doesn't support date comparisons easily)
            let now = Date()
            let allSuggestions = try snapshot.documents.compactMap { doc -> RideSuggestion? in
                do {
                    return try doc.data(as: RideSuggestion.self)
                } catch {
                    #if DEBUG
                    print("⚠️ [DEBUG] RideSuggestionsViewModel - Failed to decode suggestion: \(error)")
                    #endif
                    return nil
                }
            }
            
            #if DEBUG
            print("🔍 [DEBUG] RideSuggestionsViewModel - Fetched \(allSuggestions.count) suggestions from Firestore")
            print("   - Current time: \(now)")
            for suggestion in allSuggestions {
                print("   - Suggestion ID: \(suggestion.id ?? "nil")")
                print("     - isAccepted: \(suggestion.isAccepted)")
                print("     - expiresAt: \(suggestion.expiresAt)")
                print("     - isExpired: \(suggestion.isExpired())")
                print("     - canBeAccepted: \(suggestion.canBeAccepted())")
            }
            #endif
            
            // Filter: only return suggestions that haven't expired
            let validSuggestions = allSuggestions.filter { suggestion in
                let isValid = !suggestion.isExpired()
                #if DEBUG
                if !isValid {
                    print("   - Filtered out expired suggestion: \(suggestion.id ?? "nil")")
                }
                #endif
                return isValid
            }
            
            #if DEBUG
            print("✅ [DEBUG] RideSuggestionsViewModel - Returning \(validSuggestions.count) valid (non-expired) suggestions")
            #endif
            
            return validSuggestions
        } catch {
            
            // Check for specific Firestore errors
            if let error = error as NSError?,
               error.domain == "FIRFirestoreErrorDomain" {
                switch error.code {
                case 7: // Permission denied
                    throw RideSuggestionsError.insufficientPermissions
                case 9: // Index required
                    // Extract the index creation URL from the error
                    if let indexUrl = error.userInfo["NSLocalizedDescription"] as? String,
                       let urlRange = indexUrl.range(of: "https://"),
                       let urlEnd = indexUrl.range(of: "\"", range: urlRange.upperBound..<indexUrl.endIndex) {
                        let url = String(indexUrl[urlRange.lowerBound..<urlEnd.upperBound])
                        throw RideSuggestionsError.indexRequired(url)
                    } else {
                        throw RideSuggestionsError.indexRequired(nil)
                    }
                default:
                    throw error
                }
            }
            throw error
        }
    }
    
    private func getUserPreferences() -> UserPreferences {
        // Placeholder - in real implementation, fetch from data service
        return UserPreferences(userId: getCurrentUserId() ?? "user123")
    }
    
    private func getCurrentUserId() -> String? {
        // Get the actual Firebase Auth user ID
        return Auth.auth().currentUser?.uid
    }
    
    /// Deletes all ride suggestions for the current user
    func resetSuggestions() async throws -> Int {
        guard let userId = getCurrentUserId() else {
            throw RideSuggestionsError.userNotAuthenticated
        }
        
        let deletedCount = try await dataService.deleteUserRideSuggestions(userId: userId)
        
        // Reload suggestions after deletion
        await MainActor.run {
            self.suggestions = []
        }
        
        return deletedCount
    }
}

enum RideSuggestionsError: Error, LocalizedError {
    case userNotAuthenticated
    case insufficientPermissions
    case indexRequired(String?)
    
    var errorDescription: String? {
        switch self {
        case .userNotAuthenticated:
            return "Please sign in to view ride suggestions"
        case .insufficientPermissions:
            return "Missing or insufficient permissions. Please check your Firestore security rules or contact support."
        case .indexRequired(let url):
            if let url = url {
                return "A Firestore index is required for this query. The index is being created automatically. Please wait a few minutes and try again. If the issue persists, you can check the index status here: \(url)"
            } else {
                return "A Firestore index is required for this query. The index is being created automatically. Please wait a few minutes and try again."
            }
        }
    }
}

