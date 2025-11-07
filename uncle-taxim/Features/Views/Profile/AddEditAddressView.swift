import SwiftUI

struct AddEditAddressView: View {
    @ObservedObject var viewModel: SavedAddressesViewModel
    let address: SavedAddress?
    @Binding var isPresented: Bool
    
    @State private var name: String = ""
    @State private var addressText: String = ""
    @State private var isDefault: Bool = false
    @State private var isGeocoding: Bool = false
    @State private var geocodeError: String?
    
    private let locationService = LocationService()
    
    init(viewModel: SavedAddressesViewModel, address: SavedAddress? = nil, isPresented: Binding<Bool>) {
        self.viewModel = viewModel
        self.address = address
        self._isPresented = isPresented
        
        if let address = address {
            _name = State(initialValue: address.name)
            _addressText = State(initialValue: address.address)
            _isDefault = State(initialValue: address.isDefault)
        }
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Address Details")) {
                    TextField("Name (e.g., Home, Work)", text: $name)
                        .font(AppTypography.body())
                    
                    TextField("Address", text: $addressText)
                        .font(AppTypography.body())
                        .lineLimit(3)
                }
                
                Section {
                    Toggle("Set as Default", isOn: $isDefault)
                        .font(AppTypography.body())
                }
                
                if isGeocoding {
                    Section {
                        HStack {
                            Spacer()
                            ProgressView()
                                .padding()
                            Spacer()
                        }
                    }
                }
                
                if let error = geocodeError {
                    Section {
                        Text(error)
                            .font(AppTypography.caption1())
                            .foregroundColor(AppColors.error)
                    }
                }
            }
            .navigationTitle(address == nil ? "Add Address" : "Edit Address")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveAddress()
                    }
                    .disabled(name.isEmpty || addressText.isEmpty || isGeocoding)
                }
            }
        }
        .navigationViewStyle(.stack)
    }
    
    private func saveAddress() {
        guard !name.isEmpty, !addressText.isEmpty else {
            return
        }
        
        isGeocoding = true
        geocodeError = nil
        
        Task {
            do {
                guard let location = try await locationService.geocodeAddress(addressText) else {
                    await MainActor.run {
                        geocodeError = "Could not find location. Please check the address."
                        isGeocoding = false
                    }
                    return
                }
                
                if let existingAddress = address {
                    // Update existing address
                    var updated = existingAddress
                    updated.name = name
                    updated.address = location.address
                    updated.latitude = location.latitude
                    updated.longitude = location.longitude
                    updated.isDefault = isDefault
                    updated.updatedAt = Date()
                    
                    try await viewModel.updateAddress(updated)
                } else {
                    // Create new address
                    try await viewModel.createAddress(
                        name: name,
                        address: location.address,
                        latitude: location.latitude,
                        longitude: location.longitude,
                        isDefault: isDefault
                    )
                }
                
                await MainActor.run {
                    isPresented = false
                }
            } catch {
                await MainActor.run {
                    geocodeError = error.localizedDescription
                    isGeocoding = false
                }
            }
        }
    }
}

