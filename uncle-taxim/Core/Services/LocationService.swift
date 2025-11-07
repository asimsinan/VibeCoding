import Foundation
import MapKit
import CoreLocation

/// Service for geocoding addresses and calculating real routes using MapKit
class LocationService: NSObject {
    
    private let geocoder = CLGeocoder()
    private let locationManager = CLLocationManager()
    private var currentLocationContinuation: CheckedContinuation<LocationWithAddress?, Error>?
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }
    
    /// Geocodes an address string to coordinates
    /// - Parameter address: Address string to geocode
    /// - Returns: LocationWithAddress with coordinates, or nil if geocoding fails
    func geocodeAddress(_ address: String) async throws -> LocationWithAddress? {
        // Clean up the address - remove duplicate parts and normalize
        let cleanedAddress = cleanAddress(address)
        
        // Try geocoding with the cleaned address
        do {
            let placemarks = try await geocoder.geocodeAddressString(cleanedAddress)
            
            if let placemark = placemarks.first,
               let location = placemark.location {
                let coordinate = location.coordinate
                
                // Build full address string from placemark
                var fullAddress = cleanedAddress
                if let name = placemark.name,
                   let thoroughfare = placemark.thoroughfare,
                   let locality = placemark.locality {
                    fullAddress = "\(name), \(thoroughfare), \(locality)"
                } else if let thoroughfare = placemark.thoroughfare,
                          let locality = placemark.locality {
                    fullAddress = "\(thoroughfare), \(locality)"
                } else if let thoroughfare = placemark.thoroughfare {
                    fullAddress = thoroughfare
                }
                
                return LocationWithAddress(
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                    address: fullAddress
                )
            }
        } catch {
            // If geocoding fails, try with just the city/locality part
            if let cityPart = extractCityFromAddress(cleanedAddress) {
                do {
                    let placemarks = try await geocoder.geocodeAddressString(cityPart)
                    if let placemark = placemarks.first,
                       let location = placemark.location {
                        let coordinate = location.coordinate
                        return LocationWithAddress(
                            latitude: coordinate.latitude,
                            longitude: coordinate.longitude,
                            address: cityPart
                        )
                    }
                } catch {
                    // If city geocoding also fails, return nil
                }
            }
            // Re-throw the original error if all attempts fail
            throw error
        }
        
        return nil
    }
    
    /// Cleans up address string by removing duplicates and normalizing
    private func cleanAddress(_ address: String) -> String {
        // Split by comma and remove duplicates
        let parts = address.components(separatedBy: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        
        // Remove consecutive duplicates
        var cleanedParts: [String] = []
        var lastPart: String?
        for part in parts {
            if part != lastPart {
                cleanedParts.append(part)
                lastPart = part
            }
        }
        
        return cleanedParts.joined(separator: ", ")
    }
    
    /// Extracts city/locality part from address string
    private func extractCityFromAddress(_ address: String) -> String? {
        // Try to find common city indicators
        let parts = address.components(separatedBy: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        
        // Usually the last part is the city
        if let lastPart = parts.last,
           !lastPart.isEmpty {
            return lastPart
        }
        
        return nil
    }
    
    /// Calculates real route distance and travel time between locations with optional waypoints using MapKit
    /// - Parameters:
    ///   - pickup: Pickup location
    ///   - dropoff: Dropoff location
    ///   - waypoints: Optional intermediate stops (in order)
    /// - Returns: Tuple of (distance in km, estimated travel time in minutes), or nil if calculation fails
    func calculateRoute(pickup: LocationWithAddress, dropoff: LocationWithAddress, waypoints: [LocationWithAddress] = []) async throws -> (distance: Double, duration: Int)? {
        
        // Create MKMapItem for pickup
        let pickupPlacemark = MKPlacemark(coordinate: CLLocationCoordinate2D(
            latitude: pickup.latitude,
            longitude: pickup.longitude
        ))
        let pickupMapItem = MKMapItem(placemark: pickupPlacemark)
        pickupMapItem.name = pickup.address
        
        // Create MKMapItem for dropoff
        let dropoffPlacemark = MKPlacemark(coordinate: CLLocationCoordinate2D(
            latitude: dropoff.latitude,
            longitude: dropoff.longitude
        ))
        let dropoffMapItem = MKMapItem(placemark: dropoffPlacemark)
        dropoffMapItem.name = dropoff.address
        
        // Create MKMapItems for waypoints
        let waypointMapItems = waypoints.map { waypoint in
            let waypointPlacemark = MKPlacemark(coordinate: CLLocationCoordinate2D(
                latitude: waypoint.latitude,
                longitude: waypoint.longitude
            ))
            let waypointMapItem = MKMapItem(placemark: waypointPlacemark)
            waypointMapItem.name = waypoint.address
            return waypointMapItem
        }
        
        // Calculate route with waypoints by calculating each segment sequentially
        // MapKit doesn't support waypoints directly, so we calculate each leg separately
        var totalDistance: Double = 0.0
        var totalDuration: TimeInterval = 0.0
        
        // Create a sequence of stops: pickup -> waypoints -> dropoff
        let allStops = [pickupMapItem] + waypointMapItems + [dropoffMapItem]
        
        // Calculate route for each segment
        for i in 0..<(allStops.count - 1) {
            let source = allStops[i]
            let destination = allStops[i + 1]
            
            let directionsRequest = MKDirections.Request()
            directionsRequest.source = source
            directionsRequest.destination = destination
            directionsRequest.transportType = .automobile
            
            let directions = MKDirections(request: directionsRequest)
            
            do {
                let response = try await directions.calculate()
                
                guard let route = response.routes.first else {
                    // If any segment fails, return nil
                    return nil
                }
                
                totalDistance += route.distance
                totalDuration += route.expectedTravelTime
            } catch {
                // If any segment fails, return nil
                return nil
            }
        }
        
        // Convert to kilometers and minutes
        let distanceKm = totalDistance / 1000.0
        let durationMinutes = Int(ceil(totalDuration / 60.0))
        
        print("🔍 [DEBUG] LocationService - Route calculated:")
        print("   - Total segments: \(allStops.count - 1)")
        print("   - Waypoints: \(waypoints.count)")
        print("   - Total distance: \(String(format: "%.2f", distanceKm)) km")
        print("   - Total duration: \(durationMinutes) minutes")
        
        return (distance: distanceKm, duration: durationMinutes)
    }
    
    /// Geocodes addresses and calculates route in one call (with optional waypoints)
    /// - Parameters:
    ///   - pickupAddress: Pickup address string
    ///   - dropoffAddress: Dropoff address string
    ///   - waypointAddresses: Optional array of intermediate stop addresses
    /// - Returns: Tuple of (distance in km, estimated travel time in minutes, pickup location, dropoff location, waypoints), or nil if any step fails
    func geocodeAndCalculateRoute(pickupAddress: String?, dropoffAddress: String, waypointAddresses: [String] = []) async throws -> (distance: Double, duration: Int, pickup: LocationWithAddress, dropoff: LocationWithAddress, waypoints: [LocationWithAddress])? {
        // Use current location if pickup is not provided
        let pickupAddr = pickupAddress ?? "Current Location"
        
        // Geocode all addresses
        var pickupLocation: LocationWithAddress?
        var dropoffLocation: LocationWithAddress?
        var waypointLocations: [LocationWithAddress] = []
        
        // If pickup is "Current Location", get user's current GPS location
        if pickupAddr.lowercased() == "current location" || pickupAddr.lowercased() == "my location" || pickupAddr.isEmpty {
            print("🔍 [DEBUG] LocationService - Pickup is Current Location, getting GPS coordinates...")
            pickupLocation = try await getCurrentLocation()
            if pickupLocation == nil {
                print("❌ [ERROR] LocationService - Could not get current location")
                throw NSError(domain: "LocationService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Could not get current location. Please enable location services."])
            }
            print("✅ [DEBUG] LocationService - Got current location: \(pickupLocation?.address ?? "unknown") at (\(pickupLocation?.latitude ?? 0), \(pickupLocation?.longitude ?? 0))")
        } else {
            pickupLocation = try await geocodeAddress(pickupAddr)
        }
        
        dropoffLocation = try await geocodeAddress(dropoffAddress)
        
        // Geocode waypoints
        for waypointAddress in waypointAddresses {
            if let waypointLocation = try? await geocodeAddress(waypointAddress) {
                waypointLocations.append(waypointLocation)
            }
        }
        
        guard let pickup = pickupLocation,
              let dropoff = dropoffLocation else {
            print("❌ [ERROR] LocationService - Failed to geocode locations. Pickup: \(pickupLocation != nil), Dropoff: \(dropoffLocation != nil)")
            return nil
        }
        
        print("🔍 [DEBUG] LocationService - Calculating route:")
        print("   - Pickup: \(pickup.address) at (\(pickup.latitude), \(pickup.longitude))")
        print("   - Dropoff: \(dropoff.address) at (\(dropoff.latitude), \(dropoff.longitude))")
        print("   - Waypoints: \(waypointLocations.count)")
        
        // Calculate route with waypoints
        guard let route = try await calculateRoute(pickup: pickup, dropoff: dropoff, waypoints: waypointLocations) else {
            print("❌ [ERROR] LocationService - Route calculation failed")
            return nil
        }
        
        print("✅ [DEBUG] LocationService - Route calculated successfully:")
        print("   - Distance: \(String(format: "%.2f", route.distance)) km")
        print("   - Duration: \(route.duration) minutes")
        
        return (
            distance: route.distance,
            duration: route.duration,
            pickup: pickup,
            dropoff: dropoff,
            waypoints: waypointLocations
        )
    }
    
    /// Gets the user's current GPS location
    /// - Returns: LocationWithAddress with current coordinates, or nil if location cannot be determined
    func getCurrentLocation() async throws -> LocationWithAddress? {
        // Check authorization status
        var status = locationManager.authorizationStatus
        
        // Request authorization if not determined
        if status == .notDetermined {
            locationManager.requestWhenInUseAuthorization()
            // Wait a bit for authorization
            try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
            status = locationManager.authorizationStatus
        }
        
        // Check if we have authorization
        guard status == .authorizedWhenInUse || status == .authorizedAlways else {
            return nil
        }
        
        // Check if location services are enabled
        guard CLLocationManager.locationServicesEnabled() else {
            return nil
        }
        
        // Request one-time location update
        return try await withCheckedThrowingContinuation { continuation in
            self.currentLocationContinuation = continuation
            
            // Set a timeout
            let timeoutTask = Task {
                try? await Task.sleep(nanoseconds: 10_000_000_000) // 10 seconds
                if let cont = self.currentLocationContinuation {
                    self.currentLocationContinuation = nil
                    cont.resume(returning: nil)
                }
            }
            
            // Store timeout task to cancel if location arrives early
            locationManager.requestLocation()
            
            // Note: We can't easily cancel the timeout task from here,
            // but the continuation check prevents double-resume
        }
    }
}

