import SwiftUI
import MapKit

struct RideTrackingView: View {
    let ride: Ride
    
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
    
    var body: some View {
        ScrollView {
            VStack(spacing: AppSpacing.lg) {
                // Map View
                CardView(cornerRadius: 0, shadowRadius: 0) {
                    RideMapView(
                        pickupLocation: ride.pickupLocation,
                        dropoffLocation: ride.dropoffLocation,
                        waypoints: ride.waypoints
                    )
                    .frame(height: 300)
                    .cornerRadius(16)
                }
                .padding(.horizontal, AppSpacing.md)
                
                // Ride Details Card
                CardView {
                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        Text("Ride Details")
                            .font(AppTypography.title2())
                        
                        // Status badge
                        HStack {
                            Text("Status:")
                                .font(AppTypography.body(.medium))
                                .foregroundColor(AppColors.brandTextSecondary)
                            
                            Text(ride.status.displayName)
                                .font(AppTypography.body(.semibold))
                                .foregroundColor(.white)
                                .padding(.horizontal, AppSpacing.sm)
                                .padding(.vertical, AppSpacing.xs)
                                .background(statusColor(for: ride.status))
                                .cornerRadius(8)
                            
                            Spacer()
                        }
                        
                        Divider()
                        
                        // Pickup Location
                        LocationRow(
                            icon: "location.fill",
                            iconColor: AppColors.accentGreen,
                            title: "Pickup",
                            address: ride.pickupLocation.address
                        )
                        
                        // Waypoints (Intermediate Stops)
                        if !ride.waypoints.isEmpty {
                            ForEach(Array(ride.waypoints.enumerated()), id: \.offset) { index, waypoint in
                                LocationRow(
                                    icon: "mappin.circle.fill",
                                    iconColor: AppColors.accentOrange,
                                    title: "Stop \(index + 1)",
                                    address: waypoint.address
                                )
                            }
                        }
                        
                        // Dropoff Location
                        LocationRow(
                            icon: "mappin.circle.fill",
                            iconColor: AppColors.error,
                            title: "Dropoff",
                            address: ride.dropoffLocation.address
                        )
                        
                        Divider()
                        
                        // Ride Info
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Price")
                                    .font(AppTypography.caption1())
                                    .foregroundColor(AppColors.brandTextSecondary)
                                Text(formatPrice(ride.actualPrice ?? ride.estimatedPrice))
                                    .font(AppTypography.headline())
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .leading) {
                                Text("Distance")
                                    .font(AppTypography.caption1())
                                    .foregroundColor(AppColors.brandTextSecondary)
                                Text(formatDistance(ride.actualDistance ?? ride.estimatedDistance))
                                    .font(AppTypography.headline())
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .leading) {
                                Text("Duration")
                                    .font(AppTypography.caption1())
                                    .foregroundColor(AppColors.brandTextSecondary)
                                Text(formatDuration(ride.actualDuration ?? ride.estimatedDuration))
                                    .font(AppTypography.headline())
                            }
                        }
                    }
                    .padding(AppSpacing.lg)
                }
                .padding(.horizontal, AppSpacing.md)
            }
            .padding(.vertical, AppSpacing.md)
        }
        .navigationTitle("Track Ride")
    }
    
    private func statusColor(for status: RideStatus) -> Color {
        switch status {
        case .pending:
            return AppColors.accentOrange
        case .accepted:
            return AppColors.accentBlue
        case .inProgress:
            return AppColors.accentGreen
        case .completed:
            return AppColors.success
        case .cancelled:
            return AppColors.error
        }
    }
}

