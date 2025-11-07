import SwiftUI

struct TripSummaryView: View {
    @StateObject private var viewModel = TripSummaryViewModel()
    @ObservedObject private var networkMonitor = NetworkMonitorService.shared
    
    // Helper function for formatting duration
    private func formatDuration(_ minutes: Int) -> String {
        guard minutes > 0 else {
            return "0min"
        }
        
        let hours = minutes / 60
        let remainingMinutes = minutes % 60
        
        if hours > 0 && remainingMinutes > 0 {
            return "\(hours)h \(remainingMinutes)min"
        } else if hours > 0 {
            return "\(hours)h"
        } else {
            return "\(minutes)min"
        }
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
                                Text("Distance: \(String(format: "%.2f", summary.tripSummary.totalDistance)) km")
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
                            
                            Text("Duration: \(formatDuration(summary.tripSummary.totalDuration))")
                                .font(AppTypography.footnote())
                        }
                    }
                }
            }
        }
        .navigationTitle("Trip History")
        .onAppear {
            viewModel.loadSummaries()
        }
    }
}

