import SwiftUI

struct DriverRatingView: View {
    let summary: TripSummary
    var onDismiss: (() -> Void)?
    
    @State private var selectedRating: Int = 0
    @State private var feedback: String = ""
    @State private var isSubmitting: Bool = false
    @State private var showSuccessAlert: Bool = false
    @State private var errorMessage: String?
    
    private let dataService = FirebaseDataService()
    
    var body: some View {
        ScrollView {
            VStack(spacing: AppSpacing.xl) {
                // Header
                VStack(spacing: AppSpacing.sm) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 60))
                        .foregroundColor(AppColors.accentOrange)
                    
                    Text("Rate Your Driver")
                        .font(AppTypography.largeTitle(.bold))
                        .foregroundColor(AppColors.brandTextPrimary)
                    
                    Text("How was your ride experience?")
                        .font(AppTypography.body())
                        .foregroundColor(AppColors.brandTextSecondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, AppSpacing.xxl)
                
                // Star Rating
                VStack(spacing: AppSpacing.md) {
                    Text("Tap to rate")
                        .font(AppTypography.footnote())
                        .foregroundColor(AppColors.brandTextSecondary)
                    
                    HStack(spacing: AppSpacing.md) {
                        ForEach(1...5, id: \.self) { rating in
                            Button(action: {
                                HapticFeedbackManager.shared.lightImpact()
                                selectedRating = rating
                            }) {
                                Image(systemName: selectedRating >= rating ? "star.fill" : "star")
                                    .font(.system(size: 50))
                                    .foregroundColor(selectedRating >= rating ? AppColors.accentOrange : AppColors.brandTextSecondary)
                                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: selectedRating)
                            }
                        }
                    }
                    .padding(.vertical, AppSpacing.md)
                    
                    if selectedRating > 0 {
                        Text(ratingText)
                            .font(AppTypography.body(.semibold))
                            .foregroundColor(AppColors.brandTextPrimary)
                            .transition(.opacity)
                    }
                }
                .padding(.vertical, AppSpacing.lg)
                
                // Feedback Section
                if selectedRating > 0 {
                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                        Text("Additional Feedback (Optional)")
                            .font(AppTypography.headline())
                            .foregroundColor(AppColors.brandTextPrimary)
                        
                        TextEditor(text: $feedback)
                            .font(AppTypography.body())
                            .foregroundColor(AppColors.brandTextPrimary)
                            .frame(height: 120)
                            .padding(AppSpacing.sm)
                            .background(AppColors.brandBackgroundSecondary)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(AppColors.brandTextSecondary.opacity(0.2), lineWidth: 1)
                            )
                    }
                    .padding(.horizontal, AppSpacing.md)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
                
                // Submit Button
                if selectedRating > 0 {
                    Button(action: {
                        submitRating()
                    }) {
                        HStack {
                            if isSubmitting {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            } else {
                                Text("Submit Rating")
                                    .font(AppTypography.headline(.semibold))
                            }
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            Group {
                                if selectedRating > 0 {
                                    AppColors.gradientAccent
                                } else {
                                    AppColors.textSecondary
                                }
                            }
                        )
                        .cornerRadius(16)
                        .shadow(
                            color: AppColors.accentBlue.opacity(0.3),
                            radius: 12,
                            x: 0,
                            y: 6
                        )
                    }
                    .disabled(isSubmitting || selectedRating == 0)
                    .padding(.horizontal, AppSpacing.md)
                    .padding(.top, AppSpacing.lg)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
                
                Spacer(minLength: AppSpacing.xxl)
            }
        }
        .navigationTitle("Rate Driver")
        .navigationBarTitleDisplayMode(.inline)
        .background(AppColors.brandBackground)
        .styledSuccessPopup(
            isPresented: $showSuccessAlert,
            title: "Rating Submitted",
            message: "Thank you for your feedback!",
            action: {
                // Refresh the trip summary in the parent view
                onDismiss?()
            }
        )
        .styledErrorPopup(
            isPresented: .constant(errorMessage != nil),
            title: "Error",
            message: errorMessage ?? "An error occurred",
            action: {
                errorMessage = nil
            }
        )
    }
    
    private var ratingText: String {
        switch selectedRating {
        case 1:
            return "Poor"
        case 2:
            return "Fair"
        case 3:
            return "Good"
        case 4:
            return "Very Good"
        case 5:
            return "Excellent"
        default:
            return ""
        }
    }
    
    private func submitRating() {
        guard selectedRating > 0 else { return }
        
        isSubmitting = true
        errorMessage = nil
        
        Task {
            do {
                // Update the trip summary with rating
                var updatedSummary = summary
                try updatedSummary.addUserRating(Double(selectedRating), feedback: feedback.isEmpty ? nil : feedback)
                
                // Save to Firestore
                try await dataService.updateTripSummary(updatedSummary)
                
                await MainActor.run {
                    isSubmitting = false
                    showSuccessAlert = true
                }
            } catch {
                await MainActor.run {
                    isSubmitting = false
                    errorMessage = "Failed to submit rating: \(error.localizedDescription)"
                }
            }
        }
    }
}

