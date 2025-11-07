import SwiftUI
import FirebaseAuth

struct ProfileView: View {
    @StateObject private var viewModel = ProfileViewModel()
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    
    var body: some View {
        ZStack {
            AppColors.brandBackground
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: AppSpacing.lg) {
                    // Profile Header Card
                    CardView(cornerRadius: 24, shadowRadius: 16, shadowOpacity: 0.15) {
                        VStack(spacing: AppSpacing.lg) {
                            // Avatar
                            ZStack {
                                Circle()
                                    .fill(AppColors.gradientAccent)
                                    .frame(width: 100, height: 100)
                                
                                if let user = viewModel.user {
                                    Text(user.fullName.prefix(1).uppercased())
                                        .font(.system(size: 40, weight: .bold))
                                        .foregroundColor(.white)
                                } else if let authUser = authViewModel.currentUser {
                                    // Use auth user as fallback
                                    Text(authUser.fullName.prefix(1).uppercased())
                                        .font(.system(size: 40, weight: .bold))
                                        .foregroundColor(.white)
                                } else {
                                    Image(systemName: "person.fill")
                                        .font(.system(size: 40, weight: .medium))
                                        .foregroundColor(.white)
                                }
                            }
                            
                            // User Info
                            if let user = viewModel.user {
                                VStack(spacing: AppSpacing.xs) {
                                    Text(user.fullName)
                                        .font(AppTypography.title2(.bold))
                                        .foregroundColor(AppColors.brandTextPrimary)
                                    
                                    Text(user.email)
                                        .font(AppTypography.body())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                }
                            } else if let authUser = authViewModel.currentUser {
                                // Use auth user as fallback while loading
                                VStack(spacing: AppSpacing.xs) {
                                    Text(authUser.fullName)
                                        .font(AppTypography.title2(.bold))
                                        .foregroundColor(AppColors.brandTextPrimary)
                                    
                                    Text(authUser.email)
                                        .font(AppTypography.body())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                    
                                    if viewModel.isLoading {
                                        ProgressView()
                                            .scaleEffect(0.8)
                                            .padding(.top, AppSpacing.xs)
                                    }
                                }
                            } else {
                                VStack(spacing: AppSpacing.xs) {
                                    Text("Loading...")
                                        .font(AppTypography.title2(.bold))
                                        .foregroundColor(AppColors.brandTextPrimary)
                                    
                                    if viewModel.isLoading {
                                        ProgressView()
                                            .scaleEffect(0.8)
                                    }
                                }
                            }
                        }
                        .padding(.vertical, AppSpacing.lg)
                    }
                    .padding(.horizontal, AppSpacing.md)
                    .padding(.top, AppSpacing.md)
                    
                    // Settings Section
                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        Text("Settings")
                            .font(AppTypography.headline(.semibold))
                            .foregroundColor(AppColors.brandTextSecondary)
                            .textCase(.uppercase)
                            .padding(.horizontal, AppSpacing.md)
                        
                        VStack(spacing: AppSpacing.sm) {
                            // Payment Methods
                            NavigationLink {
                                PaymentMethodsView()
                            } label: {
                                SettingsRow(
                                    icon: "creditcard.fill",
                                    iconColor: AppColors.accentBlue,
                                    title: "Payment Methods",
                                    subtitle: "Manage your payment options"
                                )
                            }
                            
                            // Transaction History
                            NavigationLink {
                                TransactionHistoryView()
                            } label: {
                                SettingsRow(
                                    icon: "list.bullet.rectangle.fill",
                                    iconColor: AppColors.accentBlue,
                                    title: "Transaction History",
                                    subtitle: "View payment history"
                                )
                            }
                            
                            // Saved Addresses
                            NavigationLink {
                                SavedAddressesView()
                            } label: {
                                SettingsRow(
                                    icon: "mappin.circle.fill",
                                    iconColor: AppColors.accentPurple,
                                    title: "Saved Addresses",
                                    subtitle: "Manage favorite locations"
                                )
                            }
                            
                            // Ride History
                            NavigationLink {
                                RideHistoryView()
                            } label: {
                                SettingsRow(
                                    icon: "clock.fill",
                                    iconColor: AppColors.accentGreen,
                                    title: "Ride History",
                                    subtitle: "View your past trips"
                                )
                            }
                            
                            // Driver Dashboard
                            NavigationLink {
                                DriverDashboardView()
                            } label: {
                                SettingsRow(
                                    icon: "car.fill",
                                    iconColor: AppColors.accentOrange,
                                    title: "Driver Dashboard",
                                    subtitle: "View and accept ride requests"
                                )
                            }
                        }
                        .padding(.horizontal, AppSpacing.md)
                        
                        // Logout Button
                        Button {
                            HapticFeedbackManager.shared.mediumImpact()
                            Task {
                                await authViewModel.logout()
                            }
                        } label: {
                            CardView(cornerRadius: 16, shadowRadius: 8, shadowOpacity: 0.1) {
                                HStack {
                                    Image(systemName: "arrow.right.square.fill")
                                        .font(.system(size: 20, weight: .semibold))
                                        .foregroundColor(AppColors.error)
                                    
                                    Text("Sign Out")
                                        .font(AppTypography.headline(.semibold))
                                        .foregroundColor(AppColors.error)
                                    
                                    Spacer()
                                }
                                .padding(.vertical, AppSpacing.xs)
                            }
                        }
                        .padding(.horizontal, AppSpacing.md)
                        .padding(.top, AppSpacing.md)
                    }
                    
                    Spacer(minLength: AppSpacing.xxl)
                }
            }
        }
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            viewModel.loadProfile()
        }
    }
    
    // MARK: - Helper Functions
}

// MARK: - Settings Row Component
struct SettingsRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String
    
    var body: some View {
        CardView(cornerRadius: 16, shadowRadius: 8, shadowOpacity: 0.1) {
            HStack(spacing: AppSpacing.md) {
                // Icon
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(iconColor.opacity(0.1))
                        .frame(width: 48, height: 48)
                    
                    Image(systemName: icon)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(iconColor)
                }
                
                // Text Content
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Text(title)
                        .font(AppTypography.headline(.semibold))
                        .foregroundColor(AppColors.brandTextPrimary)
                    
                    Text(subtitle)
                        .font(AppTypography.caption1())
                        .foregroundColor(AppColors.brandTextSecondary)
                }
                
                Spacer()
                
                // Chevron
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(AppColors.brandTextSecondary)
            }
            .padding(.vertical, AppSpacing.xs)
        }
    }
}

