import SwiftUI

struct TripSummaryDetailView: View {
    @State private var summary: TripSummary
    @State private var timeRecommendations: [Date] = []
    @State private var transactions: [Transaction] = []
    @State private var isLoadingTransactions = false
    @State private var showRatingView = false
    
    private let timeRecommendationEngine = TimeRecommendationEngine()
    private let dataService = FirebaseDataService()
    
    init(summary: TripSummary) {
        _summary = State(initialValue: summary)
    }
    
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
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.paddingLarge) {
                CardView {
                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        Text("Date: \(summary.createdAt, style: .date)")
                            .font(AppTypography.body())
                        
                        Text("Distance: \(String(format: "%.2f", summary.tripSummary.totalDistance)) km")
                            .font(AppTypography.body())
                        
                        Text("Duration: \(formatDuration(summary.tripSummary.totalDuration))")
                            .font(AppTypography.body())
                        
                        HStack {
                            Text("Maliyet: \(formatPrice(summary.tripSummary.totalCost))")
                                .font(AppTypography.headline())
                                .foregroundColor(AppColors.success)
                            
                            Spacer()
                            
                            // Payment Status
                            if let paymentTransaction = transactions.first(where: { $0.type == .charge }) {
                                StatusBadge(status: paymentTransaction.status)
                            } else if isLoadingTransactions {
                                ProgressView()
                                    .scaleEffect(0.8)
                            }
                        }
                        
                        // Payment Details
                        if let paymentTransaction = transactions.first(where: { $0.type == .charge }) {
                            Divider()
                                .padding(.vertical, AppSpacing.xs)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Image(systemName: "creditcard.fill")
                                        .foregroundColor(AppColors.accentBlue)
                                        .font(.system(size: 16))
                                    
                                    Text("Payment")
                                        .font(AppTypography.footnote())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                    
                                    Spacer()
                                    
                                    Text(paymentTransaction.formattedAmount)
                                        .font(AppTypography.body(.semibold))
                                        .foregroundColor(paymentTransaction.status == .succeeded ? AppColors.success : AppColors.error)
                                }
                                
                                if paymentTransaction.status == .succeeded {
                                    Text("Paid on \(paymentTransaction.createdAt, style: .date)")
                                        .font(AppTypography.caption1())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                } else if paymentTransaction.status == .failed {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Payment failed")
                                            .font(AppTypography.caption1(.semibold))
                                            .foregroundColor(AppColors.error)
                                        
                                        if let errorMessage = paymentTransaction.metadata?["error"] {
                                            Text(errorMessage)
                                                .font(AppTypography.caption2())
                                                .foregroundColor(AppColors.brandTextSecondary)
                                        } else if let description = paymentTransaction.description,
                                                  description.contains("Payment failed:") {
                                            Text(String(description.dropFirst("Payment failed: ".count)))
                                                .font(AppTypography.caption2())
                                                .foregroundColor(AppColors.brandTextSecondary)
                                        } else {
                                            Text("Please try again or contact support")
                                                .font(AppTypography.caption2())
                                                .foregroundColor(AppColors.brandTextSecondary)
                                        }
                                    }
                                }
                            }
                        }
                        
                        if let co2Footprint = summary.tripSummary.calculatedCO2Footprint {
                            Divider()
                                .padding(.vertical, AppSpacing.xs)
                            
                            HStack {
                                Image(systemName: "leaf.fill")
                                    .foregroundColor(AppColors.success)
                                    .font(.system(size: 20))
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("CO₂ Footprint")
                                        .font(AppTypography.body())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                    
                                    Text("\(String(format: "%.2f", co2Footprint)) kg CO₂")
                                        .font(AppTypography.headline())
                                        .foregroundColor(AppColors.brandTextPrimary)
                                }
                                
                                Spacer()
                            }
                        }
                    }
                }
            
            // Route Map Visualization
            CardView {
                VStack(alignment: .leading, spacing: AppSpacing.md) {
                    HStack {
                        Image(systemName: "map.fill")
                            .foregroundColor(AppColors.accentBlue)
                            .font(.system(size: 20))
                        
                        Text("Route")
                            .font(AppTypography.title2())
                        
                        Spacer()
                    }
                    
                    Text("Trip route from pickup to dropoff")
                        .font(AppTypography.footnote())
                        .foregroundColor(AppColors.brandTextSecondary)
                    
                    Divider()
                        .padding(.vertical, AppSpacing.xs)
                    
                    // Map view
                    TripSummaryMapView(
                        pickupAddress: summary.tripSummary.pickupLocation,
                        dropoffAddress: summary.tripSummary.dropoffLocation,
                        routePoints: summary.tripSummary.route
                    )
                    .frame(height: 250)
                    .cornerRadius(12)
                }
            }
            
            // Driver Rating Section
            CardView {
                VStack(alignment: .leading, spacing: AppSpacing.md) {
                    HStack {
                        Image(systemName: "star.fill")
                            .foregroundColor(AppColors.accentOrange)
                            .font(.system(size: 20))
                        
                        Text("Driver Rating")
                            .font(AppTypography.title2())
                        
                        Spacer()
                    }
                    
                    if let userRating = summary.userRating {
                        // Show existing rating
                        VStack(alignment: .leading, spacing: AppSpacing.sm) {
                            HStack(spacing: AppSpacing.xs) {
                                ForEach(1...5, id: \.self) { rating in
                                    Image(systemName: userRating >= Double(rating) ? "star.fill" : "star")
                                        .font(.system(size: 20))
                                        .foregroundColor(userRating >= Double(rating) ? AppColors.accentOrange : AppColors.brandTextSecondary)
                                }
                                
                                Text(String(format: "%.1f", userRating))
                                    .font(AppTypography.headline())
                                    .foregroundColor(AppColors.brandTextPrimary)
                                    .padding(.leading, AppSpacing.xs)
                            }
                            
                            if let feedback = summary.userFeedback, !feedback.isEmpty {
                                Text(feedback)
                                    .font(AppTypography.body())
                                    .foregroundColor(AppColors.brandTextSecondary)
                                    .padding(.top, AppSpacing.xs)
                            }
                        }
                    } else {
                        // Show rating prompt
                        VStack(alignment: .leading, spacing: AppSpacing.sm) {
                            Text("Rate your driver to help improve our service")
                                .font(AppTypography.body())
                                .foregroundColor(AppColors.brandTextSecondary)
                            
                            Button(action: {
                                showRatingView = true
                            }) {
                                HStack {
                                    Text("Rate Driver")
                                        .font(AppTypography.headline(.semibold))
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 14))
                                }
                                .foregroundColor(AppColors.accentBlue)
                                .padding(.vertical, AppSpacing.sm)
                            }
                            .sheet(isPresented: $showRatingView, onDismiss: {
                                refreshTripSummary()
                            }) {
                                NavigationView {
                                    DriverRatingView(summary: summary, onDismiss: {
                                        showRatingView = false
                                        refreshTripSummary()
                                    })
                                }
                            }
                        }
                    }
                }
            }
            
            // Best Travel Time Recommendations
            if !timeRecommendations.isEmpty {
                CardView {
                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        HStack {
                            Image(systemName: "clock.fill")
                                .foregroundColor(AppColors.accentBlue)
                                .font(.system(size: 20))
                            
                            Text("Best Travel Times")
                                .font(AppTypography.title2())
                            
                            Spacer()
                        }
                        
                        Text("Optimal times for your next trip")
                            .font(AppTypography.footnote())
                            .foregroundColor(AppColors.brandTextSecondary)
                        
                        Divider()
                            .padding(.vertical, AppSpacing.xs)
                        
                        VStack(alignment: .leading, spacing: AppSpacing.sm) {
                            ForEach(timeRecommendations, id: \.self) { time in
                                HStack {
                                    Image(systemName: "clock.badge.checkmark")
                                        .foregroundColor(AppColors.accentBlue)
                                        .font(.system(size: 16))
                                    
                                    Text(time, style: .time)
                                        .font(AppTypography.body())
                                        .foregroundColor(AppColors.brandTextPrimary)
                                    
                                    Spacer()
                                    
                                    Text(time, style: .date)
                                        .font(AppTypography.footnote())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                }
                                .padding(.vertical, 4)
                            }
                        }
                    }
                }
            }
            }
            .padding()
        }
        .navigationTitle("Trip Details")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            loadTimeRecommendations()
            loadTransactions()
        }
    }
    
    private func loadTimeRecommendations() {
        // Get recommendations based on current time for future trips
        timeRecommendations = timeRecommendationEngine.getRecommendations(currentTime: Date())
    }
    
    private func loadTransactions() {
        let rideId = summary.rideId
        
        isLoadingTransactions = true
        Task {
            do {
                let fetchedTransactions = try await dataService.getRideTransactions(rideId: rideId)
                await MainActor.run {
                    self.transactions = fetchedTransactions
                    self.isLoadingTransactions = false
                }
            } catch {
                await MainActor.run {
                    self.isLoadingTransactions = false
                }
            }
        }
    }
    
    private func refreshTripSummary() {
        guard let summaryId = summary.id else { return }
        
        Task {
            do {
                if let refreshedSummary = try await dataService.getTripSummary(summaryId: summaryId) {
                    await MainActor.run {
                        self.summary = refreshedSummary
                    }
                }
            } catch {
                // Silently fail - the view will still show the old data
                // In a production app, you might want to show an error
            }
        }
    }
}

