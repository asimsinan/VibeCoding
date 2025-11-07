import Foundation
import Combine
import SwiftUI
import FirebaseAuth

class SavedAddressesViewModel: BaseViewModel {
    @Published var savedAddresses: [SavedAddress] = []
    @Published var selectedAddress: SavedAddress?
    
    private let dataService: FirebaseDataService
    
    init(dataService: FirebaseDataService = FirebaseDataService()) {
        self.dataService = dataService
        super.init()
    }
    
    func loadAddresses() {
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
                let addresses = try await dataService.getSavedAddresses(userId: userId)
                await MainActor.run {
                    self.savedAddresses = addresses
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
    
    func createAddress(name: String, address: String, latitude: Double, longitude: Double, isDefault: Bool = false) async throws {
        guard let userId = getCurrentUserId() else {
            throw NSError(domain: "SavedAddressesViewModel", code: 401, userInfo: [NSLocalizedDescriptionKey: "User not authenticated"])
        }
        
        let savedAddress = SavedAddress(
            userId: userId,
            name: name,
            address: address,
            latitude: latitude,
            longitude: longitude,
            isDefault: isDefault
        )
        
        let created = try await dataService.createSavedAddress(savedAddress)
        
        await MainActor.run {
            self.savedAddresses.append(created)
            // Sort: defaults first, then by name
            self.savedAddresses.sort { first, second in
                if first.isDefault != second.isDefault {
                    return first.isDefault
                }
                return first.name < second.name
            }
        }
    }
    
    func updateAddress(_ address: SavedAddress) async throws {
        try await dataService.updateSavedAddress(address)
        
        await MainActor.run {
            if let index = savedAddresses.firstIndex(where: { $0.id == address.id }) {
                savedAddresses[index] = address
                // Re-sort if default status changed
                savedAddresses.sort { first, second in
                    if first.isDefault != second.isDefault {
                        return first.isDefault
                    }
                    return first.name < second.name
                }
            }
        }
    }
    
    func deleteAddress(_ address: SavedAddress) async throws {
        guard let addressId = address.id else {
            throw NSError(domain: "SavedAddressesViewModel", code: 400, userInfo: [NSLocalizedDescriptionKey: "Address ID is required"])
        }
        
        try await dataService.deleteSavedAddress(addressId: addressId)
        
        await MainActor.run {
            savedAddresses.removeAll { $0.id == addressId }
        }
    }
    
    func toggleDefault(_ address: SavedAddress) async throws {
        var updated = address
        updated.isDefault.toggle()
        try await updateAddress(updated)
    }
    
    private func getCurrentUserId() -> String? {
        return Auth.auth().currentUser?.uid
    }
}

