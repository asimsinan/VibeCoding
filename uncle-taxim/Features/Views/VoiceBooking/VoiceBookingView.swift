import SwiftUI

struct VoiceBookingView: View {
    @StateObject private var viewModel = VoiceBookingViewModel()
    @State private var showRecordingView = false
    @State private var showErrorAlert = false
    @State private var showPaymentMethodsView = false
    
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
    
    var body: some View {
        ZStack {
            // Background gradient
            AppColors.brandBackground
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: AppSpacing.xl) {
                    // Header Section
                    VStack(spacing: AppSpacing.sm) {
                        HStack {
                            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                                Text("UncleTaxim")
                                    .font(AppTypography.largeTitle(.bold))
                                    .foregroundColor(AppColors.brandTextPrimary)
                                
                                Text("Speak your destination")
                                    .font(AppTypography.subheadline())
                                    .foregroundColor(AppColors.brandTextSecondary)
                            }
                            
                            Spacer()
                            
                            // Language Selector
                            Menu {
                                ForEach(VoiceBookingViewModel.VoiceLanguage.allCases, id: \.self) { language in
                                    Button(action: {
                                        viewModel.setLanguage(language)
                                    }) {
                                        HStack {
                                            Text(language.displayName)
                                            if viewModel.selectedLanguage == language {
                                                Image(systemName: "checkmark")
                                            }
                                        }
                                    }
                                }
                            } label: {
                                HStack(spacing: AppSpacing.xs) {
                                    Image(systemName: "globe")
                                        .font(.system(size: 16))
                                    Text(viewModel.selectedLanguage.displayName)
                                        .font(AppTypography.caption1(.semibold))
                                }
                                .foregroundColor(AppColors.accentBlue)
                                .padding(.horizontal, AppSpacing.sm)
                                .padding(.vertical, AppSpacing.xs)
                                .background(AppColors.accentBlue.opacity(0.1))
                                .cornerRadius(8)
                            }
                        }
                    }
                    .padding(.top, AppSpacing.xxl)
                    .padding(.horizontal, AppSpacing.md)
                    
                    // Recording Status Card
                    if viewModel.isRecording {
                        CardView(cornerRadius: 20, shadowRadius: 16, shadowOpacity: 0.2) {
                            VStack(spacing: AppSpacing.md) {
                                // Pulsing microphone icon
                                ZStack {
                                    Circle()
                                        .fill(AppColors.error.opacity(0.1))
                                        .frame(width: 100, height: 100)
                                    
                                    Circle()
                                        .fill(AppColors.error.opacity(0.2))
                                        .frame(width: 80, height: 80)
                                        .scaleEffect(viewModel.isRecording ? 1.2 : 1.0)
                                        .animation(
                                            Animation.easeInOut(duration: 1.0)
                                                .repeatForever(autoreverses: true),
                                            value: viewModel.isRecording
                                        )
                                    
                                    Image(systemName: "mic.fill")
                                        .font(.system(size: 40, weight: .semibold))
                                        .foregroundColor(AppColors.error)
                                }
                                
                                Text("Recording...")
                                    .font(AppTypography.title2(.semibold))
                                    .foregroundColor(AppColors.brandTextPrimary)
                                
                                Text("Speak your destination clearly")
                                    .font(AppTypography.body())
                                    .foregroundColor(AppColors.brandTextSecondary)
                                
                                // Cancel Button
                                Button(action: {
                                    HapticFeedbackManager.shared.mediumImpact()
                                    viewModel.cancelRecording()
                                }) {
                                    HStack(spacing: AppSpacing.xs) {
                                        Image(systemName: "xmark.circle.fill")
                                            .font(.system(size: 18))
                                        Text("Cancel")
                                            .font(AppTypography.headline(.semibold))
                                    }
                                    .foregroundColor(AppColors.error)
                                    .padding(.horizontal, AppSpacing.lg)
                                    .padding(.vertical, AppSpacing.sm)
                                    .background(AppColors.error.opacity(0.1))
                                    .cornerRadius(12)
                                }
                                .padding(.top, AppSpacing.sm)
                            }
                            .padding(AppSpacing.xl)
                        }
                        .padding(.horizontal, AppSpacing.md)
                    }
                    
                    // Processing Indicator
                    if viewModel.isProcessing {
                        CardView(cornerRadius: 20, shadowRadius: 16) {
                            VStack(spacing: AppSpacing.md) {
                                LoadingIndicator(size: 40)
                                Text("Processing your request...")
                                    .font(AppTypography.headline())
                                    .foregroundColor(AppColors.brandTextPrimary)
                            }
                            .padding(AppSpacing.xl)
                        }
                        .padding(.horizontal, AppSpacing.md)
                    }
                    
                    // Extracted Information Card
                    if let result = viewModel.voiceResult {
                        CardView(cornerRadius: 20, shadowRadius: 16, shadowOpacity: 0.15) {
                            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                                HStack {
                                    Image(systemName: result.rideSuggestion != nil ? "car.fill" : "checkmark.circle.fill")
                                        .font(.system(size: 24))
                                        .foregroundColor(AppColors.accentBlue)
                                    
                                    Text(result.rideSuggestion != nil ? "Ride Suggestion" : "Voice Command Processed")
                                        .font(AppTypography.title2(.bold))
                                        .foregroundColor(AppColors.brandTextPrimary)
                                    
                                    Spacer()
                                }
                                
                                // Show transcript
                                if !result.transcript.isEmpty {
                                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                        Text("You said:")
                                            .font(AppTypography.caption1(.semibold))
                                            .foregroundColor(AppColors.brandTextSecondary)
                                            .textCase(.uppercase)
                                        
                                        ScrollView {
                                            Text(result.transcript)
                                                .font(AppTypography.body())
                                                .foregroundColor(AppColors.brandTextPrimary)
                                                .frame(maxWidth: .infinity, alignment: .leading)
                                                .fixedSize(horizontal: false, vertical: true)
                                        }
                                        .frame(maxHeight: 200) // Limit height but allow scrolling
                                    }
                                    .padding(.vertical, AppSpacing.sm)
                                    .padding(.horizontal, AppSpacing.md)
                                    .background(AppColors.brandSurface)
                                    .cornerRadius(12)
                                }
                                
                                Divider()
                                
                                // Show ride suggestion details
                                // Priority: currentSuggestion (Firestore with calculated values) > result.rideSuggestion (AI response)
                                if let currentSuggestion = viewModel.currentSuggestion {
                                    // Use Firestore suggestion (has correct calculated values with waypoints)
                                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                                        VoiceBookingLocationRow(
                                            icon: "mappin.circle.fill",
                                            iconColor: AppColors.accentGreen,
                                            title: "Pickup",
                                            address: currentSuggestion.pickupLocation.address
                                        )
                                        
                                        // Show waypoints
                                        if !currentSuggestion.waypoints.isEmpty {
                                            ForEach(Array(currentSuggestion.waypoints.enumerated()), id: \.offset) { index, waypoint in
                                                VoiceBookingLocationRow(
                                                    icon: "mappin.circle.fill",
                                                    iconColor: AppColors.accentOrange,
                                                    title: "Stop \(index + 1)",
                                                    address: waypoint.address
                                                )
                                            }
                                        }
                                        
                                        VoiceBookingLocationRow(
                                            icon: "mappin.circle.fill",
                                            iconColor: AppColors.error,
                                            title: "Dropoff",
                                            address: currentSuggestion.dropoffLocation.address
                                        )
                                        
                                        Divider()
                                        
                                        // Ride Details (use calculated values from Firestore suggestion)
                                        HStack {
                                            RideDetailItem(
                                                icon: "car.fill",
                                                label: currentSuggestion.rideType.rawValue.capitalized,
                                                value: ""
                                            )
                                            
                                            Spacer()
                                            
                                            RideDetailItem(
                                                icon: "mappin.circle.fill",
                                                label: formatDistance(currentSuggestion.estimatedDistance),
                                                value: ""
                                            )
                                            
                                            Spacer()
                                            
                                            RideDetailItem(
                                                icon: "clock.fill",
                                                label: formatDuration(currentSuggestion.estimatedDuration),
                                                value: ""
                                            )
                                            
                                            Spacer()
                                            
                                            RideDetailItem(
                                                icon: "dollarsign.circle.fill",
                                                label: formatPrice(currentSuggestion.estimatedPrice),
                                                value: ""
                                            )
                                        }
                                    }
                                } else if let suggestion = result.rideSuggestion {
                                    // Fallback to AI response (may have placeholder values)
                                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                                        // Use entities from suggestion if available
                                        if let pickup = suggestion.pickupLocation {
                                            VoiceBookingLocationRow(
                                                icon: "mappin.circle.fill",
                                                iconColor: AppColors.accentGreen,
                                                title: "Pickup",
                                                address: pickup
                                            )
                                        }
                                        
                                        // Show waypoints from entities
                                        if let entities = result.entities,
                                           let waypoints = entities.waypoints, !waypoints.isEmpty {
                                            ForEach(Array(waypoints.enumerated()), id: \.offset) { index, waypoint in
                                                VoiceBookingLocationRow(
                                                    icon: "mappin.circle.fill",
                                                    iconColor: AppColors.accentOrange,
                                                    title: "Stop \(index + 1)",
                                                    address: waypoint
                                                )
                                            }
                                        }
                                        
                                        if let dropoff = suggestion.dropoffLocation {
                                            VoiceBookingLocationRow(
                                                icon: "mappin.circle.fill",
                                                iconColor: AppColors.error,
                                                title: "Dropoff",
                                                address: dropoff
                                            )
                                        }
                                        
                                        Divider()
                                        
                                        // Ride Details (from AI response - may be placeholders)
                                        HStack {
                                            RideDetailItem(
                                                icon: "car.fill",
                                                label: suggestion.rideType.capitalized,
                                                value: ""
                                            )
                                            
                                            Spacer()
                                            
                                            RideDetailItem(
                                                icon: "mappin.circle.fill",
                                                label: formatDistance(suggestion.estimatedDistance ?? 0.0),
                                                value: ""
                                            )
                                            
                                            Spacer()
                                            
                                            RideDetailItem(
                                                icon: "clock.fill",
                                                label: formatDuration(suggestion.estimatedDuration),
                                                value: ""
                                            )
                                            
                                            Spacer()
                                            
                                            RideDetailItem(
                                                icon: "dollarsign.circle.fill",
                                                label: "$\(String(format: "%.2f", suggestion.estimatedPrice))",
                                                value: ""
                                            )
                                        }
                                    }
                                }
                                
