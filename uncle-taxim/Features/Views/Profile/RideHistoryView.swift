import SwiftUI

struct RideHistoryView: View {
    @StateObject private var viewModel = TripSummaryViewModel()
    @ObservedObject private var networkMonitor = NetworkMonitorService.shared
    
    private func formatPrice(_ price: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = 2
        formatter.groupingSeparator = "."
        formatter.decimalSeparator = ","
        
        if let formatted = formatter.string(from: NSNumber(value: price)) {
            return "\(formatted) ₺"
        }
        return String(format: "%.2f ₺", price)
    }
    
    var body: some View {
        List {
            OfflineBannerView(
                networkMonitor: networkMonitor,
                isCached: viewModel.isDataFromCache,
                lastUpdated: viewModel.lastUpdated
            )
            
            ForEach(viewModel.summaries) { summary in
                NavigationLink(destination: TripSummaryDetailView(summary: summary)) {
                    CardView {
                        VStack(alignment: .leading, spacing: AppSpacing.md) {
                            Text(summary.createdAt, style: .date)
                                .font(AppTypography.headline())
                            
                            HStack {
                                Text("Mesafe: \(String(format: "%.2f", summary.tripSummary.totalDistance)) km")
                                    .font(AppTypography.body())
                                
                                Spacer()
                                
                                if let co2Footprint = summary.tripSummary.calculatedCO2Footprint {
                                    HStack(spacing: 4) {
                                        Image(systemName: "leaf.fill")
                                            .foregroundColor(AppColors.success)
                                            .font(.system(size: 12))
                                        Text("\(String(format: "%.2f", co2Footprint)) kg CO₂")
                                            .font(AppTypography.footnote())
                                            .foregroundColor(AppColors.brandTextSecondary)
                                    }
                                }
                            }
                            
                            Text("Maliyet: \(formatPrice(summary.tripSummary.totalCost))")
                                .font(AppTypography.footnote())
                                .foregroundColor(AppColors.success)
                        }
                    }
                }
            }
        }
        .navigationTitle("Ride History")
        .onAppear {
            viewModel.loadSummaries()
        }
    }
}

