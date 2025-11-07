import SwiftUI

/// Skeleton loading view for async operations
struct SkeletonView: View {
    var body: some View {
        VStack(spacing: AppSpacing.md) {
            // Skeleton header
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.3))
                .frame(height: 40)
                .shimmer()
            
            // Skeleton content
            ForEach(0..<3) { _ in
                HStack(spacing: AppSpacing.md) {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 60, height: 60)
                        .shimmer()
                    
                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 16)
                            .shimmer()
                        
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 12)
                            .frame(maxWidth: 200)
                            .shimmer()
                    }
                    
                    Spacer()
                }
            }
        }
        .padding()
    }
}

/// Shimmer effect for skeleton loading
extension View {
    func shimmer() -> some View {
        self.modifier(ShimmerModifier())
    }
}

struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = 0
    
    func body(content: Content) -> some View {
        content
            .overlay(
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color.clear,
                        Color.white.opacity(0.3),
                        Color.clear
                    ]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .offset(x: phase)
                .onAppear {
                    withAnimation(
                        Animation.linear(duration: 1.5)
                            .repeatForever(autoreverses: false)
                    ) {
                        phase = 300
                    }
                }
            )
            .clipped()
    }
}

/// Skeleton view for list items
struct SkeletonListView: View {
    let itemCount: Int
    
    init(itemCount: Int = 5) {
        self.itemCount = itemCount
    }
    
    var body: some View {
        List {
            ForEach(0..<itemCount, id: \.self) { _ in
                HStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 50, height: 50)
                        .shimmer()
                    
                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 16)
                            .shimmer()
                        
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 12)
                            .frame(maxWidth: 150)
                            .shimmer()
                    }
                    
                    Spacer()
                }
                .padding(.vertical, AppSpacing.sm)
            }
        }
    }
}

