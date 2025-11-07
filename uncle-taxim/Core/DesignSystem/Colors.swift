import SwiftUI

/// Modern, vibrant color scheme for ride-hailing app
struct AppColors {
    // MARK: - Primary Brand Colors (Uber/Lyft inspired)
    static let primary = Color(red: 0.0, green: 0.0, blue: 0.0) // Black
    static let primaryAccent = Color(red: 0.95, green: 0.95, blue: 0.95) // Light gray
    static let primaryGradientStart = Color(red: 0.15, green: 0.15, blue: 0.15)
    static let primaryGradientEnd = Color(red: 0.0, green: 0.0, blue: 0.0)
    
    // MARK: - Accent Colors
    static let accentBlue = Color(red: 0.0, green: 0.48, blue: 0.98) // iOS Blue
    static let accentGreen = Color(red: 0.2, green: 0.78, blue: 0.35) // Success Green
    static let accentOrange = Color(red: 1.0, green: 0.58, blue: 0.0) // Warning Orange
    static let accentPurple = Color(red: 0.69, green: 0.32, blue: 0.87) // Purple
    
    // MARK: - Background Colors
    static let background = Color(red: 0.97, green: 0.97, blue: 0.98) // System Gray 6
    static let backgroundSecondary = Color(red: 0.95, green: 0.95, blue: 0.97) // System Gray 5
    static let backgroundSecondaryDark = Color(red: 0.17, green: 0.17, blue: 0.18) // Dark mode secondary background
    static let backgroundDark = Color(red: 0.11, green: 0.11, blue: 0.12)
    
    // MARK: - Surface Colors
    static let surface = Color.white
    static let surfaceElevated = Color(red: 0.99, green: 0.99, blue: 1.0)
    static let surfaceDark = Color(red: 0.17, green: 0.17, blue: 0.18)
    
    // MARK: - Text Colors
    static let textPrimary = Color(red: 0.0, green: 0.0, blue: 0.0)
    static let textPrimaryDark = Color.white
    static let textSecondary = Color(red: 0.56, green: 0.56, blue: 0.58) // System Gray
    static let textSecondaryDark = Color(red: 0.56, green: 0.56, blue: 0.58)
    static let textTertiary = Color(red: 0.78, green: 0.78, blue: 0.80)
    
    // MARK: - Semantic Colors
    static let success = Color(red: 0.2, green: 0.78, blue: 0.35)
    static let error = Color(red: 1.0, green: 0.23, blue: 0.19)
    static let warning = Color(red: 1.0, green: 0.58, blue: 0.0)
    static let info = accentBlue
    
    // MARK: - Gradient Colors
    static let gradientPrimary = LinearGradient(
        colors: [primaryGradientStart, primaryGradientEnd],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let gradientAccent = LinearGradient(
        colors: [accentBlue.opacity(0.8), accentBlue],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let gradientSuccess = LinearGradient(
        colors: [accentGreen.opacity(0.8), accentGreen],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // MARK: - Shadow Colors
    static let shadowLight = Color.black.opacity(0.1)
    static let shadowMedium = Color.black.opacity(0.15)
    static let shadowHeavy = Color.black.opacity(0.25)
    
    // MARK: - Adaptive Colors (Dark Mode Support)
    static func adaptive(_ light: Color, _ dark: Color) -> Color {
        return Color(UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }
    
    // MARK: - Brand Colors (Adaptive)
    static let brandPrimary = primary
    static let brandAccent = accentBlue
    static let brandBackground = adaptive(background, backgroundDark)
    static let brandBackgroundSecondary = adaptive(backgroundSecondary, backgroundSecondaryDark)
    static let brandSurface = adaptive(surface, surfaceDark)
    static let brandTextPrimary = adaptive(textPrimary, textPrimaryDark)
    static let brandTextSecondary = adaptive(textSecondary, textSecondaryDark)
}

