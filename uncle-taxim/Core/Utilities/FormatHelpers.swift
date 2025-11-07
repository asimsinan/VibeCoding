import Foundation

/// Formats duration in minutes to a human-readable string with hours and minutes
/// - Parameter minutes: Duration in minutes
/// - Returns: Formatted string (e.g., "2h 30min", "45min", "1h")
func formatDuration(_ minutes: Int) -> String {
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

/// Formats distance in kilometers to a human-readable string
/// - Parameter distance: Distance in kilometers
/// - Returns: Formatted string (e.g., "500 m", "1.5 km")
func formatDistance(_ distance: Double) -> String {
    if distance < 1.0 {
        return String(format: "%.0f m", distance * 1000)
    } else {
        return String(format: "%.1f km", distance)
    }
}

/// Formats price in Turkish Lira
/// - Parameter price: Price in Turkish Lira
/// - Returns: Formatted string (e.g., "150,50 ₺")
func formatPrice(_ price: Double) -> String {
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

