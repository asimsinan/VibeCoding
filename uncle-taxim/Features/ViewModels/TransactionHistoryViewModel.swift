import Foundation
import FirebaseAuth
import Combine

class TransactionHistoryViewModel: BaseViewModel {
    @Published var transactions: [Transaction] = []
    @Published var isDataFromCache: Bool = false
    @Published var lastUpdated: Date?
    
    private let dataService: FirebaseDataService
    
    init(dataService: FirebaseDataService = FirebaseDataService()) {
        self.dataService = dataService
        super.init()
    }
    
    func loadTransactions() {
        guard let userId = Auth.auth().currentUser?.uid else {
            errorMessage = "User not authenticated"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let fetchedTransactions = try await dataService.getUserTransactions(userId: userId, limit: 100)
                
                await MainActor.run {
                    self.transactions = fetchedTransactions
                    self.isDataFromCache = NetworkMonitorService.shared.isConnected ? false : true
                    self.lastUpdated = Date()
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = "Failed to load transactions: \(error.localizedDescription)"
                    self.isLoading = false
                }
            }
        }
    }
    
    func getTransactions(for rideId: String) -> [Transaction] {
        return transactions.filter { $0.rideId == rideId }
    }
}

