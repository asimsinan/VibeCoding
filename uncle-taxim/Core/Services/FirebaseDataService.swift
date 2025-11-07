import Foundation
import FirebaseFirestore
import FirebaseCore
import FirebaseAuth
import Combine
import Network

protocol DataServiceProtocol {
    associatedtype Entity: FirestoreCodable
    
    func create(_ entity: Entity) async throws -> Entity
    func get(id: String) async throws -> Entity?
    func update(_ entity: Entity) async throws
    func delete(id: String) async throws
}

class FirebaseDataService {
    private let authService: FirebaseAuthServiceProtocol
    private let authorizationService: AuthorizationServiceProtocol
    
    // Store provided db if any
    private var _db: Firestore?
    
    init(
        db: Firestore? = nil,
        authService: FirebaseAuthServiceProtocol? = nil,
        authorizationService: AuthorizationServiceProtocol? = nil
    ) {
        // Use provided db if available
        self._db = db
        
        // Use provided authService or create FirebaseAuthService
        // FirebaseAuthService will create FirebaseDataService lazily when needed, breaking the cycle
        if let authService = authService {
            self.authService = authService
        } else {
            // Create FirebaseAuthService without dataService - it will create it lazily
            // This breaks the circular dependency during initialization
            self.authService = FirebaseAuthService(dataService: nil)
        }
        
        // Create authorization service with the auth service
        if let authorizationService = authorizationService {
            self.authorizationService = authorizationService
        } else {
            // Create AuthorizationService - it needs FirebaseAuthServiceProtocol
            if let firebaseAuthService = self.authService as? FirebaseAuthService {
                self.authorizationService = AuthorizationService(authService: firebaseAuthService)
            } else {
                // Fallback - create a basic authorization service
                self.authorizationService = AuthorizationService(authService: self.authService)
            }
        }
    }
    
    // Lazy initialization that ensures Firebase is configured first
    private lazy var db: Firestore = {
        // Ensure Firebase is configured before accessing Firestore
        if FirebaseApp.app() == nil {
            // If Firebase isn't configured, try to configure it
            FirebaseConfigManager.configure()
            
            // Check again after configuration attempt
            if FirebaseApp.app() == nil {
                // Return a Firestore instance anyway - it will fail when used, but won't crash here
            }
        }
        
        let firestore = Firestore.firestore()
        
        // Configure offline persistence and caching
        let settings = firestore.settings
        // Note: In modern Firestore, persistence is enabled by default
        // Cache size: 100 MB (default is 40 MB) - enough for ride data, trip history, and saved destinations
        settings.cacheSizeBytes = 100 * 1024 * 1024 // 100 MB
        
        // Enable network persistence (allows reads/writes when offline)
        // This is the default behavior, but we set it explicitly for clarity
        firestore.settings = settings
        
        return firestore
    }()
    
    // Computed property that uses stored db or lazy db
    private var dbInstance: Firestore {
        if let storedDb = _db {
            return storedDb
        }
        return db
    }
    
    /// Ensure user is authenticated before operations
    private func requireAuthentication() throws {
        guard authService.isAuthenticated() else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
    }
    
    // MARK: - Generic CRUD Operations
    
    private func createEntity<T: FirestoreCodable>(
        _ entity: T,
        in collection: String
    ) async throws -> T {
        var newEntity = entity
        try newEntity.validate()
        
        let docRef = dbInstance.collection(collection).document()
        newEntity.id = docRef.documentID
        
        try await docRef.setData(from: newEntity)
        return newEntity
    }
    
    private func getEntity<T: FirestoreCodable>(
        _ type: T.Type,
        id: String,
        from collection: String
    ) async throws -> T? {
        let docRef = dbInstance.collection(collection).document(id)
        let snapshot = try await docRef.getDocument()
        
        guard snapshot.exists else { return nil }
        
        // Use snapshot.data(as:) which automatically handles @DocumentID
        var entity = try snapshot.data(as: T.self)
        
        // Workaround: If @DocumentID wasn't set (can happen in some cases),
        // we need to manually ensure the ID is available for updates
        // Note: We can't directly set @DocumentID, but we'll handle this in updateRide
        // by passing the ID as a parameter
        
        return entity
    }
    
    private func updateEntity<T: FirestoreCodable>(
        _ entity: T,
        in collection: String
    ) async throws {
        guard let id = entity.id else {
            throw DataServiceError.invalidId("Entity ID is required")
        }
        try entity.validate()
        
        let docRef = dbInstance.collection(collection).document(id)
        try await docRef.setData(from: entity, merge: true)
    }
    
    private func deleteEntity(
        id: String,
        from collection: String
    ) async throws {
        let docRef = dbInstance.collection(collection).document(id)
        try await docRef.delete()
    }
    
    // MARK: - User Operations
    
    func createUser(_ user: User) async throws -> User {
        
        guard let userId = user.id, !userId.isEmpty else {
            throw DataServiceError.invalidId("User ID is required")
        }
        
        // During initial registration, the user is authenticated but authService might not reflect it yet
        // So we check Firebase Auth directly instead of using requireAuthentication()
        if let firebaseUser = Auth.auth().currentUser {
            
        }
        
        // For initial user creation, we allow it if the user ID matches the current Firebase Auth user
        // or if there's no auth check (during registration)
        guard authorizationService.canAccessUserData(
            userId: userId,
            targetUserId: userId
        ) else {
            throw DataServiceError.authorizationFailed("User cannot create this user data")
        }
        
        // Create user with specific document ID (Firebase Auth UID)
        var newUser = user
        try newUser.validate()
        
        let docRef = dbInstance.collection("users").document(userId)
        try await docRef.setData(from: newUser)
        
        // Return user with ID set
        newUser.id = userId
        return newUser
    }
    
    func getUser(userId: String) async throws -> User? {
        try requireAuthentication()
        guard authorizationService.canAccessUserData(
            userId: userId,
            targetUserId: userId
        ) else {
            throw DataServiceError.authorizationFailed("User cannot access this user data")
        }
        return try await getEntity(User.self, id: userId, from: "users")
    }
    
    func updateUser(_ user: User) async throws {
        try requireAuthentication()
        guard let userId = user.id else {
            throw DataServiceError.invalidId("User ID is required")
        }
        guard authorizationService.canAccessUserData(
            userId: userId,
            targetUserId: userId
        ) else {
            throw DataServiceError.authorizationFailed("User cannot update this user data")
        }
        try await updateEntity(user, in: "users")
    }
    
    func deleteUser(userId: String) async throws {
        try requireAuthentication()
        guard authorizationService.canAccessUserData(
            userId: userId,
            targetUserId: userId
        ) else {
            throw DataServiceError.authorizationFailed("User cannot delete this user data")
        }
        try await deleteEntity(id: userId, from: "users")
    }
    
    // MARK: - User Preferences Operations
    
