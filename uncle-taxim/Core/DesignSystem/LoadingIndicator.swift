import SwiftUI

/// Loading indicator with animations
struct LoadingIndicator: View {
    var size: CGFloat = 40
    var color: Color = AppColors.primary
    @State private var isAnimating = false
    
    var body: some View {
        ZStack {
            Circle()
                .trim(from: 0, to: 0.7)
                .stroke(
                    color,
                    style: StrokeStyle(lineWidth: 3, lineCap: .round)
                )
                .frame(width: size, height: size)
                .rotationEffect(.degrees(isAnimating ? 360 : 0))
                .animation(
                    Animation.linear(duration: 1.0).repeatForever(autoreverses: false),
                    value: isAnimating
                )
        }
        .onAppear {
            isAnimating = true
        }
    }
}

// MARK: - Loading Indicator Variants
struct FullScreenLoadingIndicator: View {
    var message: String? = nil
    
    var body: some View {
        ZStack {
            AppColors.brandBackground.opacity(0.8)
                .ignoresSafeArea()
            
            VStack(spacing: AppSpacing.md) {
                LoadingIndicator(size: 50, color: AppColors.primary)
                
                if let message = message {
                    Text(message)
                        .font(AppTypography.body(.regular))
                        .foregroundColor(AppColors.brandTextSecondary)
                }
            }
            .padding(AppSpacing.paddingLarge)
            .background(AppColors.brandSurface)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
        }
    }
}

struct InlineLoadingIndicator: View {
    var size: CGFloat = 20
    var color: Color = AppColors.brandTextSecondary
    
    var body: some View {
        LoadingIndicator(size: size, color: color)
    }
}

// MARK: - Loading State Modifier
struct LoadingModifier: ViewModifier {
    var isLoading: Bool
    var message: String? = nil
    
    func body(content: Content) -> some View {
        ZStack {
            content
                .opacity(isLoading ? 0.3 : 1.0)
                .disabled(isLoading)
            
            if isLoading {
                FullScreenLoadingIndicator(message: message)
            }
        }
    }
}

extension View {
    func loading(_ isLoading: Bool, message: String? = nil) -> some View {
        modifier(LoadingModifier(isLoading: isLoading, message: message))
    }
}

