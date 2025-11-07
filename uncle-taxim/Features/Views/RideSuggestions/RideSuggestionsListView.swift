import SwiftUI

struct RideSuggestionsListView: View {
    @StateObject private var viewModel = RideSuggestionsViewModel()
    @ObservedObject private var networkMonitor = NetworkMonitorService.shared
    
    var body: some View {
        ZStack {
            AppColors.brandBackground
                .ignoresSafeArea()
            
            contentView
        }
        .navigationTitle("Ride Suggestions")
        .onAppear {
            viewModel.loadSuggestions()
        }
    }
    
    @ViewBuilder
    private var contentView: some View {
        if viewModel.isLoading && viewModel.suggestions.isEmpty {
            skeletonView
        } else {
            suggestionsList
        }
    }
    
    private var skeletonView: some View {
        SkeletonListView(itemCount: 5)
    }
    
    private var suggestionsList: some View {
        Group {
            if viewModel.suggestions.isEmpty && !viewModel.isLoading {
                // Empty State
                VStack(spacing: AppSpacing.lg) {
                    Image(systemName: "map.fill")
                        .font(.system(size: 60))
                        .foregroundColor(AppColors.accentBlue.opacity(0.3))
                        .padding(.top, AppSpacing.xxxl)
                    
                    Text("No ride suggestions available")
                        .font(AppTypography.title2(.bold))
                        .foregroundColor(AppColors.brandTextPrimary)
                    
                    Text("You can search for rides or creating your own in the future.  ")
                        .font(AppTypography.body())
                        .foregroundColor(AppColors.brandTextSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, AppSpacing.lg)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    OfflineBannerView(
                        networkMonitor: networkMonitor,
                        isCached: viewModel.isDataFromCache,
                        lastUpdated: viewModel.lastUpdated
                    )
                    
                    ForEach(viewModel.suggestions, id: \.uniqueId) { suggestion in
                        NavigationLink(destination: RideSuggestionDetailView(suggestion: suggestion)) {
                            RideSuggestionCardView(suggestion: suggestion, isCompact: true)
                        }
                        .buttonStyle(PlainButtonStyle())
                        .contentShape(Rectangle())
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets(
                            top: AppSpacing.sm,
                            leading: AppSpacing.md,
                            bottom: AppSpacing.sm,
                            trailing: AppSpacing.md
                        ))
                    }
                }
                .listStyle(.plain)
                .background(AppColors.brandBackground)
                .refreshable {
                    HapticFeedbackManager.shared.selectionChanged()
                    viewModel.loadSuggestions()
                }
            }
        }
        .overlay(loadingOverlay)
        .alert(
            "Error",
            isPresented: Binding(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 {
                    Task { @MainActor in
                        viewModel.errorMessage = nil
                    }
                } }
            )
        ) {
            Button("OK") {
                Task { @MainActor in
                    viewModel.errorMessage = nil
                }
            }
            // Add "Retry" button if it's an index error
            if let errorMessage = viewModel.errorMessage,
               errorMessage.contains("index") || errorMessage.contains("Index") {
                Button("Retry") {
                    Task { @MainActor in
                        viewModel.errorMessage = nil
                    }
                    viewModel.loadSuggestions()
                }
            }
        } message: {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
            }
        }
    }
    
    @ViewBuilder
    private var loadingOverlay: some View {
        if viewModel.isLoading && !viewModel.suggestions.isEmpty {
            VStack {
                Spacer()
                LoadingIndicator()
                    .padding(.bottom, AppSpacing.lg)
            }
        }
    }
}

