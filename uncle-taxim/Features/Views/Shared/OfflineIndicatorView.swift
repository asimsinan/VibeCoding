import SwiftUI

/// Reusable view component to show offline/cache status indicators
struct OfflineIndicatorView: View {
    let isOffline: Bool
    let isCached: Bool
    let lastUpdated: Date?
    
    var body: some View {
        if isOffline || isCached {
            HStack(spacing: 6) {
                Image(systemName: iconName)
                    .font(.system(size: 12))
                    .foregroundColor(iconColor)
                
                Text(message)
                    .font(AppTypography.caption1())
                    .foregroundColor(textColor)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .cornerRadius(8)
        }
    }
    
    private var iconName: String {
        if isOffline {
            return "wifi.slash"
        } else if isCached {
            return "clock.arrow.circlepath"
        }
        return "checkmark.circle"
    }
    
    private var iconColor: Color {
        if isOffline {
            return AppColors.warning
        } else if isCached {
            return AppColors.brandTextSecondary
        }
        return AppColors.success
    }
    
    private var textColor: Color {
        if isOffline {
            return AppColors.warning
        } else if isCached {
            return AppColors.brandTextSecondary
        }
        return AppColors.success
    }
    
    private var backgroundColor: Color {
        if isOffline {
            return AppColors.warning.opacity(0.1)
        } else if isCached {
            return AppColors.brandTextSecondary.opacity(0.1)
        }
        return AppColors.success.opacity(0.1)
    }
    
    private var message: String {
        if isOffline {
            return "Offline"
        } else if isCached {
            if let lastUpdated = lastUpdated {
                let formatter = RelativeDateTimeFormatter()
                formatter.unitsStyle = .short
                return "Cached \(formatter.localizedString(for: lastUpdated, relativeTo: Date()))"
            }
            return "Cached data"
        }
        return "Up to date"
    }
}

/// Banner-style indicator for showing at the top of lists
struct OfflineBannerView: View {
    @ObservedObject var networkMonitor: NetworkMonitorService
    let isCached: Bool
    let lastUpdated: Date?
    
    private func formatRelativeTime(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
    
    var body: some View {
        if networkMonitor.isConnected == false || isCached {
            HStack(spacing: 8) {
                Image(systemName: networkMonitor.isConnected ? "clock.arrow.circlepath" : "wifi.slash")
                    .font(.system(size: 14))
                    .foregroundColor(networkMonitor.isConnected ? AppColors.brandTextSecondary : AppColors.warning)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(networkMonitor.isConnected ? "Showing cached data" : "You're offline")
                        .font(AppTypography.caption1(.semibold))
                        .foregroundColor(networkMonitor.isConnected ? AppColors.brandTextPrimary : AppColors.warning)
                    
                    if let lastUpdated = lastUpdated, networkMonitor.isConnected {
                        Text("Last updated \(formatRelativeTime(lastUpdated))")
                            .font(AppTypography.caption2())
                            .foregroundColor(AppColors.brandTextSecondary)
                    }
                }
                
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(networkMonitor.isConnected ? AppColors.brandTextSecondary.opacity(0.1) : AppColors.warning.opacity(0.1))
            .cornerRadius(8)
            .padding(.horizontal, 16)
            .padding(.top, 8)
        }
    }
}

