import SwiftUI

/// Elevated card component with shadows
struct CardView<Content: View>: View {
    let content: Content
    var cornerRadius: CGFloat = 12
    var shadowRadius: CGFloat = 8
    var shadowOpacity: Double = 0.1
    var padding: CGFloat = AppSpacing.cardPadding
    
    init(
        cornerRadius: CGFloat = 12,
        shadowRadius: CGFloat = 8,
        shadowOpacity: Double = 0.1,
        padding: CGFloat = AppSpacing.cardPadding,
        @ViewBuilder content: () -> Content
    ) {
        self.cornerRadius = cornerRadius
        self.shadowRadius = shadowRadius
        self.shadowOpacity = shadowOpacity
        self.padding = padding
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(padding)
            .background(AppColors.brandSurface)
            .cornerRadius(cornerRadius)
            .shadow(
                color: AppColors.shadowMedium,
                radius: shadowRadius,
                x: 0,
                y: shadowRadius / 2
            )
    }
}

// MARK: - Card Variants
extension CardView {
    static func elevated(content: @escaping () -> Content) -> CardView {
        CardView(
            cornerRadius: 12,
            shadowRadius: 12,
            shadowOpacity: 0.15,
            content: content
        )
    }
    
    static func flat(content: @escaping () -> Content) -> CardView {
        CardView(
            cornerRadius: 12,
            shadowRadius: 4,
            shadowOpacity: 0.05,
            content: content
        )
    }
    
    static func outlined<C: View>(content: @escaping () -> C) -> some View {
        CardView<AnyView>(
            cornerRadius: 12,
            shadowRadius: 0,
            shadowOpacity: 0,
            content: {
                AnyView(
                    content()
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(AppColors.brandTextSecondary.opacity(0.2), lineWidth: 1)
                        )
                )
            }
        )
    }
}

