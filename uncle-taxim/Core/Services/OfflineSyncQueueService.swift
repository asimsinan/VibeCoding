import Foundation
import Combine

/// Service to queue and sync operations when offline
class OfflineSyncQueueService: ObservableObject {
    static let shared = OfflineSyncQueueService()
    
    @Published var pendingOperations: [PendingOperation] = []
    @Published var isSyncing: Bool = false
    
    private let dataService: FirebaseDataService
    private let networkMonitor: NetworkMonitorService
    private var cancellables = Set<AnyCancellable>()
    private let queueKey = "offline_sync_queue"
    
    enum OperationType: String, Codable {
        case createRide
        case cancelRide
        case updateRide
    }
    
    struct PendingOperation: Codable, Identifiable {
        let id: String
        let type: OperationType
        let rideData: Data // Encoded Ride data
        let createdAt: Date
        var retryCount: Int
        
        init(id: String = UUID().uuidString, type: OperationType, ride: Ride, retryCount: Int = 0) throws {
            self.id = id
            self.type = type
            self.rideData = try JSONEncoder().encode(ride)
            self.createdAt = Date()
            self.retryCount = retryCount
        }
        
        func toRide() throws -> Ride {
            return try JSONDecoder().decode(Ride.self, from: rideData)
        }
        
        func withIncrementedRetry() -> PendingOperation? {
            guard let ride = try? toRide() else { return nil }
            return try? PendingOperation(id: id, type: type, ride: ride, retryCount: retryCount + 1)
        }
    }
    
    private init() {
        self.dataService = FirebaseDataService()
        self.networkMonitor = NetworkMonitorService.shared
        
        // Load pending operations from disk
        loadPendingOperations()
        
        // Monitor network connectivity and auto-sync when online
        networkMonitor.$isConnected
            .dropFirst() // Skip initial value
            .sink { [weak self] isConnected in
                if isConnected {
                    self?.syncPendingOperations()
                }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Queue Operations
    
    /// Queue a ride creation operation
    func queueCreateRide(_ ride: Ride) throws {
        let operation = try PendingOperation(type: .createRide, ride: ride)
        addOperation(operation)
    }
    
    /// Queue a ride cancellation operation
    func queueCancelRide(_ ride: Ride) throws {
        let operation = try PendingOperation(type: .cancelRide, ride: ride)
        addOperation(operation)
    }
    
    /// Queue a ride update operation
    func queueUpdateRide(_ ride: Ride) throws {
        let operation = try PendingOperation(type: .updateRide, ride: ride)
        addOperation(operation)
    }
    
    private func addOperation(_ operation: PendingOperation) {
        pendingOperations.append(operation)
        savePendingOperations()
    }
    
    // MARK: - Sync Operations
    
    /// Sync all pending operations when online
    func syncPendingOperations() {
        guard networkMonitor.isConnected else {
            return
        }
        
        guard !isSyncing else {
            return // Already syncing
        }
        
        guard !pendingOperations.isEmpty else {
            return // Nothing to sync
        }
        
        isSyncing = true
        
        Task {
            var operationsToRemove: [String] = []
            var operationsToRetry: [PendingOperation] = []
            
            for operation in pendingOperations {
                do {
                    let ride = try operation.toRide()
                    
                    switch operation.type {
                    case .createRide:
                        _ = try await dataService.createRide(ride)
                        operationsToRemove.append(operation.id)
                        
                    case .cancelRide:
                        var cancelledRide = ride
                        // Use the Ride's cancel() method to properly set status
                        if cancelledRide.canBeCancelled() {
                            try cancelledRide.cancel()
                            try await dataService.updateRide(cancelledRide)
                            operationsToRemove.append(operation.id)
                        } else {
                            // Ride can't be cancelled anymore - remove from queue
                            operationsToRemove.append(operation.id)
                        }
                        
                    case .updateRide:
                        try await dataService.updateRide(ride)
                        operationsToRemove.append(operation.id)
                    }
                } catch {
                    // Operation failed - check if we should retry
                    if operation.retryCount < 3 {
                        // Retry up to 3 times
                        if let retryOperation = try? operation.withIncrementedRetry() {
                            operationsToRetry.append(retryOperation)
                        }
                    } else {
                        // Max retries reached - remove from queue
                        operationsToRemove.append(operation.id)
                    }
                }
            }
            
            await MainActor.run {
                // Remove successful operations
                pendingOperations.removeAll { operationsToRemove.contains($0.id) }
                
                // Add retry operations back
                for retryOp in operationsToRetry {
                    if let index = pendingOperations.firstIndex(where: { $0.id == retryOp.id }) {
                        pendingOperations[index] = retryOp
                    } else {
                        pendingOperations.append(retryOp)
                    }
                }
                
                savePendingOperations()
                isSyncing = false
            }
        }
    }
    
    // MARK: - Persistence
    
    private func savePendingOperations() {
        if let encoded = try? JSONEncoder().encode(pendingOperations) {
            UserDefaults.standard.set(encoded, forKey: queueKey)
        }
    }
    
    private func loadPendingOperations() {
        if let data = UserDefaults.standard.data(forKey: queueKey),
           let decoded = try? JSONDecoder().decode([PendingOperation].self, from: data) {
            pendingOperations = decoded
        }
    }
    
    /// Clear all pending operations (for testing/debugging)
    func clearQueue() {
        pendingOperations.removeAll()
        UserDefaults.standard.removeObject(forKey: queueKey)
    }
}