                                // Show map with route if we have a created suggestion with waypoints
                                if let suggestion = viewModel.currentSuggestion,
                                   (!suggestion.waypoints.isEmpty || suggestion.pickupLocation.latitude != 0.0) {
                                    Divider()
                                    
                                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                                        Text("Route Map")
                                            .font(AppTypography.headline(.semibold))
                                            .foregroundColor(AppColors.brandTextPrimary)
                                        
                                        RideMapView(
                                            pickupLocation: suggestion.pickupLocation,
                                            dropoffLocation: suggestion.dropoffLocation,
                                            waypoints: suggestion.waypoints
                                        )
                                        .frame(height: 200)
                                        .cornerRadius(12)
                                    }
                                    .padding(.top, AppSpacing.sm)
                                }
                                
                                // Fallback: Show extracted entities if no suggestion is available
                                if viewModel.currentSuggestion == nil, let entities = result.entities {
                                    // Fallback: Show extracted entities if no suggestion is available
                                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                                        // Pickup Location
                                        if let pickup = entities.pickupLocation {
                                            VoiceBookingLocationRow(
                                                icon: "mappin.circle.fill",
                                                iconColor: AppColors.accentGreen,
                                                title: "Pickup",
                                                address: pickup
                                            )
                                        }
                                        
                                        // Waypoints (Intermediate Stops)
                                        if let waypoints = entities.waypoints, !waypoints.isEmpty {
                                            ForEach(Array(waypoints.enumerated()), id: \.offset) { index, waypoint in
                                                VoiceBookingLocationRow(
                                                    icon: "mappin.circle.fill",
                                                    iconColor: AppColors.accentOrange,
                                                    title: "Stop \(index + 1)",
                                                    address: waypoint
                                                )
                                            }
                                        }
                                        
                                        // Dropoff Location
                                        if let dropoff = entities.dropoffLocation {
                                            VoiceBookingLocationRow(
                                                icon: "mappin.circle.fill",
                                                iconColor: AppColors.error,
                                                title: "Dropoff",
                                                address: dropoff
                                            )
                                        }
                                        
                                        // Ride Type
                                        if let rideType = entities.rideType {
                                            Divider()
                                            
                                            HStack(spacing: AppSpacing.sm) {
                                                Image(systemName: "car.fill")
                                                    .font(.system(size: 18))
                                                    .foregroundColor(AppColors.accentBlue)
                                                
                                                Text("Ride Type:")
                                                    .font(AppTypography.body(.medium))
                                                    .foregroundColor(AppColors.brandTextSecondary)
                                                
                                                Text(rideType.capitalized)
                                                    .font(AppTypography.body(.semibold))
                                                    .foregroundColor(AppColors.brandTextPrimary)
                                                
                                                Spacer()
                                            }
                                        }
                                        
                                        // Scheduled Time
                                        if let scheduledTime = entities.scheduledTime {
                                            HStack(spacing: AppSpacing.sm) {
                                                Image(systemName: "clock.fill")
                                                    .font(.system(size: 18))
                                                    .foregroundColor(AppColors.accentOrange)
                                                
                                                Text("Scheduled:")
                                                    .font(AppTypography.body(.medium))
                                                    .foregroundColor(AppColors.brandTextSecondary)
                                                
                                                Text(scheduledTime, style: .time)
                                                    .font(AppTypography.body(.semibold))
                                                    .foregroundColor(AppColors.brandTextPrimary)
                                                
                                                Spacer()
                                            }
                                        }
                                    }
                                }
                                
                                // Show intent badge
                                HStack {
                                    Spacer()
                                    
                                    Text(result.intent.replacingOccurrences(of: "_", with: " ").capitalized)
                                        .font(AppTypography.caption1(.semibold))
                                        .foregroundColor(.white)
                                        .padding(.horizontal, AppSpacing.sm)
                                        .padding(.vertical, AppSpacing.xs)
                                        .background(AppColors.accentBlue)
                                        .cornerRadius(8)
                                }
                                
                                // Book Ride Button (if we have a suggestion or entities)
                                if result.rideSuggestion != nil || result.entities?.dropoffLocation != nil {
                                    Divider()
                                        .padding(.vertical, AppSpacing.sm)
                                    
                                    Button(action: {
                                        HapticFeedbackManager.shared.mediumImpact()
                                        viewModel.bookRide(from: result)
                                    }) {
                                        HStack(spacing: AppSpacing.sm) {
                                            Image(systemName: "car.fill")
                                                .font(.system(size: 18, weight: .semibold))
                                            
                                            Text(result.rideSuggestion != nil ? "Book This Ride" : "Get Ride Options")
                                                .font(AppTypography.headline(.semibold))
                                        }
                                        .foregroundColor(.white)
                                        .frame(maxWidth: .infinity)
                                        .frame(height: 56)
                                        .background(AppColors.gradientAccent)
                                        .cornerRadius(16)
                                        .shadow(
                                            color: AppColors.accentBlue.opacity(0.3),
                                            radius: 12,
                                            x: 0,
                                            y: 6
                                        )
                                    }
                                }
                            }
                            .padding(AppSpacing.lg)
                        }
                        .padding(.horizontal, AppSpacing.md)
                    }
                    
                    // Saved Addresses Quick Selection
                    if !viewModel.savedAddresses.isEmpty && viewModel.voiceResult == nil {
                        CardView(cornerRadius: 20, shadowRadius: 12, shadowOpacity: 0.1) {
                            VStack(alignment: .leading, spacing: AppSpacing.md) {
                                HStack {
                                    Image(systemName: "bookmark.fill")
                                        .font(.system(size: 20))
                                        .foregroundColor(AppColors.accentPurple)
                                    
                                    Text("Quick Select")
                                        .font(AppTypography.title3(.semibold))
                                        .foregroundColor(AppColors.brandTextPrimary)
                                    
                                    Spacer()
                                }
                                
                                Text("Tap an address to use it in your voice command")
                                    .font(AppTypography.footnote())
                                    .foregroundColor(AppColors.brandTextSecondary)
                                
                                Divider()
                                
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: AppSpacing.sm) {
                                        ForEach(viewModel.savedAddresses.prefix(5)) { address in
                                            SavedAddressQuickButton(
                                                address: address,
                                                onTap: {
                                                    HapticFeedbackManager.shared.lightImpact()
                                                    // Create a voice command with the saved address
                                                    let command = "Take me to \(address.name)"
                                                    viewModel.processRecognizedText(command)
                                                }
                                            )
                                        }
                                    }
                                    .padding(.vertical, AppSpacing.xs)
                                }
                            }
                            .padding(AppSpacing.md)
                        }
                        .padding(.horizontal, AppSpacing.md)
                    }
                    
                    // Start Recording Button (only show if not recording and no result yet)
                    // Use NavigationLink with binding to prevent navigation from popping
                    if !viewModel.isProcessing && viewModel.voiceResult == nil {
                        NavigationLink(
                            destination: VoiceRecordingView(viewModel: viewModel),
                            isActive: $showRecordingView
                        ) {
                            HStack(spacing: AppSpacing.sm) {
                                Image(systemName: "mic.fill")
                                    .font(.system(size: 20, weight: .semibold))
                                
                                Text("Voice Book Now")
                                    .font(AppTypography.headline(.semibold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 64)
                            .background(AppColors.gradientAccent)
                            .cornerRadius(20)
                            .shadow(
                                color: AppColors.accentBlue.opacity(0.4),
                                radius: 16,
                                x: 0,
                                y: 8
                            )
                        }
                        .padding(.horizontal, AppSpacing.md)
                        .padding(.top, AppSpacing.lg)
                    }
                    
                    // Record Again Button (if we have a result)
                    if viewModel.voiceResult != nil && !viewModel.isRecording && !viewModel.isProcessing {
                        NavigationLink(
                            destination: VoiceRecordingView(viewModel: viewModel),
                            isActive: $showRecordingView
                        ) {
                            HStack(spacing: AppSpacing.sm) {
                                Image(systemName: "mic.fill")
                                    .font(.system(size: 20, weight: .semibold))
                                
                                Text("Record Again")
                                    .font(AppTypography.headline(.semibold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 64)
                            .background(AppColors.gradientAccent)
                            .cornerRadius(20)
                            .shadow(
                                color: AppColors.accentBlue.opacity(0.4),
                                radius: 16,
                                x: 0,
                                y: 8
                            )
                        }
                        .padding(.horizontal, AppSpacing.md)
                        .padding(.top, AppSpacing.lg)
                        .onChange(of: viewModel.isRecording) { isRecording in
                            // Keep navigation active when recording starts
                            if isRecording {
                                showRecordingView = true
                            }
                        }
                    }
                    
                    // Active Ride Card (show after booking)
                    if let ride = viewModel.currentRide {
                        CardView(cornerRadius: 20, shadowRadius: 16, shadowOpacity: 0.15) {
                            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                                HStack {
                                    Image(systemName: "car.fill")
                                        .font(.system(size: 24))
                                        .foregroundColor(AppColors.accentBlue)
                                    
                                    Text("Active Ride")
                                        .font(AppTypography.title2(.bold))
                                        .foregroundColor(AppColors.brandTextPrimary)
                                    
                                    Spacer()
                                    
                                    // Status badge
                                    Text(ride.status.displayName)
                                        .font(AppTypography.caption1(.semibold))
                                        .foregroundColor(.white)
                                        .padding(.horizontal, AppSpacing.sm)
                                        .padding(.vertical, AppSpacing.xs)
                                        .background(statusColor(for: ride.status))
                                        .cornerRadius(8)
                                }
                                
                                Divider()
                                
                                // Ride details
                                VoiceBookingLocationRow(
                                    icon: "mappin.circle.fill",
                                    iconColor: AppColors.accentGreen,
                                    title: "Pickup",
                                    address: ride.pickupLocation.address
                                )
                                
                                // Waypoints (Intermediate Stops)
                                if !ride.waypoints.isEmpty {
                                    ForEach(Array(ride.waypoints.enumerated()), id: \.offset) { index, waypoint in
                                        VoiceBookingLocationRow(
                                            icon: "mappin.circle.fill",
                                            iconColor: AppColors.accentOrange,
                                            title: "Stop \(index + 1)",
                                            address: waypoint.address
                                        )
                                    }
                                }
                                
                                VoiceBookingLocationRow(
                                    icon: "mappin.circle.fill",
                                    iconColor: AppColors.error,
                                    title: "Dropoff",
                                    address: ride.dropoffLocation.address
                                )
                                
                                Divider()
                                
                                // Driver info (if assigned)
                                if let driver = viewModel.currentDriver {
                                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                                        Text("Your Driver")
                                            .font(AppTypography.headline())
                                            .foregroundColor(AppColors.brandTextPrimary)
                                        
                                        HStack(spacing: AppSpacing.md) {
                                            Circle()
                                                .fill(AppColors.accentBlue.opacity(0.2))
                                                .frame(width: 40, height: 40)
                                                .overlay(
                                                    Text(String(driver.fullName.prefix(1)))
                                                        .font(AppTypography.body(.bold))
                                                        .foregroundColor(AppColors.accentBlue)
                                                )
                                            
                                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                                Text(driver.fullName)
                                                    .font(AppTypography.body(.semibold))
                                                    .foregroundColor(AppColors.brandTextPrimary)
                                                
                                                HStack(spacing: AppSpacing.xs) {
                                                    Image(systemName: "star.fill")
                                                        .font(.system(size: 10))
                                                        .foregroundColor(AppColors.accentOrange)
                                                    Text(String(format: "%.1f", driver.rating))
                                                        .font(AppTypography.caption1())
                                                        .foregroundColor(AppColors.brandTextSecondary)
                                                }
                                            }
                                            
                                            Spacer()
                                        }
                                    }
                                    .padding(.vertical, AppSpacing.xs)
                                    
                                    Divider()
                                }
                                
                                // Ride info
                                HStack {
                                    RideDetailItem(
                                        icon: "car.fill",
                                        label: ride.rideType.rawValue.capitalized,
                                        value: ""
                                    )
                                    
                                    Spacer()
                                    
                                    RideDetailItem(
                                        icon: "mappin.circle.fill",
                                        label: formatDistance(ride.actualDistance ?? ride.estimatedDistance),
                                        value: ""
                                    )
                                    
                                    Spacer()
                                    
                                    RideDetailItem(
                                        icon: "clock.fill",
                                        label: formatDuration(ride.actualDuration ?? ride.estimatedDuration),
                                        value: ""
                                    )
                                    
                                    Spacer()
                                    
                                    RideDetailItem(
                                        icon: "dollarsign.circle.fill",
                                        label: formatPrice(ride.actualPrice ?? ride.estimatedPrice),
                                        value: ""
                                    )
                                }
                                
                                // View Details button
                                NavigationLink(destination: ActiveRideView(ride: ride)) {
                                    HStack {
                                        Text("View Ride Details")
                                            .font(AppTypography.headline(.semibold))
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                    }
                                    .foregroundColor(AppColors.accentBlue)
                                    .padding(.top, AppSpacing.sm)
                                }
                            }
                            .padding(AppSpacing.lg)
                        }
                        .padding(.horizontal, AppSpacing.md)
                    }
                    
                    Spacer(minLength: AppSpacing.xxl)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .background(AppColors.brandBackground)
        .onAppear {
            // Load active ride and saved addresses when view appears
            viewModel.loadActiveRide()
            viewModel.loadSavedAddresses()
        }
        .styledSuccessPopup(
            isPresented: $viewModel.bookingSuccess,
            title: "Ride Booked!",
            message: viewModel.bookingMessage ?? "Your ride has been booked successfully!",
            buttonTitle: "View Ride",
            action: {
                Task { @MainActor in
                    viewModel.bookingSuccess = false
                    viewModel.bookingMessage = nil
                }
            }
        )
        .styledErrorPopup(
            isPresented: $showErrorAlert,
            title: "Error",
            message: viewModel.errorMessage ?? "An error occurred",
            action: {
                Task { @MainActor in
                    viewModel.errorMessage = nil
                    showErrorAlert = false
                }
            }
        )
        .onChange(of: viewModel.errorMessage) { errorMessage in
            showErrorAlert = errorMessage != nil
        }
        .styledPopup(
            isPresented: $viewModel.showActiveRideAlert,
            type: .warning,
            title: "Active Ride Exists",
            message: viewModel.currentRide != nil
                ? "You already have an active ride from \(viewModel.currentRide!.pickupLocation.address) to \(viewModel.currentRide!.dropoffLocation.address). Please cancel it or wait for it to complete before booking a new ride. You can view your active ride below."
                : "You already have an active ride. Please cancel it or wait for it to complete before booking a new ride.",
            primaryButtonTitle: "Dismiss",
            secondaryButtonTitle: "Cancel Active Ride",
            onPrimaryAction: {
                viewModel.dismissActiveRideAlert()
            },
            onSecondaryAction: {
                viewModel.cancelActiveRideAndRetryBooking()
            }
        )
        .styledPopup(
            isPresented: $viewModel.showPaymentMethodRequiredAlert,
            type: .info,
            title: "Payment Method Required",
            message: "You need to add a payment method before booking a ride. Please add a payment method in your profile settings.",
            primaryButtonTitle: "Add Payment Method",
            secondaryButtonTitle: "Cancel",
            onPrimaryAction: {
                showPaymentMethodsView = true
            },
            onSecondaryAction: {
                Task { @MainActor in
                    viewModel.showPaymentMethodRequiredAlert = false
                }
            }
        )
        .sheet(isPresented: $showPaymentMethodsView) {
            NavigationView {
                PaymentMethodsView()
            }
        }
        .onChange(of: viewModel.isRecording) { isRecording in
            // Keep navigation active when recording starts (shared handler for both buttons)
            if isRecording {
                showRecordingView = true
            }
        }
        .onChange(of: showRecordingView) { isActive in
            // Reset voiceResult when navigating to recording view for a new recording
            if isActive && viewModel.voiceResult != nil && !viewModel.isRecording {
                // Clear previous result when starting a new recording session
                Task { @MainActor in
                    viewModel.voiceResult = nil
                    viewModel.recognizedText = ""
                    viewModel.errorMessage = nil
                }
            }
        }
    }
}

