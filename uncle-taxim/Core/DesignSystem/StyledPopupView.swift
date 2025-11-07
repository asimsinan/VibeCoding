import SwiftUI

/// Styled popup types
enum PopupType {
    case success
    case error
    case warning
    case info
    
    var icon: String {
        switch self {
        case .success:
            return "checkmark.circle.fill"
        case .error:
            return "xmark.circle.fill"
        case .warning:
            return "exclamationmark.triangle.fill"
        case .info:
            return "info.circle.fill"
        }
    }
    
    var color: Color {
        switch self {
        case .success:
            return AppColors.success
        case .error:
            return AppColors.error
        case .warning:
            return AppColors.accentOrange
        case .info:
            return AppColors.accentBlue
        }
    }
    
    var backgroundColor: Color {
        switch self {
        case .success:
            return AppColors.success.opacity(0.1)
        case .error:
            return AppColors.error.opacity(0.1)
        case .warning:
            return AppColors.accentOrange.opacity(0.1)
        case .info:
            return AppColors.accentBlue.opacity(0.1)
        }
    }
}

/// Styled popup view with animations and modern design
struct StyledPopupView: View {
    let type: PopupType
    let title: String
    let message: String
    let primaryButtonTitle: String
    let secondaryButtonTitle: String?
    let onPrimaryAction: () -> Void
    let onSecondaryAction: (() -> Void)?
    
    @State private var scale: CGFloat = 0.8
    @State private var opacity: Double = 0
    @State private var iconScale: CGFloat = 0
    
    init(
        type: PopupType,
        title: String,
        message: String,
        primaryButtonTitle: String = "OK",
        secondaryButtonTitle: String? = nil,
        onPrimaryAction: @escaping () -> Void = {},
        onSecondaryAction: (() -> Void)? = nil
    ) {
        self.type = type
        self.title = title
        self.message = message
        self.primaryButtonTitle = primaryButtonTitle
        self.secondaryButtonTitle = secondaryButtonTitle
        self.onPrimaryAction = onPrimaryAction
        self.onSecondaryAction = onSecondaryAction
    }
    
    var body: some View {
        ZStack {
            // Background overlay
            Color.black.opacity(0.4)
                .ignoresSafeArea()
                .opacity(opacity)
                .onTapGesture {
                    dismiss()
                }
            
            // Popup card
            VStack(spacing: 0) {
                // Icon and title section
                VStack(spacing: AppSpacing.md) {
                    // Animated icon
                    ZStack {
                        Circle()
                            .fill(type.backgroundColor)
                            .frame(width: 80, height: 80)
                        
                        Image(systemName: type.icon)
                            .font(.system(size: 40, weight: .semibold))
                            .foregroundColor(type.color)
                            .scaleEffect(iconScale)
                    }
                    .scaleEffect(scale)
                    
                    VStack(spacing: AppSpacing.xs) {
                        Text(title)
                            .font(AppTypography.title2(.bold))
                            .foregroundColor(AppColors.brandTextPrimary)
                        
                        Text(message)
                            .font(AppTypography.body())
                            .foregroundColor(AppColors.brandTextSecondary)
                            .multilineTextAlignment(.center)
                            .lineLimit(nil)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(.top, AppSpacing.xl)
                .padding(.horizontal, AppSpacing.lg)
                .padding(.bottom, AppSpacing.lg)
                
                Divider()
                
                // Buttons section
                HStack(spacing: 0) {
                    if let secondaryTitle = secondaryButtonTitle, let secondaryAction = onSecondaryAction {
                        Button(action: {
                            secondaryAction()
                            dismiss()
                        }) {
                            Text(secondaryTitle)
                                .font(AppTypography.headline(.semibold))
                                .foregroundColor(AppColors.brandTextSecondary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 56)
                        }
                        
                        Divider()
                            .frame(height: 56)
                    }
                    
                    Button(action: {
                        onPrimaryAction()
                        dismiss()
                    }) {
                        Text(primaryButtonTitle)
                            .font(AppTypography.headline(.semibold))
                            .foregroundColor(type.color)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                    }
                }
            }
            .background(Color.white)
            .cornerRadius(24)
            .shadow(color: Color.black.opacity(0.2), radius: 20, x: 0, y: 10)
            .padding(.horizontal, AppSpacing.xl)
            .scaleEffect(scale)
            .opacity(opacity)
        }
        .onAppear {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                scale = 1.0
                opacity = 1.0
            }
            
            // Icon bounce animation
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                    iconScale = 1.0
                }
            }
        }
    }
    
    private func dismiss() {
        withAnimation(.easeOut(duration: 0.2)) {
            scale = 0.8
            opacity = 0
        }
    }
}

/// View modifier to show styled popups
struct StyledPopupModifier: ViewModifier {
    @Binding var isPresented: Bool
    let type: PopupType
    let title: String
    let message: String
    let primaryButtonTitle: String
    let secondaryButtonTitle: String?
    let onPrimaryAction: () -> Void
    let onSecondaryAction: (() -> Void)?
    
    func body(content: Content) -> some View {
        ZStack {
            content
            
            if isPresented {
                StyledPopupView(
                    type: type,
                    title: title,
                    message: message,
                    primaryButtonTitle: primaryButtonTitle,
                    secondaryButtonTitle: secondaryButtonTitle,
                    onPrimaryAction: {
                        onPrimaryAction()
                        isPresented = false
                    },
                    onSecondaryAction: onSecondaryAction != nil ? {
                        onSecondaryAction?()
                        isPresented = false
                    } : nil
                )
                .transition(.opacity.combined(with: .scale))
                .zIndex(1000)
            }
        }
    }
}

extension View {
    /// Show a styled success popup
    func styledSuccessPopup(
        isPresented: Binding<Bool>,
        title: String = "Success",
        message: String,
        buttonTitle: String = "OK",
        action: @escaping () -> Void = {}
    ) -> some View {
        self.modifier(StyledPopupModifier(
            isPresented: isPresented,
            type: .success,
            title: title,
            message: message,
            primaryButtonTitle: buttonTitle,
            secondaryButtonTitle: nil,
            onPrimaryAction: action,
            onSecondaryAction: nil
        ))
    }
    
    /// Show a styled error popup
    func styledErrorPopup(
        isPresented: Binding<Bool>,
        title: String = "Error",
        message: String,
        buttonTitle: String = "OK",
        action: @escaping () -> Void = {}
    ) -> some View {
        self.modifier(StyledPopupModifier(
            isPresented: isPresented,
            type: .error,
            title: title,
            message: message,
            primaryButtonTitle: buttonTitle,
            secondaryButtonTitle: nil,
            onPrimaryAction: action,
            onSecondaryAction: nil
        ))
    }
    
    /// Show a styled popup with two buttons
    func styledPopup(
        isPresented: Binding<Bool>,
        type: PopupType,
        title: String,
        message: String,
        primaryButtonTitle: String,
        secondaryButtonTitle: String? = nil,
        onPrimaryAction: @escaping () -> Void = {},
        onSecondaryAction: (() -> Void)? = nil
    ) -> some View {
        self.modifier(StyledPopupModifier(
            isPresented: isPresented,
            type: type,
            title: title,
            message: message,
            primaryButtonTitle: primaryButtonTitle,
            secondaryButtonTitle: secondaryButtonTitle,
            onPrimaryAction: onPrimaryAction,
            onSecondaryAction: onSecondaryAction
        ))
    }
}