    func getUserPreferences(userId: String) async throws -> UserPreferences? {
        try requireAuthentication()
        guard authorizationService.canAccessUserData(
            userId: userId,
            targetUserId: userId
        ) else {
            throw DataServiceError.authorizationFailed("User cannot access this user preferences")
        }
        return try await getEntity(UserPreferences.self, id: userId, from: "userPreferences")
    }
    
    func updateUserPreferences(_ preferences: UserPreferences) async throws {
        try requireAuthentication()
        guard !preferences.userId.isEmpty else {
            throw DataServiceError.invalidId("User ID is required")
        }
        guard authorizationService.canAccessUserData(
            userId: preferences.userId,
            targetUserId: preferences.userId
        ) else {
            throw DataServiceError.authorizationFailed("User cannot update this user preferences")
        }
        var prefs = preferences
        prefs.id = preferences.userId
        try await updateEntity(prefs, in: "userPreferences")
    }
    
    func createUserPreferences(_ preferences: UserPreferences) async throws -> UserPreferences {
        try requireAuthentication()
        guard !preferences.userId.isEmpty else {
            throw DataServiceError.invalidId("User ID is required")
        }
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard preferences.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only create preferences for themselves")
        }
        
        // For userPreferences, the document ID must be the userId
        // So we create the document with a specific ID instead of using createEntity
        var prefs = preferences
        prefs.id = preferences.userId
        try prefs.validate()
        
        let docRef = dbInstance.collection("userPreferences").document(preferences.userId)
        try await docRef.setData(from: prefs)
        
