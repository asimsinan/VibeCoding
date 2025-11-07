import SwiftUI

/// 8pt grid system for consistent spacing
struct AppSpacing {
    // MARK: - Base Unit
    static let baseUnit: CGFloat = 8
    
    // MARK: - Spacing Scale (8pt grid)
    static let xs: CGFloat = baseUnit * 0.5  // 4pt
    static let sm: CGFloat = baseUnit * 1    // 8pt
    static let md: CGFloat = baseUnit * 2     // 16pt
    static let lg: CGFloat = baseUnit * 3     // 24pt
    static let xl: CGFloat = baseUnit * 4     // 32pt
    static let xxl: CGFloat = baseUnit * 6   // 48pt
    static let xxxl: CGFloat = baseUnit * 8   // 64pt
    
    // MARK: - Semantic Spacing
    static let paddingSmall = sm      // 8pt
    static let paddingMedium = md      // 16pt
    static let paddingLarge = lg       // 24pt
    static let paddingXLarge = xl     // 32pt
    
    static let marginSmall = sm        // 8pt
    static let marginMedium = md       // 16pt
    static let marginLarge = lg        // 24pt
    static let marginXLarge = xl       // 32pt
    
    static let gapSmall = xs           // 4pt
    static let gapMedium = sm          // 8pt
    static let gapLarge = md           // 16pt
    
    // MARK: - Component Spacing
    static let cardPadding = md        // 16pt
    static let buttonPadding = sm      // 8pt
    static let sectionSpacing = lg     // 24pt
    static let listItemSpacing = sm    // 8pt
}

