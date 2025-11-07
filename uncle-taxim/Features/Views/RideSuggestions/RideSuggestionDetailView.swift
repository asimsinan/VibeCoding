import SwiftUI
import MapKit
import Foundation

// Helper functions for formatting
private func formatDistance(_ distance: Double) -> String {
    if distance < 1.0 {
        return String(format: "%.0f m", distance * 1000)
    } else {
        return String(format: "%.1f km", distance)
    }
}

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

struct RideSuggestionDetailView: View {
    let suggestion: RideSuggestion
    @StateObject private var bookingViewModel = BookingViewModel()
    @SwiftUI.Environment(\.presentationMode) var presentationMode
    @State private var showBookingConfirmation = false
    @State private var showBookingError = false
    @State private var bookingErrorMessage: String?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Map view
                mapSection
                
                // Route details
                routeDetailsSection
                
                // Price breakdown
                priceBreakdownSection
                
                // Ride info
                rideInfoSection
                
                // Action button
                actionButtonSection
            }
        }
        .background(AppColors.brandBackground)
        .navigationTitle("Ride Details")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Book Ride", isPresented: $showBookingConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Book") {
                bookRide()
            }
        } message: {
            Text("Book this ride suggestion?")
        }
        .alert("Error", isPresented: $showBookingError) {
            Button("OK", role: .cancel) { }
        } message: {
            if let errorMessage = bookingErrorMessage {
                Text(errorMessage)
            }
        }
        .overlay {
            if bookingViewModel.isBooking {
                ZStack {
                    Color.black.opacity(0.3)
                        .ignoresSafeArea()
                    
                    VStack(spacing: AppSpacing.md) {
                        ProgressView()
                            .scaleEffect(1.5)
                            .tint(.white)
                        Text("Booking ride...")
                            .font(AppTypography.body(.medium))
                            .foregroundColor(.white)
                    }
                    .padding(AppSpacing.xl)
                    .background(AppColors.brandSurface)
                    .cornerRadius(16)
                }
            }
        }
    }
    
    // MARK: - Map Section
    private var mapSection: some View {
        RideMapView(
            pickupLocation: suggestion.pickupLocation,
            dropoffLocation: suggestion.dropoffLocation,
            waypoints: suggestion.waypoints
        )
        .frame(height: 300)
        .cornerRadius(0)
    }
    
    // MARK: - Route Details Section
    private var routeDetailsSection: some View {
        CardView {
            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                Text("Route")
                    .font(AppTypography.title3(.bold))
                    .foregroundColor(AppColors.brandTextPrimary)
                
                // Pickup location
                LocationDetailRow(
                    icon: "mappin.circle.fill",
                    iconColor: AppColors.accentBlue,
                    title: "Pickup",
                    address: suggestion.pickupLocation.address,
                    coordinate: (suggestion.pickupLocation.latitude, suggestion.pickupLocation.longitude)
                )
                
                // Waypoints
                if !suggestion.waypoints.isEmpty {
                    ForEach(Array(suggestion.waypoints.enumerated()), id: \.offset) { index, waypoint in
                        LocationDetailRow(
                            icon: "location.circle.fill",
                            iconColor: AppColors.accentOrange,
                            title: "Stop \(index + 1)",
                            address: waypoint.address,
                            coordinate: (waypoint.latitude, waypoint.longitude)
                        )
                    }
                }
                
                // Dropoff location
                LocationDetailRow(
                    icon: "checkmark.circle.fill",
                    iconColor: AppColors.success,
                    title: "Dropoff",
                    address: suggestion.dropoffLocation.address,
                    coordinate: (suggestion.dropoffLocation.latitude, suggestion.dropoffLocation.longitude)
                )
            }
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.top, AppSpacing.lg)
    }
    
    // MARK: - Price Breakdown Section
    private var priceBreakdownSection: some View {
        CardView {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                Text("Price Breakdown")
                    .font(AppTypography.title3(.bold))
                    .foregroundColor(AppColors.brandTextPrimary)
                
                // Main price
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Tahmini Fiyat")
                            .font(AppTypography.body(.medium))
                            .foregroundColor(AppColors.brandTextSecondary)
                        Text(formatPrice(suggestion.estimatedPrice))
                            .font(AppTypography.title1(.bold))
                            .foregroundColor(AppColors.success)
                    }
                    
                    Spacer()
                    
                    RideTypeBadge(rideType: suggestion.rideType)
                }
                
                Divider()
                    .padding(.vertical, AppSpacing.xs)
                
                // Metrics
                HStack(spacing: AppSpacing.xl) {
                    MetricItem(
                        icon: "mappin.circle.fill",
                        label: "Distance",
                        value: formatDistance(suggestion.estimatedDistance)
                    )
                    
                    MetricItem(
                        icon: "clock.fill",
                        label: "Duration",
                        value: formatDuration(suggestion.estimatedDuration)
                    )
                }
                
                // Waypoint fee info
                if !suggestion.waypoints.isEmpty {
                    Divider()
                        .padding(.vertical, AppSpacing.xs)
                    
                    HStack {
                        Text("Durak ücreti")
                            .font(AppTypography.body())
                            .foregroundColor(AppColors.brandTextSecondary)
                        Spacer()
                        Text(formatPrice(Double(suggestion.waypoints.count) * 40.0))
                            .font(AppTypography.body(.medium))
                            .foregroundColor(AppColors.brandTextPrimary)
                    }
                }
            }
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.top, AppSpacing.md)
    }
    
    // MARK: - Ride Info Section
    private var rideInfoSection: some View {
        CardView {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                Text("Ride Information")
                    .font(AppTypography.title3(.bold))
                    .foregroundColor(AppColors.brandTextPrimary)
                
                InfoRow(
                    icon: "calendar",
                    label: "Created",
                    value: formatDate(suggestion.createdAt)
                )
                
                InfoRow(
                    icon: "hourglass",
                    label: "Expires",
                    value: formatDate(suggestion.expiresAt)
                )
                
                if suggestion.isExpired() {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(AppColors.warning)
                        Text("This suggestion has expired")
                            .font(AppTypography.body(.medium))
                            .foregroundColor(AppColors.warning)
                    }
                    .padding(.top, AppSpacing.xs)
                }
            }
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.top, AppSpacing.md)
    }
    
    // MARK: - Action Button Section
    private var actionButtonSection: some View {
        VStack(spacing: AppSpacing.md) {
            if suggestion.canBeAccepted() {
                Button(action: {
                    showBookingConfirmation = true
                }) {
                    HStack {
                        Spacer()
                        Text("Book This Ride")
                            .font(AppTypography.headline(.semibold))
                            .foregroundColor(.white)
                        Spacer()
                    }
                    .frame(height: 56)
                    .background(
                        LinearGradient(
                            colors: [AppColors.accentBlue, AppColors.accentBlue.opacity(0.8)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(16)
                }
                .padding(.horizontal, AppSpacing.lg)
            } else {
                VStack(spacing: AppSpacing.xs) {
                    Text(suggestion.isAccepted ? "Already Booked" : "Expired")
                        .font(AppTypography.headline(.semibold))
                        .foregroundColor(AppColors.brandTextSecondary)
                    Text(suggestion.isAccepted ? "This ride has already been booked" : "This suggestion is no longer available")
                        .font(AppTypography.caption1())
                        .foregroundColor(AppColors.brandTextSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, AppSpacing.md)
                .background(AppColors.brandBackgroundSecondary)
                .cornerRadius(12)
                .padding(.horizontal, AppSpacing.lg)
            }
        }
        .padding(.top, AppSpacing.lg)
        .padding(.bottom, AppSpacing.xl)
    }
    
    // MARK: - Helper Methods
    private func bookRide() {
        guard suggestion.canBeAccepted() else {
            bookingErrorMessage = suggestion.isAccepted ? "This ride has already been booked" : "This suggestion has expired"
            showBookingError = true
            return
        }
        
        Task { @MainActor in
            bookingViewModel.bookRide(suggestion: suggestion)
            
            // Wait for booking to complete
            while bookingViewModel.isBooking {
                try? await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds
            }
            
            if let error = bookingViewModel.errorMessage {
                bookingErrorMessage = error
                showBookingError = true
            } else if bookingViewModel.currentRide != nil {
                // Booking successful - dismiss and navigate to active ride
                presentationMode.wrappedValue.dismiss()
            }
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Supporting Views

struct LocationDetailRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let address: String
    let coordinate: (Double, Double)
    
    var body: some View {
        HStack(alignment: .top, spacing: AppSpacing.md) {
            // Icon
            ZStack {
                Circle()
                    .fill(iconColor.opacity(0.15))
                    .frame(width: 40, height: 40)
                
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(iconColor)
            }
            
            // Address
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(AppTypography.caption1(.semibold))
                    .foregroundColor(AppColors.brandTextSecondary)
                
                Text(address)
                    .font(AppTypography.body())
                    .foregroundColor(AppColors.brandTextPrimary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            
            Spacer()
            
            // Map button
            Button(action: {
                openInMaps()
            }) {
                Image(systemName: "map.fill")
                    .font(.system(size: 16))
                    .foregroundColor(AppColors.accentBlue)
                    .frame(width: 32, height: 32)
                    .background(AppColors.accentBlue.opacity(0.1))
                    .cornerRadius(8)
            }
        }
    }
    
    private func openInMaps() {
        let coordinate = CLLocationCoordinate2D(
            latitude: self.coordinate.0,
            longitude: self.coordinate.1
        )
        let placemark = MKPlacemark(coordinate: coordinate)
        let mapItem = MKMapItem(placemark: placemark)
        mapItem.name = address
        mapItem.openInMaps()
    }
}

struct MetricItem: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundColor(AppColors.brandTextSecondary)
                Text(label)
                    .font(AppTypography.caption1())
                    .foregroundColor(AppColors.brandTextSecondary)
            }
            
            Text(value)
                .font(AppTypography.headline(.semibold))
                .foregroundColor(AppColors.brandTextPrimary)
        }
    }
}

struct InfoRow: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack(spacing: AppSpacing.md) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(AppColors.brandTextSecondary)
                .frame(width: 24)
            
            Text(label)
                .font(AppTypography.body())
                .foregroundColor(AppColors.brandTextSecondary)
            
            Spacer()
            
            Text(value)
                .font(AppTypography.body(.medium))
                .foregroundColor(AppColors.brandTextPrimary)
        }
    }
}

