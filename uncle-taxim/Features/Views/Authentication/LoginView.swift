import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var email = "asyksl@gmail.com"
    @State private var password = "123456"
    @State private var showError = false
    
    var body: some View {
        ZStack {
            AppColors.brandBackground
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: AppSpacing.xl) {
                    // Header
                    VStack(spacing: AppSpacing.sm) {
                        Text("Welcome Back")
                            .font(AppTypography.largeTitle(.bold))
                            .foregroundColor(AppColors.brandTextPrimary)
                        
                        Text("Sign in to continue")
                            .font(AppTypography.body())
                            .foregroundColor(AppColors.brandTextSecondary)
                    }
                    .padding(.top, AppSpacing.xxxl)
                    
                    // Form Card
                    CardView(cornerRadius: 24, shadowRadius: 16, shadowOpacity: 0.15) {
                        VStack(spacing: AppSpacing.lg) {
                            // Email Field
                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                Text("Email")
                                    .font(AppTypography.caption1(.semibold))
                                    .foregroundColor(AppColors.brandTextSecondary)
                                    .textCase(.uppercase)
                                
                                TextField("Enter your email", text: $email)
                                    .font(AppTypography.body())
                                    .foregroundColor(AppColors.brandTextPrimary)
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .textContentType(.emailAddress)
                                    .padding(AppSpacing.md)
                                    .background(AppColors.brandBackgroundSecondary)
                                    .cornerRadius(12)
                            }
                            
                            // Password Field
                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                Text("Password")
                                    .font(AppTypography.caption1(.semibold))
                                    .foregroundColor(AppColors.brandTextSecondary)
                                    .textCase(.uppercase)
                                
                                SecureField("Enter your password", text: $password)
                                    .font(AppTypography.body())
                                    .foregroundColor(AppColors.brandTextPrimary)
                                    .textContentType(.password)
                                    .padding(AppSpacing.md)
                                    .background(AppColors.brandBackgroundSecondary)
                                    .cornerRadius(12)
                            }
                            
                            // Login Button
                            Button {
                                HapticFeedbackManager.shared.mediumImpact()
                                Task {
                                    await authViewModel.login(email: email, password: password)
                                }
                            } label: {
                                if authViewModel.isLoading {
                                    LoadingIndicator(size: 20)
                                        .frame(height: 56)
                                } else {
                                    Text("Sign In")
                                        .font(AppTypography.headline(.semibold))
                                        .foregroundColor(.white)
                                        .frame(maxWidth: .infinity)
                                        .frame(height: 56)
                                }
                            }
                            .primaryButton(isEnabled: !email.isEmpty && !password.isEmpty && !authViewModel.isLoading)
                            .disabled(authViewModel.isLoading)
                            
                            // Error Message
                            if let errorMessage = authViewModel.errorMessage {
                                HStack(spacing: AppSpacing.sm) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .font(.system(size: 16))
                                    
                                    Text(errorMessage)
                                        .font(AppTypography.body(.medium))
                                }
                                .foregroundColor(AppColors.error)
                                .frame(maxWidth: .infinity)
                                .padding(AppSpacing.md)
                                .background(AppColors.error.opacity(0.1))
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(AppColors.error.opacity(0.3), lineWidth: 1)
                                )
                                .padding(.top, AppSpacing.sm)
                            }
                        }
                        .padding(AppSpacing.lg)
                    }
                    .padding(.horizontal, AppSpacing.md)
                    
                    // Sign Up Link
                    HStack {
                        Text("Don't have an account?")
                            .font(AppTypography.body())
                            .foregroundColor(AppColors.brandTextSecondary)
                        
                        NavigationLink {
                            RegistrationView()
                                .environmentObject(authViewModel)
                        } label: {
                            Text("Sign Up")
                                .font(AppTypography.body(.semibold))
                                .foregroundColor(AppColors.accentBlue)
                        }
                    }
                    .padding(.top, AppSpacing.md)
                }
            }
        }
        .navigationTitle("Login")
        .navigationBarTitleDisplayMode(.inline)
    }
}

