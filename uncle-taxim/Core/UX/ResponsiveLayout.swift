import SwiftUI

/// Responsive layout utilities for different iPhone sizes
struct ResponsiveLayout {
    /// Get responsive padding based on device size
    static func padding(for size: GeometryProxy) -> EdgeInsets {
        let isCompact = size.size.width < 375 // iPhone SE
        return EdgeInsets(
            top: isCompact ? AppSpacing.small : AppSpacing.medium,
            leading: isCompact ? AppSpacing.small : AppSpacing.medium,
            bottom: isCompact ? AppSpacing.small : AppSpacing.medium,
            trailing: isCompact ? AppSpacing.small : AppSpacing.medium
        )
    }
    
    /// Get responsive font size based on device size
    static func fontSize(for size: GeometryProxy, base: CGFloat) -> CGFloat {
        let isCompact = size.size.width < 375
        return isCompact ? base * 0.9 : base
    }
    
    /// Check if device is in landscape
    static func isLandscape(_ size: GeometryProxy) -> Bool {
        return size.size.width > size.size.height
    }
    
    /// Get safe area insets
    static func safeAreaInsets(_ geometry: GeometryProxy) -> EdgeInsets {
        return geometry.safeAreaInsets
    }
}

/// Adaptive container that adjusts based on device size
struct AdaptiveContainer<Content: View>: View {
    let content: Content
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    @Environment(\.verticalSizeClass) var verticalSizeClass
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        GeometryReader { geometry in
            content
                .padding(ResponsiveLayout.padding(for: geometry))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

/// Responsive grid that adapts to screen size
struct ResponsiveGrid<Content: View>: View {
    let columns: [GridItem]
    let content: Content
    
    init(
        columns: [GridItem]? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        
        if let columns = columns {
            self.columns = columns
        } else {
            // Default adaptive columns
            self.columns = [
                GridItem(.adaptive(minimum: 150, maximum: 200), spacing: AppSpacing.medium)
            ]
        }
    }
    
    var body: some View {
        LazyVGrid(columns: columns, spacing: AppSpacing.medium) {
            content
        }
    }
}

/// Minimum touch target size (44x44pt)
struct MinimumTouchTarget: ViewModifier {
    func body(content: Content) -> some View {
        content
            .frame(minWidth: 44, minHeight: 44)
    }
}

extension View {
    func minimumTouchTarget() -> some View {
        modifier(MinimumTouchTarget())
    }
}

/// Safe area modifier for all device types
struct SafeAreaModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .safeAreaInset(edge: .top) {
                Color.clear.frame(height: 0)
            }
            .safeAreaInset(edge: .bottom) {
                Color.clear.frame(height: 0)
            }
    }
}

extension View {
    func safeAreaInsets() -> some View {
        modifier(SafeAreaModifier())
    }
}

