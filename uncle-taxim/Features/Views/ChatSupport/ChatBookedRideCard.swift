import SwiftUI

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

struct ChatBookedRideCard: View {
    let ride: Ride
    
    var body: some View {
        CardView {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                // Header
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(AppColors.success)
                    
                    Text("Ride Booked!")
                        .font(AppTypography.headline(.semibold))
                        .foregroundColor(AppColors.brandTextPrimary)
                    
                    Spacer()
                    
                    // Status badge
                    Text(ride.status.displayName)
                        .font(AppTypography.caption1(.medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, AppSpacing.sm)
                        .padding(.vertical, 4)
                        .background(statusColor(for: ride.status))
                        .cornerRadius(8)
                    
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(AppColors.brandTextSecondary.opacity(0.5))
                }
                
                Divider()
                
                // Route summary
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    // Dropoff
                    HStack(spacing: AppSpacing.sm) {
                        Circle()
                            .fill(AppColors.success)
                            .frame(width: 8, height: 8)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("To")
                                .font(AppTypography.caption2())
                                .foregroundColor(AppColors.brandTextSecondary)
                            Text(ride.dropoffLocation.address)
                                .font(AppTypography.body(.medium))
                                .foregroundColor(AppColors.brandTextPrimary)
                                .lineLimit(2)
                        }
                    }
                    
                    // Waypoints
                    if !ride.waypoints.isEmpty {
                        ForEach(Array(ride.waypoints.enumerated()), id: \.offset) { index, waypoint in
                            HStack(spacing: AppSpacing.sm) {
                                Circle()
                                    .fill(AppColors.accentOrange)
                                    .frame(width: 6, height: 6)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Via \(index + 1)")
                                        .font(AppTypography.caption2())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                    Text(waypoint.address)
                                        .font(AppTypography.caption1())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                        .lineLimit(1)
                                }
                            }
                        }
                    }
                    
                    // Pickup
                    HStack(spacing: AppSpacing.sm) {
                        Circle()
                            .fill(AppColors.accentBlue)
                            .frame(width: 8, height: 8)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("From")
                                .font(AppTypography.caption2())
                                .foregroundColor(AppColors.brandTextSecondary)
                            Text(ride.pickupLocation.address)
                                .font(AppTypography.body())
                                .foregroundColor(AppColors.brandTextSecondary)
                                .lineLimit(1)
                        }
                    }
                }
                
                Divider()
                
                // Footer with metrics
                HStack(spacing: AppSpacing.md) {
                    RideTypeBadge(rideType: ride.rideType)
                    
                    HStack(spacing: AppSpacing.sm) {
                        Label(formatDistance(ride.estimatedDistance), systemImage: "mappin.circle.fill")
                            .font(AppTypography.caption1())
                            .foregroundColor(AppColors.brandTextSecondary)
                        
                        Label(formatDuration(ride.estimatedDuration), systemImage: "clock.fill")
                            .font(AppTypography.caption1())
                            .foregroundColor(AppColors.brandTextSecondary)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(formatPrice(ride.estimatedPrice))
                            .font(AppTypography.headline(.semibold))
                            .foregroundColor(AppColors.success)
                        Text("Tap to view details")
                            .font(AppTypography.caption2())
                            .foregroundColor(AppColors.brandTextSecondary)
                    }
                }
            }
        }
    }
    
    private func statusColor(for status: RideStatus) -> Color {
        switch status {
        case .pending:
            return AppColors.warning
        case .accepted:
            return AppColors.accentBlue
        case .inProgress:
            return AppColors.success
        case .completed:
            return AppColors.brandTextSecondary
        case .cancelled:
            return AppColors.error
        }
    }
}

