import SwiftUI

struct DriverDashboardView: View {
    @StateObject private var viewModel = DriverDashboardViewModel()
    @State private var selectedTab: Int = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Tab selector
            Picker("View", selection: $selectedTab) {
                Text("Available Rides").tag(0)
                Text("My Rides").tag(1)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()
            
            // Content
            if selectedTab == 0 {
                AvailableRidesView(viewModel: viewModel)
            } else {
                MyRidesView(viewModel: viewModel)
            }
        }
        .navigationTitle("Driver Dashboard")
        .onAppear {
            viewModel.loadAvailableRides()
            viewModel.loadMyActiveRides()
            viewModel.setupAvailableRidesListener()
            viewModel.setupMyRidesListener()
        }
    }
}

struct AvailableRidesView: View {
    @ObservedObject var viewModel: DriverDashboardViewModel
    @State private var selectedRide: Ride?
    @State private var showAcceptAlert = false
    @State private var isAcceptingRide = false
    @State private var showErrorAlert = false
    @State private var errorMessage = ""
    
    // Helper functions for formatting
    private func formatDistance(_ distance: Double) -> String {
        if distance < 1.0 {
            return String(format: "%.0f m", distance * 1000)
        } else {
            return String(format: "%.1f km", distance)
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
    
    var body: some View {
        Group {
            if viewModel.isLoading {
                VStack {
                    Spacer()
                    LoadingIndicator()
                    Text("Loading available rides...")
                        .font(AppTypography.body())
                        .foregroundColor(AppColors.brandTextSecondary)
                        .padding(.top)
                    Spacer()
                }
            } else if viewModel.availableRides.isEmpty {
                VStack(spacing: AppSpacing.md) {
                    Spacer()
                    Image(systemName: "car.fill")
                        .font(.system(size: 60))
                        .foregroundColor(AppColors.brandTextSecondary.opacity(0.5))
                    
                    Text("No Available Rides")
                        .font(AppTypography.title2())
                        .foregroundColor(AppColors.brandTextPrimary)
                    
                    Text("Check back soon for new ride requests")
                        .font(AppTypography.body())
                        .foregroundColor(AppColors.brandTextSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    Spacer()
                }
            } else {
                ScrollView(.vertical) {
                    LazyVStack(spacing: AppSpacing.md) {
                        ForEach(viewModel.availableRides, id: \.id) { ride in
                            AvailableRideCard(ride: ride) {
                                selectedRide = ride
                                showAcceptAlert = true
                            }
                        }
                    }
                    .padding()
                }
            }
        }
        .styledPopup(
            isPresented: $showAcceptAlert,
            type: .info,
            title: "Accept Ride?",
            message: selectedRide != nil
                ? "Fiyat: \(formatPrice(selectedRide!.estimatedPrice)) • \(formatDistance(selectedRide!.estimatedDistance)) • \(formatDuration(selectedRide!.estimatedDuration))"
                : "",
            primaryButtonTitle: isAcceptingRide ? "Accepting..." : "Accept",
            secondaryButtonTitle: "Cancel",
            onPrimaryAction: {
                if let ride = selectedRide, !isAcceptingRide {
                    acceptRide(ride)
                }
            },
            onSecondaryAction: {
                if !isAcceptingRide {
                    selectedRide = nil
                    showAcceptAlert = false
                }
            }
        )
        .styledPopup(
            isPresented: $showErrorAlert,
            type: .error,
            title: "Error Accepting Ride",
            message: errorMessage,
            primaryButtonTitle: "OK",
            secondaryButtonTitle: nil,
            onPrimaryAction: {
                showErrorAlert = false
                errorMessage = ""
            },
            onSecondaryAction: nil
        )
    }
    
    private func acceptRide(_ ride: Ride) {
        guard !isAcceptingRide else { return }
        
        isAcceptingRide = true
        
        Task {
            do {
                try await viewModel.acceptRide(ride)
                await MainActor.run {
                    HapticFeedbackManager.shared.success()
                    selectedRide = nil
                    showAcceptAlert = false
                    isAcceptingRide = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showErrorAlert = true
                    showAcceptAlert = false
                    selectedRide = nil
                    isAcceptingRide = false
                }
            }
        }
    }
}

struct AvailableRideCard: View {
    let ride: Ride
    let onAccept: () -> Void
    
    // Helper functions for formatting
    private func formatDistance(_ distance: Double) -> String {
        if distance < 1.0 {
            return String(format: "%.0f m", distance * 1000)
        } else {
            return String(format: "%.1f km", distance)
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
    
    var body: some View {
        CardView(cornerRadius: 16, shadowRadius: 12, shadowOpacity: 0.1) {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                // Header
                HStack {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(AppColors.accentBlue)
                    
                    Text("New Ride Request")
                        .font(AppTypography.headline())
                        .foregroundColor(AppColors.brandTextPrimary)
                    
                    Spacer()
                    
                    Text(formatPrice(ride.estimatedPrice))
                        .font(AppTypography.title3(.bold))
                        .foregroundColor(AppColors.accentGreen)
                }
                
                Divider()
                
                // Pickup
                LocationRow(
                    icon: "location.fill",
                    iconColor: AppColors.accentGreen,
                    title: "Pickup",
                    address: ride.pickupLocation.address
                )
                
                // Waypoints (Intermediate Stops)
                if !ride.waypoints.isEmpty {
                    ForEach(Array(ride.waypoints.enumerated()), id: \.offset) { index, waypoint in
                        LocationRow(
                            icon: "mappin.circle.fill",
                            iconColor: AppColors.accentOrange,
                            title: "Stop \(index + 1)",
                            address: waypoint.address
                        )
                    }
                }
                
                // Dropoff
                LocationRow(
                    icon: "mappin.circle.fill",
                    iconColor: AppColors.error,
                    title: "Dropoff",
                    address: ride.dropoffLocation.address
                )
                
                Divider()
                
                // Ride details
                HStack {
                    Label(formatDistance(ride.estimatedDistance), systemImage: "mappin.circle.fill")
                        .font(AppTypography.caption1())
                        .foregroundColor(AppColors.brandTextSecondary)
                    
                    Spacer()
                    
                    Label(formatDuration(ride.estimatedDuration), systemImage: "clock.fill")
                        .font(AppTypography.caption1())
                        .foregroundColor(AppColors.brandTextSecondary)
                    
                    Spacer()
                    
                    Label(ride.rideType.rawValue.capitalized, systemImage: "car.fill")
                        .font(AppTypography.caption1())
                        .foregroundColor(AppColors.brandTextSecondary)
                }
                
                // Accept button
                Button(action: onAccept) {
                    HStack {
                        Spacer()
                        Text("Accept Ride")
                            .font(AppTypography.headline(.semibold))
                            .foregroundColor(.white)
                        Spacer()
                    }
                    .padding()
                    .background(AppColors.accentBlue)
                    .cornerRadius(12)
                }
                .padding(.top, AppSpacing.sm)
            }
            .padding(AppSpacing.lg)
        }
    }
}

struct MyRidesView: View {
    @ObservedObject var viewModel: DriverDashboardViewModel
    
    var body: some View {
        Group {
            if viewModel.myActiveRides.isEmpty {
                VStack(spacing: AppSpacing.md) {
                    Spacer()
                    Image(systemName: "car.fill")
                        .font(.system(size: 60))
                        .foregroundColor(AppColors.brandTextSecondary.opacity(0.5))
                    
                    Text("No Active Rides")
                        .font(AppTypography.title2())
                        .foregroundColor(AppColors.brandTextPrimary)
                    
                    Text("Accept a ride to get started")
                        .font(AppTypography.body())
                        .foregroundColor(AppColors.brandTextSecondary)
                    
                    Spacer()
                }
            } else {
                List {
                    ForEach(viewModel.myActiveRides, id: \.id) { ride in
                        NavigationLink(destination: DriverRideDetailView(ride: ride, viewModel: viewModel)) {
                            DriverRideRow(ride: ride)
                        }
                    }
                }
            }
        }
    }
}

struct DriverRideRow: View {
    let ride: Ride
    
    // Helper functions for formatting
    private func formatDistance(_ distance: Double) -> String {
        if distance < 1.0 {
            return String(format: "%.0f m", distance * 1000)
        } else {
            return String(format: "%.1f km", distance)
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
    
    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            HStack {
                Text(ride.status.displayName)
                    .font(AppTypography.caption1(.semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, AppSpacing.sm)
                    .padding(.vertical, AppSpacing.xs)
                    .background(statusColor(for: ride.status))
                    .cornerRadius(6)
                
                Spacer()
                
                Text(formatPrice(ride.actualPrice ?? ride.estimatedPrice))
                    .font(AppTypography.headline())
                    .foregroundColor(AppColors.accentGreen)
            }
            
            HStack {
                Text(ride.pickupLocation.address)
                    .font(AppTypography.body())
                    .foregroundColor(AppColors.brandTextPrimary)
                    .lineLimit(1)
                
                Spacer()
                
                Text(formatDistance(ride.actualDistance ?? ride.estimatedDistance))
                    .font(AppTypography.caption1(.semibold))
                    .foregroundColor(AppColors.brandTextSecondary)
            }
            
            Text(ride.dropoffLocation.address)
                .font(AppTypography.caption1())
                .foregroundColor(AppColors.brandTextSecondary)
                .lineLimit(1)
        }
        .padding(.vertical, AppSpacing.xs)
    }
    
    private func statusColor(for status: RideStatus) -> Color {
        switch status {
        case .pending: return AppColors.accentOrange
        case .accepted: return AppColors.accentBlue
        case .inProgress: return AppColors.accentGreen
        case .completed: return AppColors.success
        case .cancelled: return AppColors.error
        }
    }
}

struct DriverRideDetailView: View {
    let ride: Ride
    @ObservedObject var viewModel: DriverDashboardViewModel
    @SwiftUI.Environment(\.presentationMode) var presentationMode
    @State private var showStartAlert = false
    @State private var showCompleteAlert = false
    
    // Helper functions for formatting
    private func formatDistance(_ distance: Double) -> String {
        if distance < 1.0 {
            return String(format: "%.0f m", distance * 1000)
        } else {
            return String(format: "%.1f km", distance)
        }
    }
    
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
    
    // Get the current ride from viewModel to reflect real-time updates
    private var currentRide: Ride {
        // Try to get the updated ride from viewModel's myActiveRides
        if let updatedRide = viewModel.myActiveRides.first(where: { $0.id == ride.id }) {
            return updatedRide
        }
        // Fallback to the original ride
        return ride
    }
    
    var body: some View {
        ScrollView(.vertical) {
            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                CardView {
                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        Text("Ride Details")
                            .font(AppTypography.title2())
                        
                        LocationRow(
                            icon: "location.fill",
                            iconColor: AppColors.accentGreen,
                            title: "Pickup",
                            address: ride.pickupLocation.address
                        )
                        
                        // Waypoints (Intermediate Stops)
                        if !currentRide.waypoints.isEmpty {
                            ForEach(Array(currentRide.waypoints.enumerated()), id: \.offset) { index, waypoint in
                                LocationRow(
                                    icon: "mappin.circle.fill",
                                    iconColor: AppColors.accentOrange,
                                    title: "Stop \(index + 1)",
                                    address: waypoint.address
                                )
                            }
                        }
                        
                        LocationRow(
                            icon: "mappin.circle.fill",
                            iconColor: AppColors.error,
                            title: "Dropoff",
                            address: currentRide.dropoffLocation.address
                        )
                        
                        Divider()
                        
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Fiyat")
                                    .font(AppTypography.caption1())
                                    .foregroundColor(AppColors.brandTextSecondary)
                                Text(formatPrice(currentRide.actualPrice ?? currentRide.estimatedPrice))
                                    .font(AppTypography.headline())
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .leading) {
                                Text("Distance")
                                    .font(AppTypography.caption1())
                                    .foregroundColor(AppColors.brandTextSecondary)
                                Text(formatDistance(currentRide.actualDistance ?? currentRide.estimatedDistance))
                                    .font(AppTypography.headline())
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .leading) {
                                Text("Duration")
                                    .font(AppTypography.caption1())
                                    .foregroundColor(AppColors.brandTextSecondary)
                                Text(formatDuration(currentRide.actualDuration ?? currentRide.estimatedDuration))
                                    .font(AppTypography.headline())
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .leading) {
                                Text("Type")
                                    .font(AppTypography.caption1())
                                    .foregroundColor(AppColors.brandTextSecondary)
                                Text(currentRide.rideType.rawValue.capitalized)
                                    .font(AppTypography.headline())
                            }
                        }
                    }
                    .padding()
                }
                
                // Action buttons based on status (use currentRide to reflect updates)
                if currentRide.status == .accepted {
                    Button(action: { showStartAlert = true }) {
                        HStack {
                            Spacer()
                            Text("Start Ride")
                                .font(AppTypography.headline(.semibold))
                                .foregroundColor(.white)
                            Spacer()
                        }
                        .padding()
                        .background(AppColors.accentGreen)
                        .cornerRadius(12)
                    }
                } else if currentRide.status == .inProgress {
                    Button(action: { showCompleteAlert = true }) {
                        HStack {
                            Spacer()
                            Text("Complete Ride")
                                .font(AppTypography.headline(.semibold))
                                .foregroundColor(.white)
                            Spacer()
                        }
                        .padding()
                        .background(AppColors.success)
                        .cornerRadius(12)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Ride Details")
        .styledPopup(
            isPresented: $showStartAlert,
            type: .info,
            title: "Start Ride?",
            message: "Mark this ride as in progress",
            primaryButtonTitle: "Start",
            secondaryButtonTitle: "Cancel",
            onPrimaryAction: {
                startRide()
            },
            onSecondaryAction: {}
        )
        .styledPopup(
            isPresented: $showCompleteAlert,
            type: .info,
            title: "Complete Ride?",
            message: "Mark this ride as completed",
            primaryButtonTitle: "Complete",
            secondaryButtonTitle: "Cancel",
            onPrimaryAction: {
                completeRide()
            },
            onSecondaryAction: {}
        )
        .styledErrorPopup(
            isPresented: .constant(viewModel.errorMessage != nil),
            title: "Payment Error",
            message: viewModel.errorMessage ?? "",
            action: {
                Task { @MainActor in
                    viewModel.errorMessage = nil
                }
            }
        )
        .paymentSuccessPopup(
            isPresented: $viewModel.showCompletionSuccess,
            paymentAmount: viewModel.paymentAmount,
            onDismiss: {
                Task { @MainActor in
                    viewModel.showCompletionSuccess = false
                    viewModel.paymentAmount = nil
                    viewModel.completionSuccessMessage = nil
                    // Navigate back after dismissing success popup
                    presentationMode.wrappedValue.dismiss()
                }
            }
        )
        .overlay {
            // Show loading spinner while payment is being processed
            if viewModel.isCompletingRide {
                ZStack {
                    Color.black.opacity(0.4)
                        .ignoresSafeArea()
                    
                    VStack(spacing: AppSpacing.lg) {
                        ProgressView()
                            .scaleEffect(1.5)
                            .tint(.white)
                        
                        Text("Processing Payment...")
                            .font(AppTypography.headline(.semibold))
                            .foregroundColor(.white)
                        
                        Text("Please wait while we process the payment")
                            .font(AppTypography.body())
                            .foregroundColor(.white.opacity(0.9))
                            .multilineTextAlignment(.center)
                    }
                    .padding(AppSpacing.xl)
                    .background(AppColors.brandSurface)
                    .cornerRadius(16)
                    .shadow(radius: 20)
                }
            }
        }
    }
    
    private func startRide() {
        Task {
            do {
                try await viewModel.startRide(ride)
                HapticFeedbackManager.shared.success()
            }
        }
    }
    
    private func completeRide() {
        Task {
            do {
                // Use estimated values for now (in real app, driver would input actual values)
                try await viewModel.completeRide(
                    ride,
                    actualPrice: ride.estimatedPrice,
                    actualDuration: ride.estimatedDuration
                )
                HapticFeedbackManager.shared.success()
                // The success popup will be shown, and navigation will happen after dismissing it
                // The ride will automatically disappear from active rides since ViewModel removes it
            } catch {
                await MainActor.run {
                    viewModel.errorMessage = error.localizedDescription
                    HapticFeedbackManager.shared.error()
                }
            }
        }
    }
}

