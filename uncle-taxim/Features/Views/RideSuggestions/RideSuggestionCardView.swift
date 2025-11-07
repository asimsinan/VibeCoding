import SwiftUI

// Helper functions for formatting (using FormatHelpers if available, otherwise local)
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

struct RideSuggestionCardView: View {
    let suggestion: RideSuggestion
    let isCompact: Bool
    
    init(suggestion: RideSuggestion, isCompact: Bool = true) {
        self.suggestion = suggestion
        self.isCompact = isCompact
    }
    
    var body: some View {
        CardView {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                // Header with route info
                HStack(alignment: .top, spacing: AppSpacing.md) {
                    // Route indicator
                    VStack(spacing: 4) {
                        // Pickup dot
                        Circle()
                            .fill(AppColors.accentBlue)
                            .frame(width: 10, height: 10)
                        
                        // Route line
                        if suggestion.waypoints.isEmpty {
                            Rectangle()
                                .fill(AppColors.accentBlue.opacity(0.3))
                                .frame(width: 2)
                                .frame(maxHeight: .infinity)
                        } else {
                            // Dashed line for waypoints
                            VStack(spacing: 2) {
                                ForEach(0..<suggestion.waypoints.count, id: \.self) { _ in
                                    Circle()
                                        .fill(AppColors.accentBlue.opacity(0.5))
                                        .frame(width: 6, height: 6)
                                }
                            }
                            .frame(maxHeight: .infinity)
                        }
                        
                        // Dropoff dot
                        Circle()
                            .fill(AppColors.success)
                            .frame(width: 10, height: 10)
                    }
                    .frame(width: 20)
                    
                    // Location details
                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                        // Dropoff (destination)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("To")
                                .font(AppTypography.caption2())
                                .foregroundColor(AppColors.brandTextSecondary)
                            Text(suggestion.dropoffLocation.address)
                                .font(AppTypography.headline(.semibold))
                                .foregroundColor(AppColors.brandTextPrimary)
                                .lineLimit(2)
                        }
                        
                        // Waypoints
                        if !suggestion.waypoints.isEmpty {
                            ForEach(Array(suggestion.waypoints.enumerated()), id: \.offset) { index, waypoint in
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Via \(index + 1)")
                                        .font(AppTypography.caption2())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                    Text(waypoint.address)
                                        .font(AppTypography.body(.medium))
                                        .foregroundColor(AppColors.brandTextSecondary)
                                        .lineLimit(1)
                                }
                            }
                        }
                        
                        // Pickup
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
                    
                    Spacer()
                }
                
                Divider()
                    .padding(.vertical, AppSpacing.xs)
                
                // Footer with metrics and price
                HStack(spacing: AppSpacing.md) {
                    // Ride type badge
                    RideTypeBadge(rideType: suggestion.rideType)
                    
                    // Metrics
                    HStack(spacing: AppSpacing.sm) {
                        Label(formatDistance(suggestion.estimatedDistance), systemImage: "mappin.circle.fill")
                            .font(AppTypography.caption1())
                            .foregroundColor(AppColors.brandTextSecondary)
                        
                        Label(formatDuration(suggestion.estimatedDuration), systemImage: "clock.fill")
                            .font(AppTypography.caption1())
                            .foregroundColor(AppColors.brandTextSecondary)
                    }
                    
                    Spacer()
                    
                    // Price
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(formatPrice(suggestion.estimatedPrice))
                            .font(AppTypography.title3(.bold))
                            .foregroundColor(AppColors.success)
                        Text("Tahmini fiyat")
                            .font(AppTypography.caption2())
                            .foregroundColor(AppColors.brandTextSecondary)
                    }
                    
                    // Chevron indicator
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(AppColors.brandTextSecondary.opacity(0.5))
                        .padding(.leading, AppSpacing.xs)
                }
                
                // Expiration warning if close to expiring
                if !suggestion.isExpired() {
                    let timeUntilExpiry = suggestion.expiresAt.timeIntervalSinceNow
                    let hoursUntilExpiry = timeUntilExpiry / 3600
                    if hoursUntilExpiry > 0 && hoursUntilExpiry < 24 {
                        HStack(spacing: AppSpacing.xs) {
                            Image(systemName: "clock.badge.exclamationmark")
                                .font(.system(size: 12))
                                .foregroundColor(AppColors.warning)
                            Text(hoursUntilExpiry < 1 
                                ? "\(Int(timeUntilExpiry / 60)) dakika içinde sona eriyor"
                                : "\(Int(hoursUntilExpiry)) saat içinde sona eriyor")
                                .font(AppTypography.caption2())
                                .foregroundColor(AppColors.warning)
                        }
                        .padding(.top, AppSpacing.xs)
                    }
                }
            }
        }
    }
}

/// Badge showing ride type
struct RideTypeBadge: View {
    let rideType: RideType
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: rideTypeIcon)
                .font(.system(size: 10, weight: .semibold))
            Text(rideTypeLabel)
                .font(AppTypography.caption2(.semibold))
        }
        .foregroundColor(rideTypeColor)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(rideTypeColor.opacity(0.15))
        .cornerRadius(8)
    }
    
    private var rideTypeIcon: String {
        switch rideType {
        case .standard:
            return "car.fill"
        case .premium:
            return "star.fill"
        case .shared:
            return "person.2.fill"
        }
    }
    
    private var rideTypeLabel: String {
        switch rideType {
        case .standard:
            return "Standard"
        case .premium:
            return "Premium"
        case .shared:
            return "Shared"
        }
    }
    
    private var rideTypeColor: Color {
        switch rideType {
        case .standard:
            return AppColors.accentBlue
        case .premium:
            return AppColors.accentPurple
        case .shared:
            return AppColors.accentGreen
        }
    }
}
