import SwiftUI

struct TransactionHistoryView: View {
    @StateObject private var viewModel = TransactionHistoryViewModel()
    @ObservedObject private var networkMonitor = NetworkMonitorService.shared
    
    var body: some View {
        List {
            OfflineBannerView(
                networkMonitor: networkMonitor,
                isCached: viewModel.isDataFromCache,
                lastUpdated: viewModel.lastUpdated
            )
            
            if viewModel.isLoading && viewModel.transactions.isEmpty {
                HStack {
                    Spacer()
                    ProgressView()
                        .padding()
                    Spacer()
                }
            } else if viewModel.transactions.isEmpty {
                VStack(spacing: AppSpacing.md) {
                    Image(systemName: "creditcard")
                        .font(.system(size: 60))
                        .foregroundColor(AppColors.brandTextSecondary)
                    
                    Text("No Transactions")
                        .font(AppTypography.title3(.semibold))
                        .foregroundColor(AppColors.brandTextPrimary)
                    
                    Text("Your payment history will appear here")
                        .font(AppTypography.body())
                        .foregroundColor(AppColors.brandTextSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, AppSpacing.xl)
            } else {
                ForEach(viewModel.transactions) { transaction in
                    TransactionRowView(transaction: transaction)
                }
            }
        }
        .navigationTitle("Payment History")
        .onAppear {
            viewModel.loadTransactions()
        }
        .refreshable {
            viewModel.loadTransactions()
        }
    }
}

struct TransactionRowView: View {
    let transaction: Transaction
    
    var body: some View {
        CardView {
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                HStack {
                    // Transaction Type Icon
                    Image(systemName: transactionIcon)
                        .font(.system(size: 24))
                        .foregroundColor(transactionColor)
                        .frame(width: 40, height: 40)
                        .background(transactionColor.opacity(0.1))
                        .clipShape(Circle())
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(transaction.typeDisplayName)
                            .font(AppTypography.headline(.semibold))
                            .foregroundColor(AppColors.brandTextPrimary)
                        
                        if let description = transaction.description {
                            Text(description)
                                .font(AppTypography.footnote())
                                .foregroundColor(AppColors.brandTextSecondary)
                                .lineLimit(transaction.status == .failed ? 3 : 2)
                        }
                        
                        // Show error message if payment failed
                        if transaction.status == .failed,
                           let errorMessage = transaction.metadata?["error"] {
                            Text(errorMessage)
                                .font(AppTypography.caption2())
                                .foregroundColor(AppColors.error)
                                .lineLimit(2)
                        }
                        
                        Text(transaction.createdAt, style: .date)
                            .font(AppTypography.caption1())
                            .foregroundColor(AppColors.brandTextSecondary)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 4) {
                        Text(transaction.formattedAmount)
                            .font(AppTypography.headline(.semibold))
                            .foregroundColor(transactionColor)
                        
                        StatusBadge(status: transaction.status)
                    }
                }
            }
            .padding(AppSpacing.sm)
        }
    }
    
    private var transactionIcon: String {
        switch transaction.type {
        case .charge:
            return "arrow.down.circle.fill"
        case .refund:
            return "arrow.up.circle.fill"
        case .cancellationFee:
            return "xmark.circle.fill"
        }
    }
    
    private var transactionColor: Color {
        switch transaction.type {
        case .charge:
            return transaction.status == .succeeded ? AppColors.success : AppColors.error
        case .refund:
            return AppColors.success
        case .cancellationFee:
            return AppColors.warning
        }
    }
}

struct StatusBadge: View {
    let status: Transaction.TransactionStatus
    
    var body: some View {
        Text(statusDisplayName)
            .font(AppTypography.caption1(.semibold))
            .foregroundColor(statusColor)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.1))
            .cornerRadius(8)
    }
    
    private var statusDisplayName: String {
        switch status {
        case .pending:
            return "Pending"
        case .processing:
            return "Processing"
        case .succeeded:
            return "Success"
        case .failed:
            return "Failed"
        case .refunded:
            return "Refunded"
        case .partiallyRefunded:
            return "Partial Refund"
        }
    }
    
    private var statusColor: Color {
        switch status {
        case .pending, .processing:
            return AppColors.warning
        case .succeeded, .refunded:
            return AppColors.success
        case .failed:
            return AppColors.error
        case .partiallyRefunded:
            return AppColors.accentBlue
        }
    }
}

