import SwiftUI

/// Form validation feedback component
struct ValidationFeedback: View {
    let message: String
    let isValid: Bool
    
    var body: some View {
        HStack(spacing: AppSpacing.xSmall) {
            Image(systemName: isValid ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                .foregroundColor(isValid ? AppColors.success : AppColors.error)
                .font(.caption)
            
            Text(message)
                .font(AppTypography.caption1())
                .foregroundColor(isValid ? AppColors.success : AppColors.error)
        }
        .transition(.opacity.combined(with: .scale))
    }
}

/// Form field with validation
struct ValidatedTextField: View {
    @Binding var text: String
    let placeholder: String
    @Binding var isValid: Bool
    let validationMessage: String
    let validationRule: (String) -> Bool
    
    @State private var showValidation: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xSmall) {
            TextField(placeholder, text: $text)
                .textFieldStyle(.roundedBorder)
                .overlay(
                    RoundedRectangle(cornerRadius: AppSpacing.cornerRadiusSmall)
                        .stroke(isValid ? AppColors.success : AppColors.error, lineWidth: showValidation ? 2 : 0)
                )
                .onChange(of: text) { newValue in
                    let valid = validationRule(newValue)
                    isValid = valid
                    
                    if !newValue.isEmpty {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            showValidation = true
                        }
                    }
                    
                    // Haptic feedback
                    if valid {
                        HapticFeedbackManager.shared.success()
                    } else {
                        HapticFeedbackManager.shared.warning()
                    }
                }
            
            if showValidation {
                ValidationFeedback(
                    message: validationMessage,
                    isValid: isValid
                )
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
    }
}

/// Success confirmation toast
struct SuccessToast: View {
    let message: String
    @Binding var isPresented: Bool
    
    var body: some View {
        VStack {
            if isPresented {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.white)
                    
                    Text(message)
                        .font(AppTypography.body(.semibold))
                        .foregroundColor(.white)
                }
                .padding(AppSpacing.medium)
                .background(Color.success)
                .cornerRadius(AppSpacing.cornerRadiusMedium)
                .shadow(color: Color.black.opacity(0.2), radius: 8, x: 0, y: 4)
                .transition(.move(edge: .top).combined(with: .opacity))
                .onAppear {
                    HapticFeedbackManager.shared.success()
                    
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        withAnimation {
                            isPresented = false
                        }
                    }
                }
            }
            
            Spacer()
        }
        .padding(.top, AppSpacing.large)
        .frame(maxWidth: .infinity)
    }
}

/// Error boundary component for SwiftUI
struct ErrorBoundary<Content: View>: View {
    @State private var error: Error?
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        Group {
            if let error = error {
                ErrorFallbackView(error: error) {
                    self.error = nil
                }
            } else {
                content
                    .onAppear {
                        // Catch errors in async operations
                    }
            }
        }
    }
}

/// Fallback UI state for errors
struct ErrorFallbackView: View {
    let error: Error
    let onRetry: () -> Void
    
    var body: some View {
        VStack(spacing: AppSpacing.large) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 60))
                .foregroundColor(AppColors.error)
            
            Text("Something went wrong")
                .font(AppTypography.title2())
                .foregroundColor(AppColors.brandTextPrimary)
            
            Text(error.localizedDescription)
                .font(AppTypography.body())
                .foregroundColor(AppColors.brandTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, AppSpacing.large)
            
            GradientButton(title: "Try Again", style: .primary) {
                onRetry()
            }
            .padding(.horizontal, AppSpacing.large)
        }
        .padding(AppSpacing.xLarge)
    }
}

