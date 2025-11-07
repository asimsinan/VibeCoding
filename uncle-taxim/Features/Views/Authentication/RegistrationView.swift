import SwiftUI

struct RegistrationView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var fullName = ""
    @State private var phoneNumber = ""
    @State private var confirmPassword = ""
    
    private var passwordsMatch: Bool {
        !password.isEmpty && password == confirmPassword
    }
    
    private var isFormValid: Bool {
        !email.isEmpty &&
        !fullName.isEmpty &&
        !phoneNumber.isEmpty &&
        password.count >= 6 &&
        passwordsMatch &&
        !authViewModel.isLoading
    }
    
    var body: some View {
        ZStack {
            AppColors.brandBackground
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: AppSpacing.xl) {
                    // Header
                    VStack(spacing: AppSpacing.sm) {
                        Text("Create Account")
                            .font(AppTypography.largeTitle(.bold))
                            .foregroundColor(AppColors.brandTextPrimary)
                        
                        Text("Join UncleTaxim today")
                            .font(AppTypography.body())
                            .foregroundColor(AppColors.brandTextSecondary)
                    }
                    .padding(.top, AppSpacing.xxxl)
                    
                    // Form Card
                    CardView(cornerRadius: 24, shadowRadius: 16, shadowOpacity: 0.15) {
                        VStack(spacing: AppSpacing.lg) {
                            // Full Name Field
                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                Text("Full Name")
                                    .font(AppTypography.caption1(.semibold))
                                    .foregroundColor(AppColors.brandTextSecondary)
                                    .textCase(.uppercase)
                                
                                TextField("Enter your full name", text: $fullName)
                                    .font(AppTypography.body())
                                    .foregroundColor(AppColors.brandTextPrimary)
                                    .textContentType(.name)
                                    .padding(AppSpacing.md)
                                    .background(AppColors.brandBackgroundSecondary)
                                    .cornerRadius(12)
                            }
                            
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
                            
                            // Phone Number Field
                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                Text("Phone Number")
                                    .font(AppTypography.caption1(.semibold))
                                    .foregroundColor(AppColors.brandTextSecondary)
                                    .textCase(.uppercase)
                                
                                TextField("Enter your phone number", text: $phoneNumber)
                                    .font(AppTypography.body())
                                    .foregroundColor(AppColors.brandTextPrimary)
                                    .keyboardType(.phonePad)
                                    .textContentType(.telephoneNumber)
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
                                
                                SecureField("At least 6 characters", text: $password)
                                    .font(AppTypography.body())
                                    .foregroundColor(AppColors.brandTextPrimary)
                                    .textContentType(.newPassword)
                                    .padding(AppSpacing.md)
                                    .background(AppColors.brandBackgroundSecondary)
                                    .cornerRadius(12)
                                
                                if !password.isEmpty && password.count < 6 {
                                    Text("Password must be at least 6 characters")
                                        .font(AppTypography.caption2())
                                        .foregroundColor(AppColors.error)
                                }
                            }
                            
                            // Confirm Password Field
                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                Text("Confirm Password")
                                    .font(AppTypography.caption1(.semibold))
                                    .foregroundColor(AppColors.brandTextSecondary)
                                    .textCase(.uppercase)
                                
                                SecureField("Confirm your password", text: $confirmPassword)
                                    .font(AppTypography.body())
                                    .foregroundColor(AppColors.brandTextPrimary)
                                    .textContentType(.newPassword)
                                    .padding(AppSpacing.md)
                                    .background(AppColors.brandBackgroundSecondary)
                                    .cornerRadius(12)
                                
                                if !confirmPassword.isEmpty && !passwordsMatch {
                                    Text("Passwords do not match")
                                        .font(AppTypography.caption2())
                                        .foregroundColor(AppColors.error)
                                }
                            }
                            
                            // Register Button
                            Button {
                                HapticFeedbackManager.shared.mediumImpact()
                                Task {
                                    await authViewModel.register(email: email, password: password, fullName: fullName, phoneNumber: phoneNumber)
                                }
                            } label: {
                                if authViewModel.isLoading {
                                    LoadingIndicator(size: 20)
                                        .frame(height: 56)
                                } else {
                                    Text("Create Account")
                                        .font(AppTypography.headline(.semibold))
                                        .foregroundColor(.white)
                                        .frame(maxWidth: .infinity)
                                        .frame(height: 56)
                                }
                            }
                            .primaryButton(isEnabled: isFormValid)
                            .disabled(!isFormValid)
                            
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
                    
                    // Sign In Link
                    HStack {
                        Text("Already have an account?")
                            .font(AppTypography.body())
                            .foregroundColor(AppColors.brandTextSecondary)
                        
                        NavigationLink {
                            LoginView()
                                .environmentObject(authViewModel)
                        } label: {
                            Text("Sign In")
                                .font(AppTypography.body(.semibold))
                                .foregroundColor(AppColors.accentBlue)
                        }
                    }
                    .padding(.top, AppSpacing.md)
                }
            }
        }
        .navigationTitle("Sign Up")
        .navigationBarTitleDisplayMode(.inline)
    }
}

