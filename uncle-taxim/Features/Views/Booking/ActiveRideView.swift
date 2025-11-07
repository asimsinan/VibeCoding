import SwiftUI
import MapKit

struct ActiveRideView: View {
    let ride: Ride?
    @StateObject private var viewModel = BookingViewModel()
    @State private var driver: Driver?
    @State private var isLoadingDriver = false
    @State private var driverLoadAttempts = 0
    private let maxDriverLoadAttempts = 3
    
    init(ride: Ride? = nil) {
        self.ride = ride
    }
    
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
        ScrollView(.vertical) {
            VStack(spacing: AppSpacing.lg) {
                // Use viewModel.currentRide if available (it gets updated), otherwise use passed ride
                let displayRide = viewModel.currentRide ?? ride
                if let ride = displayRide {
                    // Map View - Always show if we have a ride
                    CardView(cornerRadius: 0, shadowRadius: 0) {
                        RideMapView(
                            pickupLocation: ride.pickupLocation,
                            dropoffLocation: ride.dropoffLocation,
                            waypoints: ride.waypoints
                        )
                        .frame(height: 300)
                        .cornerRadius(16)
                    }
                    .padding(.horizontal, AppSpacing.md)
                    
                    // Ride Details Card
                    CardView {
                        VStack(alignment: .leading, spacing: AppSpacing.md) {
                            Text("Ride Details")
                                .font(AppTypography.title2())
                            
                            // Status badge
                            HStack {
                                Text("Status:")
                                    .font(AppTypography.body(.medium))
                                    .foregroundColor(AppColors.brandTextSecondary)
                                
                                Text(ride.status.displayName)
                                    .font(AppTypography.body(.semibold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, AppSpacing.sm)
                                    .padding(.vertical, AppSpacing.xs)
                                    .background(statusColor(for: ride.status))
                                    .cornerRadius(8)
                                
                                Spacer()
                            }
                            
                            Divider()
                            
                            // Pickup Location
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
                            
                            // Dropoff Location
                            LocationRow(
                                icon: "mappin.circle.fill",
                                iconColor: AppColors.error,
                                title: "Dropoff",
                                address: ride.dropoffLocation.address
                            )
                            
                            Divider()
                            
                            // Ride Info
                            HStack {
                                VStack(alignment: .leading) {
                                    Text("Price")
                                        .font(AppTypography.caption1())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                    Text(formatPrice(ride.actualPrice ?? ride.estimatedPrice))
                                        .font(AppTypography.headline())
                                }
                                
                                Spacer()
                                
                                VStack(alignment: .leading) {
                                    Text("Distance")
                                        .font(AppTypography.caption1())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                    Text(formatDistance(ride.actualDistance ?? ride.estimatedDistance))
                                        .font(AppTypography.headline())
                                }
                                
                                Spacer()
                                
                                VStack(alignment: .leading) {
                                    Text("Duration")
                                        .font(AppTypography.caption1())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                    Text(formatDuration(ride.actualDuration ?? ride.estimatedDuration))
                                        .font(AppTypography.headline())
                                }
                                
                                Spacer()
                                
                                VStack(alignment: .leading) {
                                    Text("Type")
                                        .font(AppTypography.caption1())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                    Text(ride.rideType.rawValue.capitalized)
                                        .font(AppTypography.headline())
                                }
                            }
                        }
                        .padding(AppSpacing.lg)
                    }
                    .padding(.horizontal, AppSpacing.md)
                    
                    // Driver information
                    // Use the current ride from viewModel if available, otherwise use the passed ride
                    let currentRide = viewModel.currentRide ?? ride
                    if let driverId = currentRide.driverId {
                        CardView {
                            VStack(alignment: .leading, spacing: AppSpacing.md) {
                                // Use cached driver name if available, otherwise try to load full driver info
                                if let cachedDriverName = currentRide.driverName, !cachedDriverName.isEmpty {
                                    // Driver name is cached - show it directly
                                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                                        Text("Your Driver")
                                            .font(AppTypography.headline())
                                            .foregroundColor(AppColors.brandTextPrimary)
                                        
                                        HStack(spacing: AppSpacing.md) {
                                            // Driver avatar placeholder
                                            Circle()
                                                .fill(AppColors.accentBlue.opacity(0.2))
                                                .frame(width: 50, height: 50)
                                                .overlay(
                                                    Text(String(cachedDriverName.prefix(1)))
                                                        .font(AppTypography.title3(.bold))
                                                        .foregroundColor(AppColors.accentBlue)
                                                )
                                            
                                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                                Text(cachedDriverName)
                                                    .font(AppTypography.body(.semibold))
                                                    .foregroundColor(AppColors.brandTextPrimary)
                                            }
                                            
                                            Spacer()
                                        }
                                    }
                                } else if isLoadingDriver {
                                    HStack {
                                        LoadingIndicator(size: 20)
                                        Text("Loading driver info...")
                                            .font(AppTypography.body())
                                            .foregroundColor(AppColors.brandTextSecondary)
                                    }
                                } else if let driver = driver {
                                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                                        Text("Your Driver")
                                            .font(AppTypography.headline())
                                            .foregroundColor(AppColors.brandTextPrimary)
                                        
                                        HStack(spacing: AppSpacing.md) {
                                            // Driver avatar placeholder
                                            Circle()
                                                .fill(AppColors.accentBlue.opacity(0.2))
                                                .frame(width: 50, height: 50)
                                                .overlay(
                                                    Text(String(driver.fullName.prefix(1)))
                                                        .font(AppTypography.title3(.bold))
                                                        .foregroundColor(AppColors.accentBlue)
                                                )
                                            
                                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                                Text(driver.fullName)
                                                    .font(AppTypography.body(.semibold))
                                                    .foregroundColor(AppColors.brandTextPrimary)
                                                
                                                // Rating
                                                HStack(spacing: AppSpacing.xs) {
                                                    Image(systemName: "star.fill")
                                                        .font(.system(size: 12))
                                                        .foregroundColor(AppColors.accentOrange)
                                                    Text(String(format: "%.1f", driver.rating))
                                                        .font(AppTypography.caption1())
                                                        .foregroundColor(AppColors.brandTextSecondary)
                                                    Text("• \(driver.totalRides) rides")
                                                        .font(AppTypography.caption1())
                                                        .foregroundColor(AppColors.brandTextSecondary)
                                                }
                                                
                                                // Vehicle info
                                                Text("\(driver.vehicleInfo.make) \(driver.vehicleInfo.model) • \(driver.vehicleInfo.color)")
                                                    .font(AppTypography.caption1())
                                                    .foregroundColor(AppColors.brandTextSecondary)
                                            }
                                            
                                            Spacer()
                                        }
                                    }
                                } else {
                                    // Driver is assigned but info hasn't loaded yet or couldn't be loaded
                                    if driverLoadAttempts >= maxDriverLoadAttempts {
                                        // Max attempts reached - show fallback with driver ID
                                        VStack(alignment: .leading, spacing: AppSpacing.sm) {
                                            Text("Your Driver")
                                                .font(AppTypography.headline())
                                                .foregroundColor(AppColors.brandTextPrimary)
                                            
                                            HStack(spacing: AppSpacing.md) {
                                                // Driver avatar placeholder
                                                Circle()
                                                    .fill(AppColors.accentBlue.opacity(0.2))
                                                    .frame(width: 50, height: 50)
                                                    .overlay(
                                                        Image(systemName: "person.fill")
                                                            .font(.system(size: 20))
                                                            .foregroundColor(AppColors.accentBlue)
                                                    )
                                                
                                                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                                    Text("Driver Assigned")
                                                        .font(AppTypography.body(.semibold))
                                                        .foregroundColor(AppColors.brandTextPrimary)
                                                    
                                                    Text("Driver details will be available soon")
                                                        .font(AppTypography.caption1())
                                                        .foregroundColor(AppColors.brandTextSecondary)
                                                }
                                                
                                                Spacer()
                                            }
                                        }
                                    } else {
                                        // Still loading or retrying
                                        HStack {
                                            LoadingIndicator(size: 16)
                                            Text("Loading driver information...")
                                                .font(AppTypography.body())
                                                .foregroundColor(AppColors.brandTextSecondary)
                                        }
                                    }
                                }
                            }
                            .padding(AppSpacing.lg)
                        }
                        .padding(.horizontal, AppSpacing.md)
                    } else {
                        CardView {
                            HStack {
                                Image(systemName: "clock.fill")
                                    .font(.system(size: 14))
                                    .foregroundColor(AppColors.accentOrange)
                                Text("Waiting for driver assignment...")
                                    .font(AppTypography.body())
                                    .foregroundColor(AppColors.brandTextSecondary)
                            }
                            .padding(AppSpacing.lg)
                        }
                        .padding(.horizontal, AppSpacing.md)
                    }
                    
                    // Track Ride Button
                    NavigationLink(destination: RideTrackingView(ride: ride)) {
                        HStack {
                            Spacer()
                            Text("Track Ride")
                                .font(AppTypography.headline(.semibold))
                                .foregroundColor(.white)
                            Spacer()
                        }
                        .padding()
                        .background(AppColors.accentBlue)
                        .cornerRadius(12)
                    }
                    .padding(.horizontal, AppSpacing.md)
                    .padding(.top, AppSpacing.sm)
                    
                } else {
                    VStack(spacing: AppSpacing.md) {
                        Image(systemName: "car.fill")
                            .font(.system(size: 60))
                            .foregroundColor(AppColors.brandTextSecondary.opacity(0.5))
                        
                        Text("No Active Ride")
                            .font(AppTypography.title2())
                            .foregroundColor(AppColors.brandTextPrimary)
                        
                        Text("Book a ride to see it here")
                            .font(AppTypography.body())
                            .foregroundColor(AppColors.brandTextSecondary)
                    }
                    .padding()
                }
            }
            .padding(.vertical, AppSpacing.md)
        }
        .navigationTitle("Active Ride")
        .onAppear {
            loadDriverInfo()
        }
    }
    
    private func loadDriverInfo() {
        let currentRide = viewModel.currentRide ?? ride
        guard let ride = currentRide,
              let driverId = ride.driverId,
              // Only load if driverName is not already cached
              (ride.driverName == nil || ride.driverName?.isEmpty == true),
              driver == nil && !isLoadingDriver && driverLoadAttempts < maxDriverLoadAttempts else {
            // If driverName is cached, we don't need to load
            if let ride = currentRide, let driverName = ride.driverName, !driverName.isEmpty {
                print("✅ [DEBUG] ActiveRideView - Using cached driver name: \(driverName)")
            }
            return
        }
        
        isLoadingDriver = true
        driverLoadAttempts += 1
        
        Task {
            do {
                let dataService = FirebaseDataService()
                let fetchedDriver = try await dataService.getDriver(driverId: driverId)
                
                await MainActor.run {
                    if let fetchedDriver = fetchedDriver {
                        self.driver = fetchedDriver
                        self.isLoadingDriver = false
                        print("✅ [DEBUG] ActiveRideView - Driver loaded successfully: \(fetchedDriver.fullName)")
                    } else {
                        // Driver not found - stop trying immediately
                        print("⚠️ [DEBUG] ActiveRideView - Driver document not found in Firestore: \(driverId)")
                        print("   This may happen if the driver profile hasn't been created yet.")
                        self.isLoadingDriver = false
                        // Don't retry if driver doesn't exist - it won't appear
                    }
                }
            } catch {
                print("⚠️ [DEBUG] ActiveRideView - Failed to load driver (attempt \(driverLoadAttempts)/\(maxDriverLoadAttempts)): \(error)")
                
                await MainActor.run {
                    self.isLoadingDriver = false
                    
                    // Only retry for network errors, not for "not found" errors
                    if self.driverLoadAttempts < self.maxDriverLoadAttempts {
                        // Check if it's a "not found" error - don't retry those
                        let errorString = error.localizedDescription.lowercased()
                        if errorString.contains("not found") || errorString.contains("does not exist") {
                            print("❌ [DEBUG] ActiveRideView - Driver document doesn't exist. Stopping retries.")
                            return
                        }
                        
                        // Retry after 2 seconds for other errors
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                            self.loadDriverInfo()
                        }
                    } else {
                        print("❌ [DEBUG] ActiveRideView - Max driver load attempts reached. Giving up.")
                    }
                }
            }
        }
    }
    
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
}