// MARK: - Supporting Views
// Note: LocationRow is now in Features/Views/Shared/LocationRow.swift
// This file uses a custom version with different styling for VoiceBookingView
private struct VoiceBookingLocationRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let address: String
    
    var body: some View {
        HStack(alignment: .top, spacing: AppSpacing.md) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(iconColor)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text(title)
                    .font(AppTypography.caption1(.semibold))
                    .foregroundColor(AppColors.brandTextSecondary)
                    .textCase(.uppercase)
                
                Text(address)
                    .font(AppTypography.body(.medium))
                    .foregroundColor(AppColors.brandTextPrimary)
            }
            
            Spacer()
        }
    }
}

struct RideDetailItem: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        VStack(spacing: AppSpacing.xs) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(AppColors.accentBlue)
            
            Text(label)
                .font(AppTypography.caption1(.medium))
                .foregroundColor(AppColors.brandTextPrimary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
}

// Helper function for status color
private func statusColor(for status: RideStatus) -> Color {
    switch status {
    case .pending:
        return AppColors.accentOrange
    case .accepted:
        return AppColors.accentBlue
    case .inProgress:
        return AppColors.accentGreen
    case .completed:
        return AppColors.success
    case .cancelled:
        return AppColors.error
    }
}

// Helper function to format distance

