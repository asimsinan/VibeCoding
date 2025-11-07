import Foundation
import Combine
import SwiftUI
import FirebaseAuth

class TripSummaryViewModel: ObservableObject {
    @Published var tripSummary: TripSummary?
    @Published var summaries: [TripSummary] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var lastUpdated: Date?
    @Published var isDataFromCache: Bool = false
    
    private let tripService: TripSummaryServiceProtocol
    private let dataService: FirebaseDataService
    private let networkMonitor = NetworkMonitorService.shared
    private var cancellables = Set<AnyCancellable>()
    
    init(tripService: TripSummaryServiceProtocol? = nil, dataService: FirebaseDataService = FirebaseDataService()) {
        self.dataService = dataService
        self.tripService = tripService ?? TripSummaryService(dataService: dataService)
    }
    
    func loadSummaries() {
        guard let userId = getCurrentUserId() else {
            Task { @MainActor in
                self.errorMessage = "User not authenticated"
            }
            return
        }
        
        Task { @MainActor in
            self.isLoading = true
            self.errorMessage = nil
        }
        
        Task {
            do {
                // Load trip summaries from Firestore
                var fetched = try await dataService.getUserTripSummaries(userId: userId)
                
                // Enrich summaries with ride type if missing (for CO₂ calculation)
                for index in fetched.indices {
                    if fetched[index].tripSummary.rideType == nil {
                        if let ride = try? await dataService.getRide(rideId: fetched[index].rideId) {
                            var updatedDetails = fetched[index].tripSummary
                            updatedDetails.rideType = ride.rideType
                            var updatedSummary = fetched[index]
                            updatedSummary.tripSummary = updatedDetails
                            fetched[index] = updatedSummary
                        }
                    }
                }
                
                await MainActor.run {
                    self.summaries = fetched
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
    
    func loadSummary(rideId: String) {
        guard let userId = getCurrentUserId() else {
            Task { @MainActor in
                self.errorMessage = "User not authenticated"
            }
            return
        }
        
        Task { @MainActor in
            self.isLoading = true
            self.errorMessage = nil
        }
        
        Task {
            do {
                // First, get the driver ID from the ride
                guard let driverId = try await getDriverId(for: rideId) else {
                    await MainActor.run {
                        self.errorMessage = "Could not find driver for this ride"
                        self.isLoading = false
                    }
                    return
                }
                
                let summary = try await tripService.generateTripSummary(
                    rideId: rideId,
                    userId: userId,
                    driverId: driverId
                )
                
                await MainActor.run {
                    self.tripSummary = summary
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
    
    private func getCurrentUserId() -> String? {
        // Get the actual Firebase Auth user ID
        return Auth.auth().currentUser?.uid
    }
    
    private func getDriverId(for rideId: String) async throws -> String? {
        // Fetch the ride to get the driver ID
        guard let ride = try await dataService.getRide(rideId: rideId) else {
            return nil
        }
        
        if let driverId = ride.driverId, !driverId.isEmpty {
            return driverId
        } else {
            // Return a placeholder if no driver is assigned (for pending rides)
            return nil
        }
    }
}

