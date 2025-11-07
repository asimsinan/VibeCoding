import Foundation
import Combine
import FirebaseAuth

class PaymentMethodsViewModel: BaseViewModel {
    @Published var paymentMethods: [PaymentMethod] = []
    @Published var selectedPaymentMethod: PaymentMethod?
    @Published var lastUpdated: Date?
    @Published var isDataFromCache: Bool = false
    
    private let dataService: FirebaseDataService
    private let networkMonitor = NetworkMonitorService.shared
    
    init(dataService: FirebaseDataService = FirebaseDataService()) {
        self.dataService = dataService
        super.init()
        
        networkMonitor.$isConnected
            .sink { [weak self] _ in
                self?.isDataFromCache = !self!.networkMonitor.isConnected
            }
            .store(in: &self.cancellables)
    }
    
    func loadPaymentMethods() {
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
                let methods = try await dataService.getPaymentMethods(userId: userId)
                await MainActor.run {
                    self.paymentMethods = methods
                    self.selectedPaymentMethod = methods.first { $0.isDefault } ?? methods.first
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
    
    func addPaymentMethod(_ method: PaymentMethod) async {
        Task { @MainActor in
            self.isLoading = true
            self.errorMessage = nil
        }
        
        do {
            _ = try await dataService.createPaymentMethod(method)
            await MainActor.run {
                self.isLoading = false
                self.loadPaymentMethods() // Reload to update list and sorting
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    func updatePaymentMethod(_ method: PaymentMethod) async {
        Task { @MainActor in
            self.isLoading = true
            self.errorMessage = nil
        }
        
        do {
            try await dataService.updatePaymentMethod(method)
            await MainActor.run {
                self.isLoading = false
                self.loadPaymentMethods() // Reload to update list and sorting
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    func deletePaymentMethod(id: String) async {
        Task { @MainActor in
            self.isLoading = true
            self.errorMessage = nil
        }
        
        do {
            try await dataService.deletePaymentMethod(methodId: id)
            await MainActor.run {
                self.isLoading = false
                self.paymentMethods.removeAll { $0.id == id } // Optimistic update
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    func setDefaultPaymentMethod(_ method: PaymentMethod) async {
        var updatedMethod = method
        updatedMethod.isDefault = true
        await updatePaymentMethod(updatedMethod)
    }
    
    /// Add Stripe test credit cards for testing purposes
    func addStripeTestCards() async {
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
        
        // Stripe test card numbers
        let testCards: [(number: String, brand: String, type: PaymentMethod.PaymentMethodType)] = [
            ("4242 4242 4242 4242", "Visa", PaymentMethod.PaymentMethodType.creditCard),
            ("5555 5555 5555 4444", "Mastercard", PaymentMethod.PaymentMethodType.creditCard),
            ("3782 822463 10005", "American Express", PaymentMethod.PaymentMethodType.creditCard),
            ("6011 1111 1111 1117", "Discover", PaymentMethod.PaymentMethodType.creditCard)
        ]
        
        let currentYear = Calendar.current.component(.year, from: Date())
        
        do {
            // Check if test cards already exist
            let existingMethods = try await dataService.getPaymentMethods(userId: userId)
            let existingLast4s = Set(existingMethods.compactMap { $0.last4 })
            
            var isFirstCard = true
            for (cardNumber, brand, type) in testCards {
                let last4 = String(cardNumber.replacingOccurrences(of: " ", with: "").suffix(4))
                
                // Skip if card already exists
                if existingLast4s.contains(last4) {
                    continue
                }
                
                let testCard = PaymentMethod(
                    userId: userId,
                    type: type,
                    last4: last4,
                    brand: brand,
                    expiryMonth: 12,
                    expiryYear: currentYear + 2,
                    isDefault: isFirstCard, // Make first card default
                    stripePaymentMethodId: nil,
                    createdAt: Date(),
                    updatedAt: Date()
                )
                
                _ = try await dataService.createPaymentMethod(testCard)
                isFirstCard = false
            }
            
            await MainActor.run {
                self.isLoading = false
                self.loadPaymentMethods() // Reload to show new cards
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    private func getCurrentUserId() -> String? {
        return Auth.auth().currentUser?.uid
    }
}