        return prefs
    }
    
    // MARK: - Driver Operations
    
    func createDriver(_ driver: Driver) async throws -> Driver {
        return try await createEntity(driver, in: "drivers")
    }
    
    func getDriver(driverId: String) async throws -> Driver? {
        return try await getEntity(Driver.self, id: driverId, from: "drivers")
    }
    
    func getAvailableDrivers() async throws -> [Driver] {
        let snapshot = try await dbInstance.collection("drivers")
            .whereField("isAvailable", isEqualTo: true)
            .getDocuments()
        
        return try snapshot.documents.compactMap { doc in
            try doc.data(as: Driver.self)
        }
    }
    
    // MARK: - Ride Operations
    
    func createRide(_ ride: Ride) async throws -> Ride {
        try requireAuthentication()
        // Verify the user is creating a ride for themselves
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard ride.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only create rides for themselves")
        }
        
        // Check if offline - queue operation if so
        if !NetworkMonitorService.shared.isConnected {
            try OfflineSyncQueueService.shared.queueCreateRide(ride)
            // Return the ride with a temporary ID to indicate it's queued
            var queuedRide = ride
            queuedRide.id = "queued_\(UUID().uuidString)"
            return queuedRide
        }
        
        // Ride ID will be generated by createEntity
        do {
            return try await createEntity(ride, in: "rides")
        } catch {
            // If network error, queue the operation
            if let nsError = error as NSError?,
               nsError.domain == NSURLErrorDomain || nsError.code == 7 { // Network error or permission error
                try OfflineSyncQueueService.shared.queueCreateRide(ride)
                var queuedRide = ride
                queuedRide.id = "queued_\(UUID().uuidString)"
                return queuedRide
            }
            throw error
        }
    }
    
    func createRideSuggestion(_ suggestion: RideSuggestion) async throws -> RideSuggestion {
        try requireAuthentication()
        // Verify the user is creating a suggestion for themselves
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard suggestion.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only create suggestions for themselves")
        }
        // Suggestion ID will be generated by createEntity
        return try await createEntity(suggestion, in: "rideSuggestions")
    }
    
    func getRideSuggestion(suggestionId: String) async throws -> RideSuggestion? {
        try requireAuthentication()
        return try await getEntity(RideSuggestion.self, id: suggestionId, from: "rideSuggestions")
    }
    
    func updateRideSuggestion(_ suggestion: RideSuggestion) async throws {
        try requireAuthentication()
        guard let suggestionId = suggestion.id else {
            throw DataServiceError.invalidId("Suggestion ID is required")
        }
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard suggestion.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only update their own suggestions")
        }
        try await updateEntity(suggestion, in: "rideSuggestions")
    }
    
    func deleteUserRideSuggestions(userId: String) async throws -> Int {
        try requireAuthentication()
        guard authorizationService.canAccessUserData(userId: userId, targetUserId: userId) else {
            throw DataServiceError.authorizationFailed("User cannot delete these suggestions")
        }
        
        // Get all suggestions for this user
        let snapshot = try await dbInstance.collection("rideSuggestions")
            .whereField("userId", isEqualTo: userId)
            .getDocuments()
        
        // Delete each suggestion
        var deletedCount = 0
        for doc in snapshot.documents {
            try await doc.reference.delete()
            deletedCount += 1
        }
        
        return deletedCount
    }
    
    // MARK: - Saved Addresses Operations
    
    func getSavedAddresses(userId: String) async throws -> [SavedAddress] {
        try requireAuthentication()
        guard authorizationService.canAccessUserData(userId: userId, targetUserId: userId) else {
            throw DataServiceError.authorizationFailed("User cannot access these saved addresses")
        }
        
        let source: FirestoreSource = NetworkMonitorService.shared.isConnected ? .default : .cache
        let snapshot = try await dbInstance.collection("savedAddresses")
            .whereField("userId", isEqualTo: userId)
            .order(by: "isDefault", descending: true)
            .order(by: "name", descending: false)
            .getDocuments(source: source)
        
        return try snapshot.documents.compactMap { doc in
            var address = try doc.data(as: SavedAddress.self)
            address.id = doc.documentID
            return address
        }
    }
    
    func createSavedAddress(_ address: SavedAddress) async throws -> SavedAddress {
        try requireAuthentication()
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard address.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only create addresses for themselves")
        }
        
        // If this is set as default, unset other defaults
        if address.isDefault {
            try await unsetOtherDefaults(userId: currentUserId)
        }
        
        return try await createEntity(address, in: "savedAddresses")
    }
    
    func updateSavedAddress(_ address: SavedAddress) async throws {
        try requireAuthentication()
        guard let addressId = address.id else {
            throw DataServiceError.invalidId("Address ID is required")
        }
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard address.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only update their own addresses")
        }
        
        // If this is set as default, unset other defaults
        if address.isDefault {
            try await unsetOtherDefaults(userId: currentUserId, excluding: addressId)
        }
        
        try await updateEntity(address, in: "savedAddresses")
    }
    
    func deleteSavedAddress(addressId: String) async throws {
        try requireAuthentication()
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        
        // Verify the address belongs to the user
        guard let address = try? await getEntity(SavedAddress.self, id: addressId, from: "savedAddresses"),
              address.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only delete their own addresses")
        }
        
        try await deleteEntity(id: addressId, from: "savedAddresses")
    }
    
    private func unsetOtherDefaults(userId: String, excluding addressId: String? = nil) async throws {
        let snapshot = try await dbInstance.collection("savedAddresses")
            .whereField("userId", isEqualTo: userId)
            .whereField("isDefault", isEqualTo: true)
            .getDocuments()

        for doc in snapshot.documents {
            if let excludeId = addressId, doc.documentID == excludeId {
                continue
            }
            try await doc.reference.updateData(["isDefault": false])
        }
    }
    
    // MARK: - Payment Methods Operations
    
    func getPaymentMethods(userId: String) async throws -> [PaymentMethod] {
        try requireAuthentication()
        guard authorizationService.canAccessUserData(userId: userId, targetUserId: userId) else {
            throw DataServiceError.authorizationFailed("User cannot access these payment methods")
        }
        
        let source: FirestoreSource = NetworkMonitorService.shared.isConnected ? .default : .cache
        let snapshot = try await dbInstance.collection("paymentMethods")
            .whereField("userId", isEqualTo: userId)
            .order(by: "isDefault", descending: true)
            .order(by: "createdAt", descending: true)
            .getDocuments(source: source)
        
        return try snapshot.documents.compactMap { doc in
            var method = try doc.data(as: PaymentMethod.self)
            method.id = doc.documentID
            return method
        }
    }
    
    func createPaymentMethod(_ method: PaymentMethod) async throws -> PaymentMethod {
        try requireAuthentication()
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard method.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only create payment methods for themselves")
        }
        
        // If this is set as default, unset other defaults
        if method.isDefault {
            try await unsetOtherDefaultPaymentMethods(userId: currentUserId)
        }
        
        return try await createEntity(method, in: "paymentMethods")
    }
    
    func updatePaymentMethod(_ method: PaymentMethod) async throws {
        try requireAuthentication()
        guard let methodId = method.id else {
            throw DataServiceError.invalidId("Payment method ID is required")
        }
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard method.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only update their own payment methods")
        }
        
        // If this is set as default, unset other defaults
        if method.isDefault {
            try await unsetOtherDefaultPaymentMethods(userId: currentUserId, excluding: methodId)
        }
        
        try await updateEntity(method, in: "paymentMethods")
    }
    
    func deletePaymentMethod(methodId: String) async throws {
        try requireAuthentication()
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        
        // Verify the payment method belongs to the user
        guard let method = try? await getEntity(PaymentMethod.self, id: methodId, from: "paymentMethods"),
              method.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only delete their own payment methods")
        }
        
        try await deleteEntity(id: methodId, from: "paymentMethods")
    }
    
    private func unsetOtherDefaultPaymentMethods(userId: String, excluding methodId: String? = nil) async throws {
        let snapshot = try await dbInstance.collection("paymentMethods")
            .whereField("userId", isEqualTo: userId)
            .whereField("isDefault", isEqualTo: true)
            .getDocuments()
        
        for doc in snapshot.documents {
            if let excludeId = methodId, doc.documentID == excludeId {
                continue
            }
            try await doc.reference.updateData(["isDefault": false])
        }
    }
    
    // MARK: - Transaction Operations
    
    /// Get all transactions for a user
    func getUserTransactions(userId: String, limit: Int = 50) async throws -> [Transaction] {
        try requireAuthentication()
        guard authorizationService.canAccessUserData(userId: userId, targetUserId: userId) else {
            throw DataServiceError.authorizationFailed("User cannot access these transactions")
        }
        
        let source: FirestoreSource = NetworkMonitorService.shared.isConnected ? .default : .cache
        let snapshot = try await dbInstance.collection("transactions")
            .whereField("userId", isEqualTo: userId)
            .order(by: "createdAt", descending: true)
            .limit(to: limit)
            .getDocuments(source: source)
        
        return try snapshot.documents.compactMap { doc in
            var transaction = try doc.data(as: Transaction.self)
            transaction.id = doc.documentID
            return transaction
        }
    }
    
    /// Get transactions for a specific ride
    func getRideTransactions(rideId: String) async throws -> [Transaction] {
        try requireAuthentication()
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        
        let snapshot = try await dbInstance.collection("transactions")
            .whereField("rideId", isEqualTo: rideId)
            .whereField("userId", isEqualTo: currentUserId)
            .order(by: "createdAt", descending: true)
            .getDocuments()
        
        return try snapshot.documents.compactMap { doc in
            var transaction = try doc.data(as: Transaction.self)
            transaction.id = doc.documentID
            return transaction
        }
    }
    
    /// Create a transaction record
    func createTransaction(_ transaction: Transaction) async throws -> Transaction {
        try requireAuthentication()
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard transaction.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only create transactions for themselves")
        }
        
        return try await createEntity(transaction, in: "transactions")
    }
    
    /// Update a transaction (e.g., when payment status changes)
    func updateTransaction(_ transaction: Transaction) async throws {
        try requireAuthentication()
        guard let transactionId = transaction.id else {
            throw DataServiceError.invalidId("Transaction ID is required")
        }
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard transaction.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only update their own transactions")
        }
        
        try await updateEntity(transaction, in: "transactions")
    }
    
    // MARK: - Offline Caching Methods
    
    /// Pre-cache important user data when online to enable offline access
    /// This method should be called when the app comes online or when user logs in
    func preCacheUserData(userId: String) async {
        guard NetworkMonitorService.shared.isConnected else {
            return // Don't pre-cache when offline
        }
        
        // Pre-cache rides (recent rides)
        _ = try? await getUserRides(userId: userId)
        
        // Pre-cache trip summaries (trip history)
        _ = try? await getUserTripSummaries(userId: userId)
        
        // Pre-cache user preferences
        _ = try? await getUserPreferences(userId: userId)
        
        // Pre-cache saved addresses
        _ = try? await getSavedAddresses(userId: userId)
        
        // Pre-cache payment methods
        _ = try? await getPaymentMethods(userId: userId)
        
        // Pre-cache recent transactions
        _ = try? await getUserTransactions(userId: userId, limit: 20)
        
        // Pre-cache user profile
        _ = try? await getUser(userId: userId)
    }
    
    func getUserByEmail(_ email: String) async throws -> User? {
        try requireAuthentication()
        let snapshot = try await dbInstance.collection("users")
            .whereField("email", isEqualTo: email)
            .limit(to: 1)
            .getDocuments()
        
        guard let doc = snapshot.documents.first else {
            return nil
        }
        
        return try doc.data(as: User.self)
    }
    
    func getRide(rideId: String) async throws -> Ride? {
        try requireAuthentication()
        guard let ride = try await getEntity(Ride.self, id: rideId, from: "rides") else {
            return nil
        }
        // Ensure the ride ID is set (workaround for @DocumentID not always working)
        var rideWithId = ride
        if rideWithId.id == nil {
            rideWithId.id = rideId
            #if DEBUG
            print("✅ [DEBUG] FirebaseDataService - Set ride ID manually in getRide: \(rideId)")
            #endif
        }
        guard authorizationService.canAccessRide(userId: rideId, ride: rideWithId) else {
            throw DataServiceError.authorizationFailed("User cannot access this ride")
        }
        return rideWithId
    }
    
    func getUserRides(userId: String) async throws -> [Ride] {
        try requireAuthentication()
        guard authorizationService.canAccessUserData(userId: userId, targetUserId: userId) else {
            throw DataServiceError.authorizationFailed("User cannot access these rides")
        }
        
        // Use cache source when offline - Firestore will automatically use cache if network is unavailable
        // This enables offline persistence for ride data
        let source: FirestoreSource = NetworkMonitorService.shared.isConnected ? .default : .cache
        let snapshot = try await dbInstance.collection("rides")
            .whereField("userId", isEqualTo: userId)
            .order(by: "createdAt", descending: true)
            .getDocuments(source: source)
        
        return try snapshot.documents.compactMap { doc in
            var ride = try doc.data(as: Ride.self)
            // Manually set the document ID since @DocumentID might not be set during decoding
            // This is a workaround for the @DocumentID property wrapper not always working
            if ride.id == nil {
                ride.id = doc.documentID
                #if DEBUG
                print("✅ [DEBUG] FirebaseDataService - Set ride ID manually: \(doc.documentID)")
                #endif
            }
            return ride
        }
    }
    
    func updateRide(_ ride: Ride, rideId: String? = nil) async throws {
        // Use provided rideId parameter if ride.id is nil (workaround for @DocumentID being lost)
        let finalRideId = ride.id ?? rideId
        print("🔍 [DEBUG] FirebaseDataService - updateRide called for ride: \(finalRideId ?? "nil")")
        try requireAuthentication()
        guard let finalRideId = finalRideId else {
            print("❌ [ERROR] FirebaseDataService - Ride ID is missing")
            throw DataServiceError.invalidId("Ride ID is required")
        }
        
        print("🔍 [DEBUG] FirebaseDataService - Checking authorization for ride: \(finalRideId), status: \(ride.status), driverId: \(ride.driverId ?? "nil")")
        let canAccess = authorizationService.canAccessRide(userId: finalRideId, ride: ride)
        print("🔍 [DEBUG] FirebaseDataService - Authorization check result: \(canAccess)")
        
        guard canAccess else {
            print("❌ [ERROR] FirebaseDataService - Authorization failed for ride: \(finalRideId)")
            throw DataServiceError.authorizationFailed("User cannot update this ride")
        }
        
        // Check if this is a cancellation
        let isCancellation = ride.status == .cancelled
        
        // Check if offline - queue operation if so
        if !NetworkMonitorService.shared.isConnected {
            if isCancellation {
                try OfflineSyncQueueService.shared.queueCancelRide(ride)
            } else {
                try OfflineSyncQueueService.shared.queueUpdateRide(ride)
            }
            return // Return early - operation is queued
        }
        
        // Get the old ride state to check if status changed to completed or cancelled
        let oldRide = try await getRide(rideId: finalRideId)
        let wasCompleted = oldRide?.status == .completed
        let isNowCompleted = ride.status == .completed
        let wasCancelled = oldRide?.status == .cancelled
        let isNowCancelled = ride.status == .cancelled
        let wasInProgress = oldRide?.status == .inProgress
        let isNowInProgress = ride.status == .inProgress
        
        // Update the ride
        // If ride.id is nil, use the rideId parameter and update directly via document reference
        do {
            if ride.id == nil {
                // Workaround: Update directly using document reference since @DocumentID was lost
                print("🔍 [DEBUG] FirebaseDataService - Ride ID is nil in struct, using rideId parameter: \(finalRideId)")
                let docRef = dbInstance.collection("rides").document(finalRideId)
                try await docRef.setData(from: ride, merge: true)
            } else {
                try await updateEntity(ride, in: "rides")
            }
        } catch {
            // If network error, queue the operation
            if let nsError = error as NSError?,
               nsError.domain == NSURLErrorDomain || nsError.code == 7 {
                if isCancellation {
                    try OfflineSyncQueueService.shared.queueCancelRide(ride)
                } else {
                    try OfflineSyncQueueService.shared.queueUpdateRide(ride)
                }
                return // Operation queued
            }
            throw error
        }
        
        // Payment processing is now done when ride is completed, not when it starts
        // This ensures payment is processed right before completion and we can verify success
        
        // If ride was just cancelled, process refund if payment was already made
        if isNowCancelled && !wasCancelled {
            await processRefundForCancelledRide(ride)
        }
        
        // If ride was just completed and doesn't have a trip summary yet, create one automatically
        if isNowCompleted && !wasCompleted && ride.tripSummaryId == nil {
            print("🔍 [DEBUG] FirebaseDataService - Ride completed, creating trip summary...")
            // Use finalRideId since ride.id might be nil
            var rideForSummary = ride
            // We can't set @DocumentID directly, but we'll use finalRideId in the function
            await createTripSummaryForCompletedRide(rideForSummary, rideId: finalRideId)
        }
    }
    
    /// Convenience method to complete a ride (useful for drivers or testing)
    func completeRide(rideId: String, actualPrice: Double, actualDuration: Int, actualDistance: Double? = nil) async throws {
        guard var ride = try await getRide(rideId: rideId) else {
            throw DataServiceError.invalidId("Ride not found")
        }
        
        // Use the Ride model's complete method
        // Use provided actualDistance or fall back to estimatedDistance
        try ride.complete(actualPrice: actualPrice, actualDuration: actualDuration, actualDistance: actualDistance ?? ride.estimatedDistance)
        
        // Update the ride (which will automatically create trip summary)
        try await updateRide(ride)
    }
    
    /// Process payment when ride starts (status changes to in_progress)
    /// Note: This should be called regardless of who triggers the status change (driver or passenger)
    private func processPaymentForInProgressRide(_ ride: Ride, rideId: String? = nil) async {
        // Use provided rideId parameter if ride.id is nil (workaround for @DocumentID being lost)
        let finalRideId = ride.id ?? rideId
        
        guard let finalRideId = finalRideId else {
            print("❌ [ERROR] FirebaseDataService - processPaymentForInProgressRide: Ride ID is nil")
            return
        }
        
        guard Auth.auth().currentUser != nil else {
            print("❌ [ERROR] FirebaseDataService - processPaymentForInProgressRide: User not authenticated")
            return
        }
        
        // Use the ride's userId (passenger) for payment processing, not the current user
        // The current user might be the driver who started the ride
        let userId = ride.userId
        
        print("🔍 [DEBUG] FirebaseDataService - processPaymentForInProgressRide called for ride: \(finalRideId)")
        print("   - Processing payment for passenger (ride.userId): \(userId)")
        
        // Check if payment has already been processed for this ride
        if let existingTransactions = try? await getRideTransactions(rideId: finalRideId),
           existingTransactions.contains(where: { $0.type == .charge && $0.status == .succeeded }) {
            print("✅ [DEBUG] FirebaseDataService - Payment already succeeded for ride: \(finalRideId)")
            return
        }
        
        print("🔍 [DEBUG] FirebaseDataService - No successful payment found, processing payment for ride: \(finalRideId)")
        
        // Use estimated price (actual price will be set when ride completes)
        let amount = ride.estimatedPrice
        
        // Get payment method - use ride's paymentMethodId if set, otherwise get default
        let paymentMethod: PaymentMethod?
        if let methodId = ride.paymentMethodId {
            paymentMethod = try? await getEntity(PaymentMethod.self, id: methodId, from: "paymentMethods")
        } else {
            // Get default payment method
            let methods = try? await getPaymentMethods(userId: userId)
            paymentMethod = methods?.first { $0.isDefault }
        }
        
        guard let method = paymentMethod,
              let methodId = method.id else {
            // No valid payment method found - create failed transaction
            let failedTransaction = Transaction(
                userId: userId,
                rideId: finalRideId,
                type: .charge,
                amount: amount,
                status: .failed,
                description: "Payment failed: No payment method found. Please add a payment method.",
                metadata: [
                    "error": "No payment method found",
                    "errorType": "ValidationError",
                    "rideType": ride.rideType.rawValue
                ]
            )
            _ = try? await createTransaction(failedTransaction)
            return
        }
        
        // Validate payment method has required information
        guard method.stripePaymentMethodId != nil || (method.last4 != nil && method.expiryMonth != nil && method.expiryYear != nil) else {
            // Payment method is incomplete - create failed transaction with error
            let failedTransaction = Transaction(
                userId: userId,
                rideId: finalRideId,
                type: .charge,
                amount: amount,
                status: .failed,
                paymentMethodId: methodId,
                description: "Payment failed: Payment method is incomplete. Please update your payment method with complete card details.",
                metadata: [
                    "error": "Payment method is incomplete. Missing card details.",
                    "errorType": "ValidationError",
                    "rideType": ride.rideType.rawValue
                ]
            )
            _ = try? await createTransaction(failedTransaction)
            return
        }
        
        // Create pending transaction
        let transaction = Transaction(
            userId: userId,
            rideId: finalRideId,
            type: .charge,
            amount: amount,
            status: .processing,
            paymentMethodId: methodId,
            description: "Ride payment - \(ride.pickupLocation.address) to \(ride.dropoffLocation.address)",
            metadata: [
                "rideType": ride.rideType.rawValue,
                "estimatedPrice": String(ride.estimatedPrice)
            ]
        )
        
        do {
            let createdTransaction = try await createTransaction(transaction)
            
            // Process payment through PaymentService
            guard let stripePaymentMethodId = method.stripePaymentMethodId else {
                throw PaymentError.paymentIntentCreationFailed
            }
            
            let paymentService = PaymentService.shared
            let paymentResult = try await paymentService.processRidePayment(
                rideId: finalRideId,
                amount: amount,
                paymentMethodId: stripePaymentMethodId
            )
            
            // Update transaction with payment result
            var updatedTransaction = createdTransaction
            updatedTransaction.status = paymentResult.success ? .succeeded : .failed
            updatedTransaction.stripePaymentIntentId = paymentResult.paymentIntentId
            updatedTransaction.updatedAt = Date()
            
            try await updateTransaction(updatedTransaction)
            
            print("✅ [DEBUG] FirebaseDataService - Payment processed successfully for ride: \(finalRideId)")
        } catch {
            // Payment failed - update transaction status with error message
            var errorMessage = error.localizedDescription
            
            // Provide more user-friendly error messages
            if let paymentError = error as? PaymentError {
                switch paymentError {
                case .paymentIntentCreationFailed:
                    if method.stripePaymentMethodId == nil {
                        errorMessage = "Payment method is not set up with Stripe. Please add a valid payment method with complete card details."
                    } else {
                        errorMessage = "Failed to create payment. Please check your payment method and try again."
                    }
                case .authenticationFailed:
                    errorMessage = "Authentication failed. Please log in again."
                case .networkError:
                    errorMessage = "Network error. Please check your connection and try again."
                default:
                    errorMessage = "Payment processing failed. Please try again."
                }
            }
            
            print("❌ [ERROR] FirebaseDataService - Payment processing failed for ride: \(finalRideId), error: \(errorMessage)")
            
            // Update or create failed transaction
            if let createdTransaction = try? await getRideTransactions(rideId: finalRideId).first {
                var failedTransaction = createdTransaction
                failedTransaction.status = .failed
                failedTransaction.updatedAt = Date()
                failedTransaction.description = "Payment failed: \(errorMessage)"
                
                // Store error details in metadata
                var metadata = failedTransaction.metadata ?? [:]
                metadata["error"] = errorMessage
                metadata["errorType"] = String(describing: type(of: error))
                failedTransaction.metadata = metadata
                
                _ = try? await updateTransaction(failedTransaction)
            } else {
                // Create new failed transaction if none exists
                let failedTransaction = Transaction(
                    userId: userId,
                    rideId: finalRideId,
                    type: .charge,
                    amount: amount,
                    status: .failed,
                    paymentMethodId: methodId,
                    description: "Payment failed: \(errorMessage)",
                    metadata: [
                        "error": errorMessage,
                        "errorType": String(describing: type(of: error)),
                        "rideType": ride.rideType.rawValue
                    ]
                )
                _ = try? await createTransaction(failedTransaction)
            }
        }
    }
    
    /// Process payment when ride is being completed
    /// Returns true if payment succeeds, false otherwise
    /// This is called BEFORE completing the ride to ensure payment is successful
    func processPaymentForRideCompletion(_ ride: Ride, rideId: String? = nil) async throws -> Bool {
        // Use provided rideId parameter if ride.id is nil (workaround for @DocumentID being lost)
        let finalRideId = ride.id ?? rideId
        
        guard let finalRideId = finalRideId else {
            print("❌ [ERROR] FirebaseDataService - processPaymentForRideCompletion: Ride ID is nil")
            throw DataServiceError.invalidId("Ride ID is required")
        }
        
        guard Auth.auth().currentUser != nil else {
            print("❌ [ERROR] FirebaseDataService - processPaymentForRideCompletion: User not authenticated")
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        
        // Use the ride's userId (passenger) for payment processing, not the current user
        // The current user might be the driver who is completing the ride
        let userId = ride.userId
        
        print("🔍 [DEBUG] FirebaseDataService - processPaymentForRideCompletion called for ride: \(finalRideId)")
        print("   - Processing payment for passenger (ride.userId): \(userId)")
        
        // Use actual price if available, otherwise use estimated price
        let actualPrice = ride.actualPrice ?? ride.estimatedPrice
        
        print("🔍 [DEBUG] FirebaseDataService - Processing payment for ride completion:")
        print("   - Actual price: \(actualPrice)")
        print("   - Estimated price: \(ride.estimatedPrice)")
        
        // Check if payment was already processed successfully
        if let existingTransactions = try? await getRideTransactions(rideId: finalRideId),
           let successfulTransaction = existingTransactions.first(where: { $0.type == .charge && $0.status == .succeeded }) {
            print("✅ [DEBUG] FirebaseDataService - Payment already succeeded for ride: \(finalRideId)")
            
            // If actual price differs from estimated price, update the transaction
            if actualPrice != ride.estimatedPrice {
                print("🔍 [DEBUG] FirebaseDataService - Actual price differs from estimated, updating transaction...")
                var updatedTransaction = successfulTransaction
                updatedTransaction.amount = actualPrice
                updatedTransaction.updatedAt = Date()
                _ = try? await updateTransaction(updatedTransaction)
                print("✅ [DEBUG] FirebaseDataService - Transaction updated with actual price")
            }
            return true
        }
        
        print("🔍 [DEBUG] FirebaseDataService - No successful payment found, processing payment for ride: \(finalRideId)")
        
        // Get payment method - use ride's paymentMethodId if set, otherwise get default
        let paymentMethod: PaymentMethod?
        if let methodId = ride.paymentMethodId {
            paymentMethod = try? await getEntity(PaymentMethod.self, id: methodId, from: "paymentMethods")
        } else {
            // Get default payment method
            let methods = try? await getPaymentMethods(userId: userId)
            paymentMethod = methods?.first { $0.isDefault }
        }
        
        guard let method = paymentMethod,
              let methodId = method.id else {
            print("❌ [ERROR] FirebaseDataService - No payment method found for ride completion")
            throw DataServiceError.paymentFailed("No payment method found. Please add a payment method.")
        }
        
        // Validate payment method has required information
        guard method.stripePaymentMethodId != nil || (method.last4 != nil && method.expiryMonth != nil && method.expiryYear != nil) else {
            print("❌ [ERROR] FirebaseDataService - Payment method is incomplete")
            throw DataServiceError.paymentFailed("Payment method is incomplete. Please update your payment method with complete card details.")
        }
        
        // Create pending transaction
        let transaction = Transaction(
            userId: userId,
            rideId: finalRideId,
            type: .charge,
            amount: actualPrice,
            status: .processing,
            paymentMethodId: methodId,
            description: "Ride payment - \(ride.pickupLocation.address) to \(ride.dropoffLocation.address)",
            metadata: [
                "rideType": ride.rideType.rawValue,
                "estimatedPrice": String(ride.estimatedPrice)
            ]
        )
        
        do {
            let createdTransaction = try await createTransaction(transaction)
            
            // Process payment through PaymentService
            guard let stripePaymentMethodId = method.stripePaymentMethodId else {
                throw PaymentError.paymentIntentCreationFailed
            }
            
            let paymentService = PaymentService.shared
            let paymentResult = try await paymentService.processRidePayment(
                rideId: finalRideId,
                amount: actualPrice,
                paymentMethodId: stripePaymentMethodId
            )
            
            // Update transaction with payment result
            var updatedTransaction = createdTransaction
            updatedTransaction.status = paymentResult.success ? .succeeded : .failed
            updatedTransaction.stripePaymentIntentId = paymentResult.paymentIntentId
            updatedTransaction.updatedAt = Date()
            
            try await updateTransaction(updatedTransaction)
            
            if paymentResult.success {
                print("✅ [DEBUG] FirebaseDataService - Payment processed successfully for ride: \(finalRideId)")
                return true
            } else {
                print("❌ [ERROR] FirebaseDataService - Payment failed for ride: \(finalRideId)")
                throw DataServiceError.paymentFailed("Payment processing failed. Please try again or use a different payment method.")
            }
        } catch {
            // Payment failed - update transaction status with error message
            var errorMessage = error.localizedDescription
            
            // Provide more user-friendly error messages
            if let paymentError = error as? PaymentError {
                switch paymentError {
                case .paymentIntentCreationFailed:
                    if method.stripePaymentMethodId == nil {
                        errorMessage = "Payment method is not set up with Stripe. Please add a valid payment method with complete card details."
                    } else {
                        errorMessage = "Failed to create payment. Please check your payment method and try again."
                    }
                case .confirmationFailed:
                    errorMessage = "Payment confirmation failed. Please try again or use a different payment method."
                case .authenticationFailed:
                    errorMessage = "Authentication failed. Please sign in again."
                case .invalidResponse:
                    errorMessage = "Invalid response from payment server. Please try again."
                case .networkError(let message):
                    errorMessage = "Network error: \(message)"
                default:
                    errorMessage = paymentError.localizedDescription
                }
            }
            
            print("❌ [ERROR] FirebaseDataService - Payment processing failed for ride: \(finalRideId), error: \(errorMessage)")
            
            // Try to get the created transaction
            if let createdTransaction = try? await getRideTransactions(rideId: finalRideId).first {
                var failedTransaction = createdTransaction
                failedTransaction.status = .failed
                failedTransaction.updatedAt = Date()
                failedTransaction.description = "Payment failed: \(errorMessage)"
                
                // Store error details in metadata
                var metadata = failedTransaction.metadata ?? [:]
                metadata["error"] = errorMessage
                metadata["errorType"] = String(describing: type(of: error))
                failedTransaction.metadata = metadata
                
                _ = try? await updateTransaction(failedTransaction)
            } else {
                // Create new failed transaction if none exists
                let failedTransaction = Transaction(
                    userId: userId,
                    rideId: finalRideId,
                    type: .charge,
                    amount: actualPrice,
                    status: .failed,
                    paymentMethodId: methodId,
                    description: "Payment failed: \(errorMessage)",
                    metadata: [
                        "error": errorMessage,
                        "errorType": String(describing: type(of: error)),
                        "rideType": ride.rideType.rawValue
                    ]
                )
                _ = try? await createTransaction(failedTransaction)
            }
            
            throw DataServiceError.paymentFailed(errorMessage)
        }
    }
    
    /// Process payment for a completed ride (legacy - kept for backward compatibility)
    /// Note: Payment should now be processed when ride is completed (before completion)
    /// Process final payment when ride is completed (adjusts for actual price)
    /// Note: This should be called regardless of who triggers the status change (driver or passenger)
    private func processPaymentForCompletedRide(_ ride: Ride, rideId: String? = nil) async {
        // Use provided rideId parameter if ride.id is nil (workaround for @DocumentID being lost)
        let finalRideId = ride.id ?? rideId
        
        guard let finalRideId = finalRideId else {
            print("❌ [ERROR] FirebaseDataService - processPaymentForCompletedRide: Ride ID is nil")
            return
        }
        
        guard Auth.auth().currentUser != nil else {
            print("❌ [ERROR] FirebaseDataService - processPaymentForCompletedRide: User not authenticated")
            return
        }
        
        // Use the ride's userId (passenger) for payment processing, not the current user
        // The current user might be the driver who completed the ride
        let userId = ride.userId
        
        print("🔍 [DEBUG] FirebaseDataService - processPaymentForCompletedRide called for ride: \(finalRideId)")
        print("   - Processing payment for passenger (ride.userId): \(userId)")
        
        // Use actual price if available, otherwise use estimated price
        let actualPrice = ride.actualPrice ?? ride.estimatedPrice
        
        print("🔍 [DEBUG] FirebaseDataService - Processing payment for completed ride:")
        print("   - Actual price: \(actualPrice)")
        print("   - Estimated price: \(ride.estimatedPrice)")
        
        // Check if payment was already processed when ride started
        if let existingTransactions = try? await getRideTransactions(rideId: finalRideId),
           let successfulTransaction = existingTransactions.first(where: { $0.type == .charge && $0.status == .succeeded }) {
            print("✅ [DEBUG] FirebaseDataService - Payment already succeeded for ride: \(finalRideId)")
            
            // If actual price differs from estimated price, update the transaction
            if actualPrice != ride.estimatedPrice {
                print("🔍 [DEBUG] FirebaseDataService - Actual price differs from estimated, updating transaction...")
                var updatedTransaction = successfulTransaction
                updatedTransaction.amount = actualPrice
                updatedTransaction.updatedAt = Date()
                _ = try? await updateTransaction(updatedTransaction)
                print("✅ [DEBUG] FirebaseDataService - Transaction updated with actual price")
            }
            return
        }
        
        print("🔍 [DEBUG] FirebaseDataService - No successful payment found, processing payment for completed ride: \(finalRideId)")
        
        // Get payment method - use ride's paymentMethodId if set, otherwise get default
        let paymentMethod: PaymentMethod?
        if let methodId = ride.paymentMethodId {
            paymentMethod = try? await getEntity(PaymentMethod.self, id: methodId, from: "paymentMethods")
        } else {
            // Get default payment method
            let methods = try? await getPaymentMethods(userId: userId)
            paymentMethod = methods?.first { $0.isDefault }
        }
        
        guard let method = paymentMethod,
              let methodId = method.id else {
            print("❌ [ERROR] FirebaseDataService - No payment method found for completed ride")
            // No valid payment method found - skip payment processing
            return
        }
        
        // Validate payment method has required information
        guard method.stripePaymentMethodId != nil || (method.last4 != nil && method.expiryMonth != nil && method.expiryYear != nil) else {
            // Payment method is incomplete - create failed transaction with error
            let failedTransaction = Transaction(
                userId: userId,
                rideId: finalRideId,
                type: .charge,
                amount: actualPrice,
                status: .failed,
                paymentMethodId: methodId,
                description: "Payment failed: Payment method is incomplete. Please update your payment method with complete card details.",
                metadata: [
                    "error": "Payment method is incomplete. Missing card details.",
                    "errorType": "ValidationError",
                    "rideType": ride.rideType.rawValue
                ]
            )
            _ = try? await createTransaction(failedTransaction)
            return
        }
        
        // Create pending transaction
        let transaction = Transaction(
            userId: userId,
            rideId: finalRideId,
            type: .charge,
            amount: actualPrice,
            status: .processing,
            paymentMethodId: methodId,
            description: "Ride payment - \(ride.pickupLocation.address) to \(ride.dropoffLocation.address)",
            metadata: [
                "rideType": ride.rideType.rawValue,
                "estimatedPrice": String(ride.estimatedPrice)
            ]
        )
        
        do {
            let createdTransaction = try await createTransaction(transaction)
            
            // Process payment through PaymentService
            // Use Stripe payment method ID if available, otherwise we need to create one
            // For now, if stripePaymentMethodId is nil, payment will fail
            guard let stripePaymentMethodId = method.stripePaymentMethodId else {
                throw PaymentError.paymentIntentCreationFailed // Will be caught and handled below
            }
            
            let paymentService = PaymentService.shared
            let paymentResult = try await paymentService.processRidePayment(
                rideId: finalRideId,
                amount: actualPrice,
                paymentMethodId: stripePaymentMethodId
            )
            
            // Update transaction with payment result
            var updatedTransaction = createdTransaction
            updatedTransaction.status = paymentResult.success ? .succeeded : .failed
            updatedTransaction.stripePaymentIntentId = paymentResult.paymentIntentId
            updatedTransaction.updatedAt = Date()
            
            try await updateTransaction(updatedTransaction)
        } catch {
            // Payment failed - update transaction status with error message
            var errorMessage = error.localizedDescription
            
            // Provide more user-friendly error messages
            if let paymentError = error as? PaymentError {
                switch paymentError {
                case .paymentIntentCreationFailed:
                    if method.stripePaymentMethodId == nil {
                        errorMessage = "Payment method is not set up with Stripe. Please add a valid payment method with complete card details."
                    } else {
                        errorMessage = "Failed to create payment. Please check your payment method and try again."
                    }
                case .confirmationFailed:
                    errorMessage = "Payment confirmation failed. Please try again or use a different payment method."
                case .authenticationFailed:
                    errorMessage = "Authentication failed. Please sign in again."
                case .invalidResponse:
                    errorMessage = "Invalid response from payment server. Please try again."
                case .networkError(let message):
                    errorMessage = "Network error: \(message)"
                default:
                    errorMessage = paymentError.localizedDescription
                }
            }
            
            // Try to get the created transaction
            if let createdTransaction = try? await getRideTransactions(rideId: finalRideId).first {
                var failedTransaction = createdTransaction
                failedTransaction.status = .failed
                failedTransaction.updatedAt = Date()
                failedTransaction.description = "Payment failed: \(errorMessage)"
                
                // Store error details in metadata
                var metadata = failedTransaction.metadata ?? [:]
                metadata["error"] = errorMessage
                metadata["errorType"] = String(describing: type(of: error))
                failedTransaction.metadata = metadata
                
                _ = try? await updateTransaction(failedTransaction)
            } else {
                // If transaction wasn't created, create a failed one with error info
                let failedTransaction = Transaction(
                    userId: userId,
                    rideId: finalRideId,
                    type: .charge,
                    amount: actualPrice,
                    status: .failed,
                    paymentMethodId: methodId,
                    description: "Payment failed: \(errorMessage)",
                    metadata: [
                        "error": errorMessage,
                        "errorType": String(describing: type(of: error)),
                        "rideType": ride.rideType.rawValue
                    ]
                )
                _ = try? await createTransaction(failedTransaction)
            }
        }
    }
    
    /// Process refund for a cancelled ride
    private func processRefundForCancelledRide(_ ride: Ride) async {
        guard let rideId = ride.id,
              let userId = Auth.auth().currentUser?.uid,
              userId == ride.userId else {
            return
        }
        
        // Find existing successful transaction for this ride
        guard let transactions = try? await getRideTransactions(rideId: rideId),
              let chargeTransaction = transactions.first(where: { 
                  $0.type == .charge && $0.status == .succeeded 
              }),
              let paymentIntentId = chargeTransaction.stripePaymentIntentId else {
            // No payment to refund
            return
        }
        
        // Calculate refund amount (full refund for now, can be adjusted for cancellation fees)
        let refundAmount = chargeTransaction.amount
        
        do {
            // Process refund through PaymentService
            let paymentService = PaymentService.shared
            let refundResult = try await paymentService.processRefund(
                paymentIntentId: paymentIntentId,
                amount: refundAmount,
                reason: "Ride cancelled"
            )
            
            // Create refund transaction record
            let refundTransaction = Transaction(
                userId: userId,
                rideId: rideId,
                type: .refund,
                amount: refundAmount,
                status: refundResult.success ? .succeeded : .failed,
                paymentMethodId: chargeTransaction.paymentMethodId,
                stripePaymentIntentId: paymentIntentId,
                stripeRefundId: refundResult.refundId,
                description: "Refund for cancelled ride",
                metadata: [
                    "originalTransactionId": chargeTransaction.id ?? "",
                    "refundReason": "Ride cancelled"
                ]
            )
            
            _ = try await createTransaction(refundTransaction)
            
            // Update original transaction status
            var updatedCharge = chargeTransaction
            updatedCharge.status = refundResult.success ? .refunded : .succeeded
            updatedCharge.updatedAt = Date()
            try await updateTransaction(updatedCharge)
        } catch {
            // Refund failed - create failed refund transaction for record
            let failedRefund = Transaction(
                userId: userId,
                rideId: rideId,
                type: .refund,
                amount: refundAmount,
                status: .failed,
                paymentMethodId: chargeTransaction.paymentMethodId,
                stripePaymentIntentId: paymentIntentId,
                description: "Refund for cancelled ride (failed)",
                metadata: [
                    "originalTransactionId": chargeTransaction.id ?? "",
                    "error": error.localizedDescription
                ]
            )
            _ = try? await createTransaction(failedRefund)
        }
    }
    
    /// Automatically creates a trip summary when a ride is completed
    private func createTripSummaryForCompletedRide(_ ride: Ride, rideId: String? = nil) async {
        // Use provided rideId parameter if ride.id is nil (workaround for @DocumentID being lost)
        let finalRideId = ride.id ?? rideId
        
        guard let finalRideId = finalRideId else {
            print("❌ [ERROR] FirebaseDataService - createTripSummaryForCompletedRide: Ride ID is nil")
            return
        }
        
        guard let driverId = ride.driverId else {
            print("❌ [ERROR] FirebaseDataService - createTripSummaryForCompletedRide: Driver ID is nil")
            return
        }
        
        print("🔍 [DEBUG] FirebaseDataService - createTripSummaryForCompletedRide called for ride: \(finalRideId)")
        
        do {
            
            let tripService = TripSummaryService(dataService: self)
            let summary = try await tripService.generateTripSummary(
                rideId: finalRideId,
                userId: ride.userId,
                driverId: driverId
            )
            
            // Save the trip summary to Firestore
            let createdSummary = try await createTripSummary(summary)
            
            print("✅ [DEBUG] FirebaseDataService - Trip summary created: \(createdSummary.id ?? "nil")")
            
            // Link the trip summary to the ride
            var updatedRide = ride
            updatedRide.tripSummaryId = createdSummary.id
            // Use finalRideId when updating since ride.id might be nil
            try await updateRide(updatedRide, rideId: finalRideId)
            
            print("✅ [DEBUG] FirebaseDataService - Trip summary linked to ride: \(finalRideId)")
            
        } catch {
            print("❌ [ERROR] FirebaseDataService - Failed to create trip summary: \(error)")
            // Don't throw - we don't want to fail the ride update if summary creation fails
        }
    }
    
    // MARK: - Trip Summary Operations
    
    func getTripSummary(summaryId: String) async throws -> TripSummary? {
        try requireAuthentication()
        return try await getEntity(TripSummary.self, id: summaryId, from: "tripSummaries")
    }
    
    func getUserTripSummaries(userId: String) async throws -> [TripSummary] {
        try requireAuthentication()
        guard authorizationService.canAccessUserData(userId: userId, targetUserId: userId) else {
            throw DataServiceError.authorizationFailed("User cannot access these trip summaries")
        }
        
        // Use cache source when offline - enables offline persistence for trip history
        let source: FirestoreSource = NetworkMonitorService.shared.isConnected ? .default : .cache
        let snapshot = try await dbInstance.collection("tripSummaries")
            .whereField("userId", isEqualTo: userId)
            .order(by: "createdAt", descending: true)
            .getDocuments(source: source)
        
        return try snapshot.documents.compactMap { doc in
            try doc.data(as: TripSummary.self)
        }
    }
    
    /// Update a trip summary (e.g., when adding rating)
    func updateTripSummary(_ summary: TripSummary) async throws {
        try requireAuthentication()
        guard let summaryId = summary.id else {
            throw DataServiceError.invalidId("Trip summary ID is required")
        }
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard summary.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only update their own trip summaries")
        }
        
        try await updateEntity(summary, in: "tripSummaries")
    }
    
    func createTripSummary(_ summary: TripSummary) async throws -> TripSummary {
        try requireAuthentication()
        guard let currentUserId = Auth.auth().currentUser?.uid else {
            throw DataServiceError.authenticationRequired("User must be authenticated")
        }
        guard summary.userId == currentUserId else {
            throw DataServiceError.authorizationFailed("User can only create summaries for themselves")
        }
        return try await createEntity(summary, in: "tripSummaries")
    }
    
    // MARK: - Real-time Listeners
    
    func observeRide(
        rideId: String,
        completion: @escaping (Result<Ride, Error>) -> Void
    ) -> ListenerRegistration {
        let docRef = dbInstance.collection("rides").document(rideId)
        
        return docRef.addSnapshotListener { snapshot, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let snapshot = snapshot, snapshot.exists else {
                completion(.failure(DataServiceError.notFound("Ride not found")))
                return
            }
            
            do {
                let ride = try snapshot.data(as: Ride.self)
                completion(.success(ride))
            } catch {
                completion(.failure(error))
            }
        }
    }
    
    func observeUserRides(
        userId: String,
        completion: @escaping (Result<[Ride], Error>) -> Void
    ) -> ListenerRegistration {
        let query = dbInstance.collection("rides")
            .whereField("userId", isEqualTo: userId)
            .order(by: "createdAt", descending: true)
        
        return query.addSnapshotListener { snapshot, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let documents = snapshot?.documents else {
                completion(.success([]))
                return
            }
            
            do {
                let rides = try documents.compactMap { doc in
                    try doc.data(as: Ride.self)
                }
                completion(.success(rides))
            } catch {
                completion(.failure(error))
            }
        }
    }
}

enum DataServiceError: Error, LocalizedError {
    case authenticationRequired(String)
    case authorizationFailed(String)
    case invalidId(String)
    case notFound(String)
    case encodingError(String)
    case decodingError(String)
    case paymentFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .authenticationRequired(let message):
            return "Authentication required: \(message)"
        case .authorizationFailed(let message):
            return "Authorization failed: \(message)"
        case .invalidId(let message):
            return "Invalid ID: \(message)"
        case .notFound(let message):
            return "Not found: \(message)"
        case .encodingError(let message):
            return "Encoding error: \(message)"
        case .decodingError(let message):
            return "Decoding error: \(message)"
        case .paymentFailed(let message):
            return "Payment failed: \(message)"
        }
    }
}
