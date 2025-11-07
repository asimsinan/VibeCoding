import SwiftUI

struct VoiceRecordingView: View {
    @ObservedObject var viewModel: VoiceBookingViewModel
    @SwiftUI.Environment(\.dismiss) private var dismiss: DismissAction
    
    // Helper function for formatting duration
    private func formatDuration(_ minutes: Int) -> String {
        guard minutes > 0 else {
            return "0min"
        }
        
        let hours = minutes / 60
        let remainingMinutes = minutes % 60
        
        if hours > 0 && remainingMinutes > 0 {
            return "\(hours)h \(remainingMinutes)min"
        } else if hours > 0 {
            return "\(hours)h"
        } else {
            return "\(minutes)min"
        }
    }
    
    private func formatPrice(_ price: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = 2
        formatter.groupingSeparator = "."
        formatter.decimalSeparator = ","
        
        if let formatted = formatter.string(from: NSNumber(value: price)) {
            return "\(formatted) ₺"
        }
        return String(format: "%.2f ₺", price)
    }
    
    var body: some View {
        VStack(spacing: AppSpacing.lg) {
            // Title
            Text("Voice Book Now")
                .font(AppTypography.title2(.bold))
                .foregroundColor(AppColors.brandTextPrimary)
                .padding(.top, AppSpacing.lg)
            
            // Recording Button
            Button(action: {
                HapticFeedbackManager.shared.mediumImpact()
                if viewModel.isRecording {
                    viewModel.stopRecording()
                } else {
                    viewModel.startRecording()
                }
            }) {
                ZStack {
                    Circle()
                        .fill(viewModel.isRecording ? AppColors.error : AppColors.accentBlue)
                        .frame(width: 120, height: 120)
                        .shadow(
                            color: (viewModel.isRecording ? AppColors.error : AppColors.accentBlue).opacity(0.4),
                            radius: viewModel.isRecording ? 20 : 16,
                            x: 0,
                            y: viewModel.isRecording ? 10 : 8
                        )
                    
                    Image(systemName: viewModel.isRecording ? "stop.fill" : "mic.fill")
                        .font(.system(size: 40, weight: .semibold))
                        .foregroundColor(.white)
                }
            }
            .padding(.vertical, AppSpacing.xl)
            
            // Status Text and Cancel Button
            if viewModel.isRecording {
                VStack(spacing: AppSpacing.md) {
                    Text("Recording...")
                        .font(AppTypography.headline(.semibold))
                        .foregroundColor(AppColors.error)
                    
                    // Cancel Button
                    Button(action: {
                        HapticFeedbackManager.shared.mediumImpact()
                        viewModel.cancelRecording()
                    }) {
                        HStack(spacing: AppSpacing.xs) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 18))
                            Text("Cancel Recording")
                                .font(AppTypography.headline(.semibold))
                        }
                        .foregroundColor(AppColors.error)
                        .padding(.horizontal, AppSpacing.lg)
                        .padding(.vertical, AppSpacing.sm)
                        .background(AppColors.error.opacity(0.1))
                        .cornerRadius(12)
                    }
                }
                .padding(.bottom, AppSpacing.sm)
            }
            
            // Recognized Text Display
            if !viewModel.recognizedText.isEmpty {
                CardView(cornerRadius: 16, shadowRadius: 8) {
                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                        Text("Recognized Text")
                            .font(AppTypography.caption1(.semibold))
                            .foregroundColor(AppColors.brandTextSecondary)
                            .textCase(.uppercase)
                        
                        ScrollView {
                            Text(viewModel.recognizedText)
                                .font(AppTypography.body())
                                .foregroundColor(AppColors.brandTextPrimary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .frame(maxHeight: 200) // Limit height but allow scrolling
                    }
                    .padding(AppSpacing.md)
                }
                .padding(.horizontal, AppSpacing.md)
            }
            
            // Processing Indicator
            if viewModel.isProcessing {
                VStack(spacing: AppSpacing.md) {
                    LoadingIndicator(size: 40)
                    Text("Processing your request...")
                        .font(AppTypography.body())
                        .foregroundColor(AppColors.brandTextSecondary)
                }
                .padding(.top, AppSpacing.lg)
            }
            
            // Error Message
            if let errorMessage = viewModel.errorMessage {
                HStack(spacing: AppSpacing.sm) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 16))
                    
                    Text(errorMessage)
                        .font(AppTypography.body(.medium))
                }
                .foregroundColor(AppColors.error)
                .padding(AppSpacing.md)
                .background(AppColors.error.opacity(0.1))
                .cornerRadius(12)
                .padding(.horizontal, AppSpacing.md)
            }
            
            // Show extracted information and ride suggestion
            if let result = viewModel.voiceResult {
                CardView(cornerRadius: 16, shadowRadius: 8) {
                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        HStack {
                            Image(systemName: result.rideSuggestion != nil ? "car.fill" : "checkmark.circle.fill")
                                .font(.system(size: 20))
                                .foregroundColor(AppColors.accentBlue)
                            
                            Text(result.rideSuggestion != nil ? "Ride Suggestion" : "Command Processed")
                                .font(AppTypography.headline(.semibold))
                                .foregroundColor(AppColors.brandTextPrimary)
                            
                            Spacer()
                        }
                        
                        Divider()
                        
                        // Show entities
                        if let entities = result.entities {
                            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                                if let pickup = entities.pickupLocation {
                                    HStack(spacing: AppSpacing.sm) {
                                        Image(systemName: "mappin.circle.fill")
                                            .foregroundColor(AppColors.accentGreen)
                                        Text("Pickup: \(pickup)")
                                            .font(AppTypography.body())
                                    }
                                }
                                
                                if let dropoff = entities.dropoffLocation {
                                    HStack(spacing: AppSpacing.sm) {
                                        Image(systemName: "mappin.circle.fill")
                                            .foregroundColor(AppColors.error)
                                        Text("Dropoff: \(dropoff)")
                                            .font(AppTypography.body())
                                    }
                                }
                                
                                if let rideType = entities.rideType {
                                    HStack(spacing: AppSpacing.sm) {
                                        Image(systemName: "car.fill")
                                            .foregroundColor(AppColors.accentBlue)
                                        Text("Type: \(rideType.capitalized)")
                                            .font(AppTypography.body())
                                    }
                                }
                            }
                        }
                        
                        // Show ride suggestion details
                        if let suggestion = result.rideSuggestion {
                            Divider()
                            
                            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                                HStack {
                                    Text("Estimated Price:")
                                        .font(AppTypography.body(.medium))
                                    Spacer()
                                    Text(formatPrice(suggestion.estimatedPrice))
                                        .font(AppTypography.headline(.semibold))
                                        .foregroundColor(AppColors.accentBlue)
                                }
                                
                                HStack {
                                    Text("Duration:")
                                        .font(AppTypography.body(.medium))
                                    Spacer()
                                    Text(formatDuration(suggestion.estimatedDuration))
                                        .font(AppTypography.headline(.semibold))
                                }
                            }
                            
                            Divider()
                            
                            Button(action: {
                                HapticFeedbackManager.shared.mediumImpact()
                                viewModel.bookRide(from: result)
                            }) {
                                HStack(spacing: AppSpacing.sm) {
                                    Image(systemName: "car.fill")
                                        .font(.system(size: 18, weight: .semibold))
                                    
                                    Text("Book This Ride")
                                        .font(AppTypography.headline(.semibold))
                                }
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(AppColors.gradientAccent)
                                .cornerRadius(12)
                            }
                        } else if result.entities?.dropoffLocation != nil {
                            Divider()
                            
                            Button(action: {
                                HapticFeedbackManager.shared.mediumImpact()
                            }) {
                                HStack(spacing: AppSpacing.sm) {
                                    Image(systemName: "car.fill")
                                        .font(.system(size: 18, weight: .semibold))
                                    
                                    Text("Get Ride Options")
                                        .font(AppTypography.headline(.semibold))
                                }
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(AppColors.gradientAccent)
                                .cornerRadius(12)
                            }
                        }
                    }
                    .padding(AppSpacing.md)
                }
                .padding(.horizontal, AppSpacing.md)
                .padding(.top, AppSpacing.md)
            }
            
            Spacer()
        }
        .padding()
        .navigationTitle("UncleTaxim")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(viewModel.isRecording) // Prevent back button during recording
        .styledSuccessPopup(
            isPresented: $viewModel.bookingSuccess,
            title: "Ride Booked!",
            message: viewModel.bookingMessage ?? "Your ride has been booked successfully!",
            action: {
                Task { @MainActor in
                    viewModel.bookingSuccess = false
                    viewModel.bookingMessage = nil
                }
            }
        )
        .onDisappear {
            // Only stop if we're actually leaving the view (not just a state update)
            // Check if recording has been active for more than a brief moment
            if viewModel.isRecording {
                // Give it a moment to see if this is just a state update
                Task { @MainActor in
                    try? await Task.sleep(nanoseconds: 200_000_000) // 0.2 seconds
                    // Only stop if we're still recording and view actually disappeared
                    // This prevents stopping during normal state updates
                    if viewModel.isRecording {
                        viewModel.stopRecording()
                    }
                }
            }
        }
    }
}

