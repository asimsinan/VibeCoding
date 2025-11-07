import SwiftUI

/// Modern button styles for ride-hailing app
struct PrimaryButtonStyle: ButtonStyle {
    var isEnabled: Bool = true
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTypography.headline(.semibold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                Group {
                    if isEnabled {
                        AppColors.gradientAccent
                    } else {
                        LinearGradient(
                            colors: [AppColors.textTertiary, AppColors.textTertiary],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
                }
            )
            .cornerRadius(16)
            .shadow(
                color: isEnabled ? AppColors.accentBlue.opacity(0.3) : Color.clear,
                radius: configuration.isPressed ? 4 : 12,
                x: 0,
                y: configuration.isPressed ? 2 : 6
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTypography.headline(.semibold))
            .foregroundColor(AppColors.brandPrimary)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(AppColors.brandSurface)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(AppColors.brandPrimary, lineWidth: 2)
            )
            .cornerRadius(16)
            .shadow(
                color: AppColors.shadowLight,
                radius: configuration.isPressed ? 2 : 8,
                x: 0,
                y: configuration.isPressed ? 1 : 4
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct FloatingActionButtonStyle: ButtonStyle {
    var size: CGFloat = 64
    var color: Color = AppColors.accentBlue
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 24, weight: .semibold))
            .foregroundColor(.white)
            .frame(width: size, height: size)
            .background(
                Circle()
                    .fill(color)
                    .shadow(
                        color: color.opacity(0.4),
                        radius: configuration.isPressed ? 8 : 16,
                        x: 0,
                        y: configuration.isPressed ? 4 : 8
                    )
            )
            .scaleEffect(configuration.isPressed ? 0.9 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

// MARK: - View Extensions
extension View {
    func primaryButton(isEnabled: Bool = true) -> some View {
        self.buttonStyle(PrimaryButtonStyle(isEnabled: isEnabled))
    }
    
    func secondaryButton() -> some View {
        self.buttonStyle(SecondaryButtonStyle())
    }
    
    func floatingActionButton(size: CGFloat = 64, color: Color = AppColors.accentBlue) -> some View {
        self.buttonStyle(FloatingActionButtonStyle(size: size, color: color))
    }
}

