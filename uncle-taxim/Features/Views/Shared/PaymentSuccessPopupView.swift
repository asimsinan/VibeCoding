import SwiftUI

/// Custom payment success popup with professional design and animations
struct PaymentSuccessPopupView: View {
    let paymentAmount: String?
    let onDismiss: () -> Void
    
    @State private var scale: CGFloat = 0.8
    @State private var opacity: Double = 0
    @State private var checkmarkScale: CGFloat = 0
    @State private var checkmarkOpacity: Double = 0
    @State private var circleProgress: CGFloat = 0
    @State private var contentOffset: CGFloat = 20
    
    var body: some View {
        ZStack {
            // Background overlay
            Color.black.opacity(0.5)
                .ignoresSafeArea()
                .opacity(opacity)
                .onTapGesture {
                    dismiss()
                }
            
            // Main popup card
            VStack(spacing: 0) {
                // Top section with animated checkmark
                VStack(spacing: AppSpacing.lg) {
                    // Animated checkmark circle
                    ZStack {
                        // Outer circle with progress animation
                        Circle()
                            .trim(from: 0, to: circleProgress)
                            .stroke(
                                AppColors.success,
                                style: StrokeStyle(lineWidth: 4, lineCap: .round)
                            )
                            .frame(width: 100, height: 100)
                            .rotationEffect(.degrees(-90))
                        
                        // Inner filled circle
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [
                                        AppColors.success.opacity(0.15),
                                        AppColors.success.opacity(0.05)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 100, height: 100)
                        
                        // Checkmark icon
                        Image(systemName: "checkmark")
                            .font(.system(size: 50, weight: .bold))
                            .foregroundColor(AppColors.success)
                            .scaleEffect(checkmarkScale)
                            .opacity(checkmarkOpacity)
                    }
                    .scaleEffect(scale)
                    
                    // Title
                    VStack(spacing: AppSpacing.xs) {
                        Text("Payment Successful")
                            .font(AppTypography.title1(.bold))
                            .foregroundColor(AppColors.brandTextPrimary)
                        
                        if let amount = paymentAmount {
                            Text(amount)
                                .font(.system(size: 32, weight: .semibold, design: .rounded))
                                .foregroundColor(AppColors.success)
                                .padding(.top, AppSpacing.xs)
                        }
                    }
                    .offset(y: contentOffset)
                    .opacity(opacity)
                }
                .padding(.top, AppSpacing.xl + AppSpacing.lg)
                .padding(.horizontal, AppSpacing.xl)
                .padding(.bottom, AppSpacing.lg)
                
                // Divider
                Divider()
                    .background(AppColors.brandBackgroundSecondary)
                
                // Bottom section with details
                VStack(spacing: AppSpacing.md) {
                    // Payment details row
                    HStack {
                        VStack(alignment: .leading, spacing: AppSpacing.xs) {
                            Text("Ride Completed")
                                .font(AppTypography.body(.medium))
                                .foregroundColor(AppColors.brandTextPrimary)
                            
                            Text("Payment has been processed")
                                .font(AppTypography.caption1())
                                .foregroundColor(AppColors.brandTextSecondary)
                        }
                        
                        Spacer()
                        
                        // Status indicator
                        ZStack {
                            Circle()
                                .fill(AppColors.success.opacity(0.15))
                                .frame(width: 40, height: 40)
                            
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(AppColors.success)
                        }
                    }
                    .padding(.horizontal, AppSpacing.xl)
                    .padding(.top, AppSpacing.lg)
                    .offset(y: contentOffset)
                    .opacity(opacity)
                    
                    // Action button
                    Button(action: {
                        dismiss()
                    }) {
                        HStack {
                            Spacer()
                            Text("Done")
                                .font(AppTypography.headline(.semibold))
                                .foregroundColor(.white)
                            Spacer()
                        }
                        .frame(height: 56)
                        .background(
                            LinearGradient(
                                colors: [AppColors.success, AppColors.success.opacity(0.8)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(16)
                        .padding(.horizontal, AppSpacing.xl)
                        .padding(.bottom, AppSpacing.lg)
                    }
                    .offset(y: contentOffset)
                    .opacity(opacity)
                }
            }
            .background(AppColors.brandSurface)
            .cornerRadius(28)
            .shadow(color: Color.black.opacity(0.2), radius: 30, x: 0, y: 15)
            .padding(.horizontal, AppSpacing.xl)
            .scaleEffect(scale)
            .opacity(opacity)
        }
        .onAppear {
            animateIn()
        }
    }
    
    private func animateIn() {
        // Initial popup animation
        withAnimation(.spring(response: 0.5, dampingFraction: 0.75)) {
            scale = 1.0
            opacity = 1.0
        }
        
        // Circle progress animation
        withAnimation(.easeOut(duration: 0.6).delay(0.1)) {
            circleProgress = 1.0
        }
        
        // Checkmark animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                checkmarkScale = 1.0
                checkmarkOpacity = 1.0
            }
        }
        
        // Content slide-up animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            withAnimation(.easeOut(duration: 0.4)) {
                contentOffset = 0
            }
        }
    }
    
    private func dismiss() {
        withAnimation(.easeOut(duration: 0.25)) {
            scale = 0.9
            opacity = 0
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            onDismiss()
        }
    }
}

/// View modifier for payment success popup
struct PaymentSuccessPopupModifier: ViewModifier {
    @Binding var isPresented: Bool
    let paymentAmount: String?
    let onDismiss: (() -> Void)?
    
    func body(content: Content) -> some View {
        ZStack {
            content
            
            if isPresented {
                PaymentSuccessPopupView(
                    paymentAmount: paymentAmount,
                    onDismiss: {
                        isPresented = false
                        onDismiss?()
                    }
                )
                .transition(.opacity.combined(with: .scale))
                .zIndex(1000)
            }
        }
    }
}

extension View {
    /// Show a payment success popup
    func paymentSuccessPopup(
        isPresented: Binding<Bool>,
        paymentAmount: String? = nil,
        onDismiss: (() -> Void)? = nil
    ) -> some View {
        self.modifier(PaymentSuccessPopupModifier(
            isPresented: isPresented,
            paymentAmount: paymentAmount,
            onDismiss: onDismiss
        ))
    }
}

