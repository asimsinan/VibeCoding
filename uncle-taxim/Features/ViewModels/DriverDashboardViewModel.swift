import Foundation
import Combine
import SwiftUI
import FirebaseAuth
import FirebaseFirestore

/// ViewModel for driver dashboard - shows available rides and allows drivers to accept them
class DriverDashboardViewModel: BaseViewModel {
    @Published var availableRides: [Ride] = []
    @Published var myActiveRides: [Ride] = []
    @Published var isCompletingRide: Bool = false
    // isLoading and errorMessage are inherited from BaseViewModel
    
    private let dataService: FirebaseDataService
    private var availableRidesListener: ListenerRegistration?
    private var myRidesListener: ListenerRegistration?
    
    init(dataService: FirebaseDataService = FirebaseDataService()) {
        self.dataService = dataService
        super.init()
    }
    
    deinit {
        availableRidesListener?.remove()
        myRidesListener?.remove()
    }
    
    /// Loads available rides (pending rides without a driver)
    func loadAvailableRides() {
        guard let driverId = getCurrentDriverId() else {
            errorMessage = "Driver not authenticated"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                // Get all pending rides without a driver
                // Note: Firestore doesn't support querying for null/empty strings directly
                // We'll get all pending rides and filter client-side
                let db = Firestore.firestore()
                let snapshot = try await db.collection("rides")
                    .whereField("status", isEqualTo: "pending")
                    .order(by: "createdAt", descending: false)
                    .limit(to: 50)
                    .getDocuments()
                
                let rides = try snapshot.documents.compactMap { doc -> Ride? in
                    var ride = try doc.data(as: Ride.self)
                    // Ensure ID is set
                    if ride.id == nil {
                        ride.id = doc.documentID
                    }
                    // Filter out rides that already have a driver
                    if let driverId = ride.driverId, !driverId.isEmpty {
                        return nil
                    }
                    return ride
                }
                
                await MainActor.run {
                    self.availableRides = rides
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
    
    /// Sets up real-time listener for available rides
    func setupAvailableRidesListener() {
        guard let driverId = getCurrentDriverId() else {
            return
        }
        
        // Remove existing listener
        availableRidesListener?.remove()
        
        let db = Firestore.firestore()
        availableRidesListener = db.collection("rides")
            .whereField("status", isEqualTo: "pending")
            .order(by: "createdAt", descending: false)
            .limit(to: 50)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self = self else { return }
                
                if let error = error {
                    Task { @MainActor in
                        self.errorMessage = error.localizedDescription
                    }
                    return
                }
                
                guard let snapshot = snapshot else { return }
                
                Task {
                    let rides = try snapshot.documents.compactMap { doc -> Ride? in
                        var ride = try doc.data(as: Ride.self)
                        if ride.id == nil {
                            ride.id = doc.documentID
                        }
                        // Filter out rides that already have a driver
                        if ride.driverId != nil && !ride.driverId!.isEmpty {
                            return nil
                        }
                        return ride
                    }
                    
                    await MainActor.run {
                        self.availableRides = rides
                    }
                }
            }
    }
    
    /// Loads active rides for the current driver
    func loadMyActiveRides() {
        guard let driverId = getCurrentDriverId() else {
            return
        }
        
        Task {
            do {
                let db = Firestore.firestore()
                let snapshot = try await db.collection("rides")
                    .whereField("driverId", isEqualTo: driverId)
                    .whereField("status", in: ["accepted", "in_progress"])
                    .order(by: "createdAt", descending: true)
                    .getDocuments()
                
                let rides = try snapshot.documents.compactMap { doc -> Ride? in
                    var ride = try doc.data(as: Ride.self)
                    if ride.id == nil {
                        ride.id = doc.documentID
                    }
                    return ride
                }
                
                await MainActor.run {
                    self.myActiveRides = rides
                    for ride in rides {
                    }
                }
            }
        }
    }
    
    /// Sets up real-time listener for driver's active rides
    func setupMyRidesListener() {
        guard let driverId = getCurrentDriverId() else {
            return
        }
        
        // Remove existing listener
        myRidesListener?.remove()
        
        let db = Firestore.firestore()
        myRidesListener = db.collection("rides")
            .whereField("driverId", isEqualTo: driverId)
            .whereField("status", in: ["accepted", "in_progress"])
            .order(by: "createdAt", descending: true)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self = self else { return }
                
                if let error = error {
                    Task { @MainActor in
                        self.errorMessage = error.localizedDescription
                    }
                    return
                }
                
                guard let snapshot = snapshot else { return }
                
                Task {
                    do {
                        let rides = try snapshot.documents.compactMap { doc -> Ride? in
                            var ride = try doc.data(as: Ride.self)
                            if ride.id == nil {
                                ride.id = doc.documentID
                            }
                            return ride
                        }
                        
                        await MainActor.run {
                            self.myActiveRides = rides
                            for ride in rides {
                            }
                        }
                    }
                }
            }
    }
    
    /// Driver accepts a ride
    func acceptRide(_ ride: Ride) async throws {
        print("🔍 [DEBUG] DriverDashboardViewModel - acceptRide called for ride: \(ride.id ?? "nil")")
        
        guard let driverId = getCurrentDriverId() else {
            print("❌ [ERROR] DriverDashboardViewModel - Driver not authenticated")
            throw DriverError.notAuthenticated("Driver not authenticated")
        }
        
        guard let rideId = ride.id else {
            print("❌ [ERROR] DriverDashboardViewModel - Ride ID is missing")
            throw DriverError.invalidRide("Ride ID is required")
        }
        
        print("🔍 [DEBUG] DriverDashboardViewModel - Driver ID: \(driverId), Ride ID: \(rideId)")
        
        guard ride.status == .pending else {
            print("❌ [ERROR] DriverDashboardViewModel - Ride status is not pending: \(ride.status)")
            throw DriverError.invalidRide("Ride is not pending")
        }
        
        guard ride.driverId == nil || ride.driverId?.isEmpty == true else {
            print("❌ [ERROR] DriverDashboardViewModel - Ride already has a driver: \(ride.driverId ?? "nil")")
            throw DriverError.invalidRide("Ride already has a driver")
        }
        
        // Get the ride from Firestore to ensure we have the latest version
        print("🔍 [DEBUG] DriverDashboardViewModel - Fetching ride from Firestore...")
        guard var updatedRide = try await dataService.getRide(rideId: rideId) else {
            print("❌ [ERROR] DriverDashboardViewModel - Ride not found in Firestore")
            throw DriverError.invalidRide("Ride not found")
        }
        
        // Manually set the ID if it's missing (workaround for @DocumentID not being set)
        // This can happen when decoding from Firestore in some cases
        if updatedRide.id == nil {
            print("⚠️ [WARNING] DriverDashboardViewModel - Fetched ride has no ID, setting it manually from rideId parameter")
            // We can't directly set @DocumentID, but we'll use the rideId parameter when updating
        }
        
        print("🔍 [DEBUG] DriverDashboardViewModel - Fetched ride from Firestore:")
        print("   - Ride ID: \(updatedRide.id ?? "nil (will use rideId parameter)")")
        print("   - Status: \(updatedRide.status)")
        print("   - Driver ID: \(updatedRide.driverId ?? "nil")")
        
        // Use the rideId parameter we already have - don't fail if @DocumentID wasn't set
        // The updateRide function accepts an optional rideId parameter for this case
        
        // Check if ride is still available
        guard updatedRide.status == .pending && (updatedRide.driverId == nil || updatedRide.driverId?.isEmpty == true) else {
            print("❌ [ERROR] DriverDashboardViewModel - Ride is no longer available")
            throw DriverError.invalidRide("Ride is no longer available")
        }
        
        // Fetch driver info to get the name
        var driverName: String? = nil
        do {
            if let driver = try await dataService.getDriver(driverId: driverId) {
                driverName = driver.fullName
                print("✅ [DEBUG] DriverDashboardViewModel - Fetched driver name: \(driverName ?? "nil")")
            } else {
                // Driver document doesn't exist - try to get name from user profile as fallback
                print("⚠️ [WARNING] DriverDashboardViewModel - Driver document not found, trying user profile...")
                if let user = try? await dataService.getUser(userId: driverId) {
                    // Use user's fullName or email as fallback
                    driverName = user.fullName.isEmpty ? user.email.components(separatedBy: "@").first : user.fullName
                    print("✅ [DEBUG] DriverDashboardViewModel - Using user profile name: \(driverName ?? "nil")")
                } else {
                    // Try Firebase Auth displayName first, then email
                    if let firebaseUser = Auth.auth().currentUser {
                        driverName = firebaseUser.displayName ?? firebaseUser.email?.components(separatedBy: "@").first
                        print("✅ [DEBUG] DriverDashboardViewModel - Using Firebase Auth displayName: \(driverName ?? "nil")")
                    }
                }
            }
        } catch {
            print("⚠️ [WARNING] DriverDashboardViewModel - Could not fetch driver name: \(error)")
            // Try fallback to user profile
            do {
                if let user = try? await dataService.getUser(userId: driverId) {
                    driverName = user.fullName.isEmpty ? user.email.components(separatedBy: "@").first : user.fullName
                    print("✅ [DEBUG] DriverDashboardViewModel - Using user profile as fallback: \(driverName ?? "nil")")
                } else if let firebaseUser = Auth.auth().currentUser {
                    driverName = firebaseUser.displayName ?? firebaseUser.email?.components(separatedBy: "@").first
                    print("✅ [DEBUG] DriverDashboardViewModel - Using Firebase Auth displayName as fallback: \(driverName ?? "nil")")
                }
            }
        }
        
        // Accept the ride
        print("🔍 [DEBUG] DriverDashboardViewModel - Accepting ride...")
        print("🔍 [DEBUG] DriverDashboardViewModel - Ride ID before accept: \(updatedRide.id ?? "nil")")
        try updatedRide.accept(driverId: driverId, driverName: driverName)
        print("🔍 [DEBUG] DriverDashboardViewModel - Ride accepted locally. Status: \(updatedRide.status), driverId: \(updatedRide.driverId ?? "nil"), driverName: \(updatedRide.driverName ?? "nil")")
        print("🔍 [DEBUG] DriverDashboardViewModel - Ride ID after accept: \(updatedRide.id ?? "nil")")
        
        // If the ID was lost during accept(), we'll use the rideId parameter when updating
        // This can happen with @DocumentID property wrappers when structs are mutated
        if updatedRide.id == nil {
            print("⚠️ [WARNING] DriverDashboardViewModel - Ride ID was lost after accept(), will use rideId parameter: \(rideId)")
        }
        
        // Use the original rideId parameter to ensure we have the ID
        // The @DocumentID might be lost during mutation, but we can pass the ID as a parameter
        print("🔍 [DEBUG] DriverDashboardViewModel - Updating ride in Firestore with ID: \(rideId)")
        
        do {
            // Pass rideId as parameter in case @DocumentID was lost during mutation
            try await dataService.updateRide(updatedRide, rideId: rideId)
            print("✅ [DEBUG] DriverDashboardViewModel - Ride updated successfully in Firestore")
        } catch {
            print("❌ [ERROR] DriverDashboardViewModel - Failed to update ride in Firestore: \(error)")
            print("❌ [ERROR] Error type: \(type(of: error))")
            if let nsError = error as NSError? {
                print("❌ [ERROR] Error domain: \(nsError.domain), code: \(nsError.code)")
                print("❌ [ERROR] Error userInfo: \(nsError.userInfo)")
            }
            throw error // Re-throw to be caught by the view
        }
        
        
        // Optimistic update: immediately update both lists
        await MainActor.run {
            // Remove accepted ride from available list
            self.availableRides.removeAll { $0.id == rideId }
            
            // Add to my active rides immediately (optimistic update)
            // Check if it's not already in the list
            if !self.myActiveRides.contains(where: { $0.id == rideId }) {
                self.myActiveRides.insert(updatedRide, at: 0) // Add at the beginning
            }
        }
        
        // Reload active rides to sync with Firestore (the listener will also update it)
        // This ensures we have the latest data from Firestore
        await loadMyActiveRides()
    }
    
    /// Driver starts a ride (picks up passenger)
    func startRide(_ ride: Ride) async throws {
        guard let driverId = getCurrentDriverId() else {
            throw DriverError.notAuthenticated("Driver not authenticated")
        }
        
        guard let rideId = ride.id else {
            throw DriverError.invalidRide("Ride ID is required")
        }
        
        guard ride.driverId == driverId else {
            throw DriverError.invalidRide("Driver does not own this ride")
        }
        
        guard ride.status == .accepted else {
            throw DriverError.invalidRide("Ride must be accepted before starting")
        }
        
        guard var updatedRide = try await dataService.getRide(rideId: rideId) else {
            throw DriverError.invalidRide("Ride not found")
        }
        
        // Log the fetched ride state
        print("🔍 [DEBUG] DriverDashboardViewModel - Fetched ride for start:")
        print("   - Ride ID: \(updatedRide.id ?? "nil (will use rideId parameter)")")
        print("   - Status: \(updatedRide.status)")
        print("   - Driver ID: \(updatedRide.driverId ?? "nil")")
        
        try updatedRide.start()
        print("🔍 [DEBUG] DriverDashboardViewModel - Ride started locally. Status: \(updatedRide.status)")
        
        // Pass rideId as parameter in case @DocumentID was lost during fetch or mutation
        try await dataService.updateRide(updatedRide, rideId: rideId)
        
        
        // Optimistic update: immediately update the ride in myActiveRides
        await MainActor.run {
            if let index = self.myActiveRides.firstIndex(where: { $0.id == rideId }) {
                self.myActiveRides[index] = updatedRide
            }
        }
        
        // Reload active rides to sync with Firestore (the listener will also update it)
        await loadMyActiveRides()
    }
    
    // Success message for ride completion with payment info
    @Published var completionSuccessMessage: String?
    @Published var showCompletionSuccess: Bool = false
    @Published var paymentAmount: String? // Store payment amount separately for the popup
    
    /// Driver completes a ride
    func completeRide(_ ride: Ride, actualPrice: Double, actualDuration: Int) async throws {
        // Set loading state
        await MainActor.run {
            self.isCompletingRide = true
        }
        
        defer {
            Task { @MainActor in
                self.isCompletingRide = false
            }
        }
        
        guard let driverId = getCurrentDriverId() else {
            throw DriverError.notAuthenticated("Driver not authenticated")
        }
        
        guard let rideId = ride.id else {
            throw DriverError.invalidRide("Ride ID is required")
        }
        
        guard ride.driverId == driverId else {
            throw DriverError.invalidRide("Driver does not own this ride")
        }
        
        guard var updatedRide = try await dataService.getRide(rideId: rideId) else {
            throw DriverError.invalidRide("Ride not found")
        }
        
        // Process payment BEFORE completing the ride
        // This ensures payment is successful before allowing completion
        print("🔍 [DEBUG] DriverDashboardViewModel - Processing payment before ride completion...")
        
        // Set actual price on the ride before processing payment
        // We'll use this for payment processing
        var rideForPayment = updatedRide
        rideForPayment.actualPrice = actualPrice
        
        do {
            // Process payment - this will throw if payment fails
            let paymentSuccess = try await dataService.processPaymentForRideCompletion(rideForPayment, rideId: rideId)
            
            if !paymentSuccess {
                throw DriverError.paymentFailed("Payment processing failed. Please try again.")
            }
            
            print("✅ [DEBUG] DriverDashboardViewModel - Payment processed successfully, proceeding with ride completion")
        } catch {
            print("❌ [ERROR] DriverDashboardViewModel - Payment processing failed: \(error.localizedDescription)")
            throw DriverError.paymentFailed(error.localizedDescription)
        }
        
        // Payment successful - now complete the ride
        print("🔍 [DEBUG] DriverDashboardViewModel - Payment successful, completing ride...")
        print("   - Ride ID: \(updatedRide.id ?? "nil (will use rideId parameter)")")
        print("   - Status: \(updatedRide.status)")
        
        // Use estimated distance as actual distance if not provided
        try updatedRide.complete(actualPrice: actualPrice, actualDuration: actualDuration, actualDistance: updatedRide.estimatedDistance)
        print("🔍 [DEBUG] DriverDashboardViewModel - Ride completed locally. Status: \(updatedRide.status)")
        
        // Pass rideId as parameter in case @DocumentID was lost during fetch or mutation
        try await dataService.updateRide(updatedRide, rideId: rideId)
        
        // Get the successful payment transaction for the success message
        let transactions = try await dataService.getRideTransactions(rideId: rideId)
        let paymentTransaction = transactions.first { $0.type == .charge && $0.status == .succeeded }
        
        // Extract payment amount separately (without emoji)
        let extractedPaymentAmount: String?
        if let paymentTransaction = paymentTransaction {
            print("✅ [DEBUG] DriverDashboardViewModel - Payment transaction found: \(paymentTransaction.amount), status: \(paymentTransaction.status)")
            extractedPaymentAmount = paymentTransaction.formattedAmount
        } else {
            extractedPaymentAmount = nil
        }
        
        // Optimistic update: immediately remove from myActiveRides (since it's now completed)
        // This makes it disappear from "My Rides" immediately
        await MainActor.run {
            self.myActiveRides.removeAll { $0.id == rideId }
            self.paymentAmount = extractedPaymentAmount
            self.showCompletionSuccess = true
        }
        
        // Reload active rides to sync with Firestore (the listener will also update it)
        // The ride will now appear in trip summary history automatically
        await loadMyActiveRides()
    }
    
    private func getCurrentDriverId() -> String? {
        // For now, use the authenticated user's ID
        // In a real app, you'd check if the user is a driver
        return Auth.auth().currentUser?.uid
    }
}

enum DriverError: LocalizedError {
    case notAuthenticated(String)
    case invalidRide(String)
    case paymentFailed(String)
    case paymentProcessing(String)
    
    var errorDescription: String? {
        switch self {
        case .notAuthenticated(let message):
            return message
        case .invalidRide(let message):
            return message
        case .paymentFailed(let message):
            return message
        case .paymentProcessing(let message):
            return message
        }
    }
}

