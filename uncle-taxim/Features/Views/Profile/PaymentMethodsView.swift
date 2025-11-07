import SwiftUI

struct PaymentMethodsView: View {
    @StateObject private var viewModel = PaymentMethodsViewModel()
    @State private var showingAddPaymentMethod = false
    @State private var editingPaymentMethod: PaymentMethod?
    @ObservedObject private var networkMonitor = NetworkMonitorService.shared
    
    var body: some View {
        ZStack {
            AppColors.brandBackground
                .ignoresSafeArea()
            
            contentView
        }
        .navigationTitle("Payment Methods")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: AppSpacing.sm) {
                    // Add test cards button (for development/testing)
                    #if DEBUG
                    Button(action: {
                        Task {
                            await viewModel.addStripeTestCards()
                        }
                    }) {
                        Image(systemName: "creditcard.trianglebadge.exclamationmark")
                            .font(.title3)
                            .foregroundColor(AppColors.accentOrange)
                    }
                    #endif
                    
                    Button(action: {
                        showingAddPaymentMethod = true
                    }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(AppColors.accentBlue)
                    }
                }
            }
        }
        .sheet(isPresented: $showingAddPaymentMethod) {
            AddEditPaymentMethodView(
                viewModel: viewModel,
                isPresented: $showingAddPaymentMethod
            )
        }
        .sheet(item: $editingPaymentMethod) { method in
            AddEditPaymentMethodView(
                viewModel: viewModel,
                paymentMethod: method,
                isPresented: Binding(
                    get: { editingPaymentMethod != nil },
                    set: { if !$0 { editingPaymentMethod = nil } }
                )
            )
        }
        .onAppear {
            viewModel.loadPaymentMethods()
        }
        .alert(
            "Error",
            isPresented: Binding(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 {
                    Task { @MainActor in
                        viewModel.errorMessage = nil
                    }
                } }
            )
        ) {
            Button("OK") {
                Task { @MainActor in
                    viewModel.errorMessage = nil
                }
            }
        } message: {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
            }
        }
    }
    
    @ViewBuilder
    private var contentView: some View {
        if viewModel.isLoading && viewModel.paymentMethods.isEmpty {
            LoadingIndicator()
        } else if viewModel.paymentMethods.isEmpty {
            emptyState
        } else {
            paymentMethodsList
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: AppSpacing.lg) {
            Image(systemName: "creditcard.fill")
                .font(.system(size: 60))
                .foregroundColor(AppColors.accentBlue.opacity(0.3))
                .padding(.top, AppSpacing.xxxl)
            
            Text("No Payment Methods")
                .font(AppTypography.title2(.bold))
                .foregroundColor(AppColors.brandTextPrimary)
            
            Text("Add a payment method to book rides quickly and securely.")
                .font(AppTypography.body())
                .foregroundColor(AppColors.brandTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, AppSpacing.lg)
            
            VStack(spacing: AppSpacing.md) {
                Button(action: {
                    showingAddPaymentMethod = true
                }) {
                    Text("Add Payment Method")
                        .font(AppTypography.headline(.semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, AppSpacing.md)
                        .background(AppColors.gradientAccent)
                        .cornerRadius(12)
                }
                
                #if DEBUG
                Button(action: {
                    Task {
                        await viewModel.addStripeTestCards()
                    }
                }) {
                    HStack {
                        Image(systemName: "creditcard.trianglebadge.exclamationmark")
                        Text("Add Stripe Test Cards")
                            .font(AppTypography.body(.semibold))
                    }
                    .foregroundColor(AppColors.accentOrange)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, AppSpacing.md)
                    .background(AppColors.accentOrange.opacity(0.1))
                    .cornerRadius(12)
                }
                #endif
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.top, AppSpacing.md)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var paymentMethodsList: some View {
        List {
            OfflineBannerView(
                networkMonitor: networkMonitor,
                isCached: viewModel.isDataFromCache,
                lastUpdated: viewModel.lastUpdated
            )
            
            ForEach(viewModel.paymentMethods) { method in
                PaymentMethodRow(
                    method: method,
                    onEdit: {
                        editingPaymentMethod = method
                    },
                    onDelete: {
                        Task {
                            if let id = method.id {
                                await viewModel.deletePaymentMethod(id: id)
                            }
                        }
                    },
                    onSetDefault: {
                        Task {
                            await viewModel.setDefaultPaymentMethod(method)
                        }
                    }
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets(
                    top: AppSpacing.sm,
                    leading: AppSpacing.md,
                    bottom: AppSpacing.sm,
                    trailing: AppSpacing.md
                ))
            }
        }
        .listStyle(.plain)
        .background(AppColors.brandBackground)
        .refreshable {
            HapticFeedbackManager.shared.selectionChanged()
            viewModel.loadPaymentMethods()
        }
    }
}

struct PaymentMethodRow: View {
    let method: PaymentMethod
    let onEdit: () -> Void
    let onDelete: () -> Void
    let onSetDefault: () -> Void
    
    var body: some View {
        CardView {
            HStack(spacing: AppSpacing.md) {
                // Payment method icon
                Image(systemName: iconName)
                    .font(.system(size: 32))
                    .foregroundColor(iconColor)
                    .frame(width: 50, height: 50)
                    .background(iconColor.opacity(0.1))
                    .cornerRadius(12)
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(method.displayName)
                            .font(AppTypography.headline())
                            .foregroundColor(AppColors.brandTextPrimary)
                        
                        if method.isDefault {
                            Text("Default")
                                .font(AppTypography.caption1())
                                .foregroundColor(AppColors.success)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(AppColors.success.opacity(0.1))
                                .cornerRadius(4)
                        }
                        
                        if method.isExpired {
                            Text("Expired")
                                .font(AppTypography.caption1())
                                .foregroundColor(AppColors.error)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(AppColors.error.opacity(0.1))
                                .cornerRadius(4)
                        }
                    }
                    
                    if let expiry = method.formattedExpiry {
                        Text("Expires \(expiry)")
                            .font(AppTypography.footnote())
                            .foregroundColor(AppColors.brandTextSecondary)
                    }
                }
                
                Spacer()
                
                Menu {
                    if !method.isDefault {
                        Button(action: onSetDefault) {
                            Label("Set as Default", systemImage: "star.fill")
                        }
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
    
    private var iconName: String {
        switch method.type {
        case .creditCard, .debitCard:
            return "creditcard.fill"
        case .applePay:
            return "applepay"
        case .googlePay:
            return "g.circle.fill"
        }
    }
    
    private var iconColor: Color {
        if method.isExpired {
            return AppColors.error
        }
        
        switch method.type {
        case .creditCard, .debitCard:
            return AppColors.accentBlue
        case .applePay:
            return AppColors.brandTextPrimary
        case .googlePay:
            return AppColors.accentGreen
        }
    }
}
