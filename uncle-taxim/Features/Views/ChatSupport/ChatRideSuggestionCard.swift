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

struct ChatRideSuggestionCard: View {
    let suggestion: RideSuggestion
    
    var body: some View {
        CardView {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                // Header
                HStack {
                    Image(systemName: "car.fill")
                        .font(.system(size: 20))
                        .foregroundColor(AppColors.accentBlue)
                    
                    Text("Ride Suggestion")
                        .font(AppTypography.headline(.semibold))
                        .foregroundColor(AppColors.brandTextPrimary)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(AppColors.brandTextSecondary.opacity(0.5))
                }
                
                Divider()
                
                // Route
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
                            Text(suggestion.dropoffLocation.address)
                                .font(AppTypography.body(.medium))
                                .foregroundColor(AppColors.brandTextPrimary)
                                .lineLimit(2)
                        }
                    }
                    
                    // Waypoints
                    if !suggestion.waypoints.isEmpty {
                        ForEach(Array(suggestion.waypoints.enumerated()), id: \.offset) { index, waypoint in
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
                            Text(suggestion.pickupLocation.address)
                                .font(AppTypography.body())
                                .foregroundColor(AppColors.brandTextSecondary)
                                .lineLimit(1)
                        }
                    }
                }
                
                Divider()
                
                // Footer with price and metrics
                HStack(spacing: AppSpacing.md) {
                    RideTypeBadge(rideType: suggestion.rideType)
                    
                    HStack(spacing: AppSpacing.sm) {
                        Label(formatDistance(suggestion.estimatedDistance), systemImage: "mappin.circle.fill")
                            .font(AppTypography.caption1())
                            .foregroundColor(AppColors.brandTextSecondary)
                        
                        Label(formatDuration(suggestion.estimatedDuration), systemImage: "clock.fill")
                            .font(AppTypography.caption1())
                            .foregroundColor(AppColors.brandTextSecondary)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(formatPrice(suggestion.estimatedPrice))
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
}

