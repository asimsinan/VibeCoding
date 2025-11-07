import Foundation
import Combine
import SwiftUI
import FirebaseFirestore
import FirebaseAuth

class BookingViewModel: ObservableObject {
    @Published var currentRide: Ride?
    @Published var isBooking: Bool = false
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var showPaymentMethodRequiredAlert: Bool = false
    
    private let dataService: FirebaseDataService
    private var cancellables = Set<AnyCancellable>()
    private var rideListener: ListenerRegistration?
    
    init(dataService: FirebaseDataService = FirebaseDataService()) {
        self.dataService = dataService
        setupRideListener()
    }
    
    deinit {
        rideListener?.remove()
    }
    
    private func setupRideListener() {
        // Real-time Firestore listener for active ride updates
        guard let userId = getCurrentUserId() else { return }
        
        let db = Firestore.firestore()
        let query = db.collection("rides")
            .whereField("userId", isEqualTo: userId)
            .whereField("status", in: ["pending", "accepted", "in_progress"])
            .limit(to: 1)
        
        rideListener = query.addSnapshotListener { [weak self] snapshot, error in
            guard let self = self else { return }
            
            if let error = error {
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                }
                return
            }
            
            guard let documents = snapshot?.documents, !documents.isEmpty else {
                DispatchQueue.main.async {
                    self.currentRide = nil
                }
                return
            }
            
            do {
                let ride = try documents[0].data(as: Ride.self)
                DispatchQueue.main.async {
                    self.currentRide = ride
                }
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    @MainActor
    func bookRide(suggestion: RideSuggestion) {
        isBooking = true
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let ride = try await createRide(from: suggestion)
                await MainActor.run {
                    self.currentRide = ride
                    self.isBooking = false
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isBooking = false
                    self.isLoading = false
                }
            }
        }
    }
    
    @MainActor
    func cancelRide() {
        currentRide = nil
        errorMessage = nil
    }
    
    private func createRide(from suggestion: RideSuggestion) async throws -> Ride {
        guard let userId = getCurrentUserId() else {
            throw BookingError.userNotAuthenticated
        }
        
        // Validate payment method before booking
        let paymentMethods: [PaymentMethod]
        do {
            paymentMethods = try await dataService.getPaymentMethods(userId: userId)
        } catch {
            throw BookingError.paymentMethodLoadFailed(error.localizedDescription)
        }
        
        // Check if user has any payment methods
        guard !paymentMethods.isEmpty else {
            await MainActor.run {
                self.showPaymentMethodRequiredAlert = true
            }
            throw BookingError.paymentMethodRequired
        }
        
        // Find a valid (non-expired) payment method
        let validPaymentMethods = paymentMethods.filter { !$0.isExpired }
        
        guard !validPaymentMethods.isEmpty else {
            await MainActor.run {
                self.showPaymentMethodRequiredAlert = true
            }
            throw BookingError.paymentMethodExpired
        }
        
        // Get default payment method, or use the first valid one
        let defaultPaymentMethod = validPaymentMethods.first { $0.isDefault } ?? validPaymentMethods.first
        guard let paymentMethodId = defaultPaymentMethod?.id else {
            await MainActor.run {
                self.showPaymentMethodRequiredAlert = true
            }
            throw BookingError.paymentMethodRequired
        }
        
        let ride = Ride(
            userId: userId,
            status: .pending,
            pickupLocation: suggestion.pickupLocation,
            dropoffLocation: suggestion.dropoffLocation,
            waypoints: suggestion.waypoints,
            estimatedPrice: suggestion.estimatedPrice,
            estimatedDuration: suggestion.estimatedDuration,
            estimatedDistance: suggestion.estimatedDistance,
            rideType: suggestion.rideType,
            paymentMethodId: paymentMethodId,
            createdAt: Date(),
            updatedAt: Date(),
            rideSuggestionId: suggestion.id
        )
        
        return try await dataService.createRide(ride)
    }
    
    private func getCurrentUserId() -> String? {
        // Get the actual Firebase Auth user ID
        return Auth.auth().currentUser?.uid
    }
}

enum BookingError: Error, LocalizedError {
    case userNotAuthenticated
    case paymentMethodRequired
    case paymentMethodExpired
    case paymentMethodLoadFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .userNotAuthenticated:
            return "User not authenticated"
        case .paymentMethodRequired:
            return "You need to add a payment method before booking a ride."
        case .paymentMethodExpired:
            return "All your payment methods have expired. Please add a new payment method to continue."
        case .paymentMethodLoadFailed(let message):
            return "Failed to load payment methods: \(message)"
        }
    }
}

