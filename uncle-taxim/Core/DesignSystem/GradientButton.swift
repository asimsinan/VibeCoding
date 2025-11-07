import SwiftUI

/// Gradient button with animations
struct GradientButton: View {
    let title: String
    let action: () -> Void
    var gradient: LinearGradient
    var cornerRadius: CGFloat = 12
    var padding: CGFloat = AppSpacing.paddingMedium
    
    @State private var isPressed = false
    
    init(
        _ title: String,
        gradient: LinearGradient? = nil,
        cornerRadius: CGFloat = 12,
        padding: CGFloat = AppSpacing.paddingMedium,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.action = action
        self.gradient = gradient ?? LinearGradient(
            colors: [AppColors.primary, AppColors.primaryDark],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        self.cornerRadius = cornerRadius
        self.padding = padding
    }
    
    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                isPressed = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                    isPressed = false
                }
                action()
            }
        }) {
            Text(title)
                .font(AppTypography.headline(.semibold))
                .dynamicType(.headline)
                .foregroundColor(.white)
                .padding(.horizontal, padding)
                .padding(.vertical, padding * 0.75)
                .frame(maxWidth: .infinity)
                .frame(minHeight: AccessibilityHelpers.minimumTouchTarget)
                .background(gradient)
                .cornerRadius(cornerRadius)
                .scaleEffect(isPressed && !AccessibilityHelpers.isReduceMotionEnabled ? 0.95 : 1.0)
                .shadow(
                    color: AppColors.primary.opacity(0.3),
                    radius: isPressed ? 4 : 8,
                    x: 0,
                    y: isPressed ? 2 : 4
                )
        }
        .buttonStyle(PlainButtonStyle())
        .accessibility(label: title, hint: "Button")
        .minimumTouchTarget()
    }
}

// MARK: - Button Variants
extension GradientButton {
    static func primary(_ title: String, action: @escaping () -> Void) -> GradientButton {
        GradientButton(
            title,
            gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            action: action
        )
    }
    
    static func secondary(_ title: String, action: @escaping () -> Void) -> GradientButton {
        GradientButton(
            title,
            gradient: LinearGradient(
                colors: [AppColors.secondary, AppColors.secondaryDark],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            action: action
        )
    }
    
    static func success(_ title: String, action: @escaping () -> Void) -> GradientButton {
        GradientButton(
            title,
            gradient: LinearGradient(
                colors: [AppColors.success, AppColors.success.opacity(0.8)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            action: action
        )
    }
}

