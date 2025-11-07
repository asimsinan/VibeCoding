import SwiftUI

struct ChatSupportView: View {
    @StateObject private var viewModel = ChatSupportViewModel()
    @FocusState private var isTextFieldFocused: Bool
    
    var body: some View {
        ZStack {
            AppColors.brandBackground
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Messages List
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: AppSpacing.sm) {
                            // Welcome Message
                            if viewModel.messages.isEmpty {
                                VStack(spacing: AppSpacing.lg) {
                                    Image(systemName: "message.fill")
                                        .font(.system(size: 60))
                                        .foregroundColor(AppColors.accentBlue.opacity(0.3))
                                        .padding(.top, AppSpacing.xxxl)
                                    
                                    Text("How can we help?")
                                        .font(AppTypography.title2(.bold))
                                        .foregroundColor(AppColors.brandTextPrimary)
                                    
                                    Text("Ask us anything about your ride")
                                        .font(AppTypography.body())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                        .multilineTextAlignment(.center)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.top, AppSpacing.xxxl)
                            }
                            
                            ForEach(viewModel.messages) { message in
                                ChatMessageView(message: message)
                                    .id(message.id)
                                    .transition(.asymmetric(
                                        insertion: .move(edge: .bottom).combined(with: .opacity),
                                        removal: .opacity
                                    ))
                            }
                            
                            // Show booked ride link if available
                            if let rideId = viewModel.bookedRideId, let ride = viewModel.bookedRide {
                                HStack {
                                    Spacer(minLength: 60)
                                    
                                    NavigationLink(destination: ActiveRideView(ride: ride)) {
                                        ChatBookedRideCard(ride: ride)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                    
                                    Spacer(minLength: 60)
                                }
                                .padding(.vertical, AppSpacing.sm)
                                .transition(.asymmetric(
                                    insertion: .move(edge: .bottom).combined(with: .opacity),
                                    removal: .opacity
                                ))
                            } else if let suggestion = viewModel.bookingSuggestion {
                                // Fallback: show suggestion if we still have one (for backward compatibility)
                                HStack {
                                    Spacer(minLength: 60)
                                    
                                    NavigationLink(destination: RideSuggestionDetailView(suggestion: suggestion)) {
                                        ChatRideSuggestionCard(suggestion: suggestion)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                    
                                    Spacer(minLength: 60)
                                }
                                .padding(.vertical, AppSpacing.sm)
                                .transition(.asymmetric(
                                    insertion: .move(edge: .bottom).combined(with: .opacity),
                                    removal: .opacity
                                ))
                            }
                            
                            // Loading indicator for AI response
                            if viewModel.isLoading {
                                HStack(spacing: AppSpacing.sm) {
                                    Circle()
                                        .fill(AppColors.gradientAccent)
                                        .frame(width: 32, height: 32)
                                        .overlay(
                                            LoadingIndicator(size: 16)
                                        )
                                    
                                    CardView(cornerRadius: 20, shadowRadius: 8) {
                                        HStack(spacing: AppSpacing.sm) {
                                            ForEach(0..<3) { index in
                                                Circle()
                                                    .fill(AppColors.brandTextSecondary)
                                                    .frame(width: 8, height: 8)
                                                    .opacity(0.6)
                                                    .animation(
                                                        Animation.easeInOut(duration: 0.6)
                                                            .repeatForever()
                                                            .delay(Double(index) * 0.2),
                                                        value: viewModel.isLoading
                                                    )
                                            }
                                        }
                                        .padding(.horizontal, AppSpacing.md)
                                        .padding(.vertical, AppSpacing.sm)
                                    }
                                    
                                    Spacer(minLength: 60)
                                }
                                .padding(.horizontal, AppSpacing.md)
                                .transition(.opacity)
                            }
                        }
                        .padding(.vertical, AppSpacing.md)
                    }
                    .onChange(of: viewModel.messages.count) { _ in
                        if let lastMessage = viewModel.messages.last {
                            withAnimation {
                                proxy.scrollTo(lastMessage.id, anchor: .bottom)
                            }
                        }
                    }
                }
                
                // Input Bar
                VStack(spacing: 0) {
                    Divider()
                    
                    HStack(spacing: AppSpacing.md) {
                        // Text Field
                        HStack {
                            TextField("Type a message...", text: $viewModel.inputMessage)
                                .font(AppTypography.body())
                                .focused($isTextFieldFocused)
                                .disabled(viewModel.isLoading)
                            
                            if !viewModel.inputMessage.isEmpty {
                                Button {
                                    Task { @MainActor in
                                        viewModel.inputMessage = ""
                                    }
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .font(.system(size: 18))
                                        .foregroundColor(AppColors.brandTextSecondary)
                                }
                            }
                        }
                        .padding(.horizontal, AppSpacing.md)
                        .padding(.vertical, AppSpacing.sm)
                        .background(AppColors.brandSurface)
                        .cornerRadius(24)
                        .overlay(
                            RoundedRectangle(cornerRadius: 24)
                                .stroke(
                                    isTextFieldFocused ? AppColors.accentBlue : Color.clear,
                                    lineWidth: 2
                                )
                        )
                        
                        // Send Button
                        Button {
                            HapticFeedbackManager.shared.mediumImpact()
                            viewModel.sendMessage()
                            isTextFieldFocused = false
                        } label: {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.system(size: 32, weight: .semibold))
                                .foregroundColor(
                                    viewModel.isLoading || viewModel.inputMessage.isEmpty
                                        ? AppColors.textTertiary
                                        : .white
                                )
                                .background(
                                    Circle()
                                        .fill(
                                            viewModel.isLoading || viewModel.inputMessage.isEmpty
                                                ? AnyShapeStyle(AppColors.brandSurface)
                                                : AnyShapeStyle(AppColors.gradientAccent)
                                        )
                                        .frame(width: 36, height: 36)
                                )
                        }
                        .disabled(viewModel.isLoading || viewModel.inputMessage.isEmpty)
                        .animation(.easeInOut(duration: 0.2), value: viewModel.inputMessage.isEmpty)
                    }
                    .padding(.horizontal, AppSpacing.md)
                    .padding(.vertical, AppSpacing.sm)
                    .background(AppColors.brandBackground)
                }
            }
        }
        .navigationTitle("Support")
        .navigationBarTitleDisplayMode(.inline)
        .overlay(
            Group {
                if let errorMessage = viewModel.errorMessage {
                    VStack {
                        Spacer()
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 18))
                            
                            Text(errorMessage)
                                .font(AppTypography.body(.medium))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, AppSpacing.lg)
                        .padding(.vertical, AppSpacing.md)
                        .background(AppColors.error)
                        .cornerRadius(16)
                        .shadow(color: AppColors.shadowHeavy, radius: 12, x: 0, y: 4)
                        .padding(.horizontal, AppSpacing.md)
                        .padding(.bottom, AppSpacing.xl)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .onAppear {
                            HapticFeedbackManager.shared.error()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                                Task { @MainActor in
                                    withAnimation {
                                        viewModel.errorMessage = nil
                                    }
                                }
                            }
                        }
                    }
                }
            }
        )
    }
}

