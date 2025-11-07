import SwiftUI

struct SavedAddressesView: View {
    @StateObject private var viewModel = SavedAddressesViewModel()
    @State private var showingAddAddress = false
    @State private var editingAddress: SavedAddress?
    
    var body: some View {
        List {
            if viewModel.savedAddresses.isEmpty && !viewModel.isLoading {
                emptyStateView
            } else {
                ForEach(viewModel.savedAddresses) { address in
                    SavedAddressRow(
                        address: address,
                        onEdit: {
                            editingAddress = address
                        },
                        onDelete: {
                            Task {
                                try? await viewModel.deleteAddress(address)
                            }
                        },
                        onToggleDefault: {
                            Task {
                                try? await viewModel.toggleDefault(address)
                            }
                        }
                    )
                }
            }
        }
        .navigationTitle("Saved Addresses")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    showingAddAddress = true
                }) {
                    Image(systemName: "plus")
                        .foregroundColor(AppColors.accentBlue)
                }
            }
        }
        .sheet(isPresented: $showingAddAddress) {
            AddEditAddressView(
                viewModel: viewModel,
                isPresented: $showingAddAddress
            )
        }
        .sheet(item: $editingAddress) { address in
            AddEditAddressView(
                viewModel: viewModel,
                address: address,
                isPresented: Binding(
                    get: { editingAddress != nil },
                    set: { if !$0 { editingAddress = nil } }
                )
            )
        }
        .onAppear {
            viewModel.loadAddresses()
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: AppSpacing.lg) {
            Image(systemName: "mappin.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(AppColors.accentBlue.opacity(0.3))
                .padding(.top, AppSpacing.xxxl)
            
            Text("No Saved Addresses")
                .font(AppTypography.title2(.bold))
                .foregroundColor(AppColors.brandTextPrimary)
            
            Text("Add your favorite locations like Home or Work for quick access")
                .font(AppTypography.body())
                .foregroundColor(AppColors.brandTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, AppSpacing.lg)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct SavedAddressRow: View {
    let address: SavedAddress
    let onEdit: () -> Void
    let onDelete: () -> Void
    let onToggleDefault: () -> Void
    
    var body: some View {
        HStack(spacing: AppSpacing.md) {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(address.name)
                        .font(AppTypography.headline())
                        .foregroundColor(AppColors.brandTextPrimary)
                    
                    if address.isDefault {
                        Text("Default")
                            .font(AppTypography.caption1())
                            .foregroundColor(AppColors.success)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(AppColors.success.opacity(0.1))
                            .cornerRadius(4)
                    }
                }
                
                Text(address.address)
                    .font(AppTypography.body())
                    .foregroundColor(AppColors.brandTextSecondary)
                    .lineLimit(2)
            }
            
            Spacer()
            
            Menu {
                Button(action: onToggleDefault) {
                    Label(
                        address.isDefault ? "Remove Default" : "Set as Default",
                        systemImage: address.isDefault ? "star.fill" : "star"
                    )
                }
                
                Button(action: onEdit) {
                    Label("Edit", systemImage: "pencil")
                }
                
                Button(role: .destructive, action: onDelete) {
                    Label("Delete", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .foregroundColor(AppColors.brandTextSecondary)
                    .padding(8)
            }
        }
        .padding(.vertical, AppSpacing.xs)
    }
}