// MARK: - CLLocationManagerDelegate
extension LocationService: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.first else {
            return
        }
        
        // Safely get and clear continuation to prevent double-resume
        guard let continuation = currentLocationContinuation else {
            return
        }
        currentLocationContinuation = nil
        
        // Reverse geocode to get address
        Task {
            do {
                let placemarks = try await geocoder.reverseGeocodeLocation(location)
                let placemark = placemarks.first
                
                var address = "Current Location"
                if let placemark = placemark {
                    var addressComponents: [String] = []
                    if let name = placemark.name {
                        addressComponents.append(name)
                    }
                    if let thoroughfare = placemark.thoroughfare {
                        addressComponents.append(thoroughfare)
                    }
                    if let locality = placemark.locality {
                        addressComponents.append(locality)
                    }
                    if !addressComponents.isEmpty {
                        address = addressComponents.joined(separator: ", ")
                    }
                }
                
                let locationWithAddress = LocationWithAddress(
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude,
                    address: address
                )
                
                continuation.resume(returning: locationWithAddress)
            } catch {
                // If reverse geocoding fails, still return the location with coordinates
                let locationWithAddress = LocationWithAddress(
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude,
                    address: "Current Location"
                )
                continuation.resume(returning: locationWithAddress)
            }
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Safely get and clear continuation to prevent double-resume
        guard let continuation = currentLocationContinuation else {
            return
        }
        
        currentLocationContinuation = nil
        continuation.resume(returning: nil)
    }
}

