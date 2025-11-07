import SwiftUI
import MapKit

struct RideMapView: UIViewRepresentable {
    let pickupLocation: LocationWithAddress
    let dropoffLocation: LocationWithAddress
    let waypoints: [LocationWithAddress] // Intermediate stops
    
    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        
        // Set delegate FIRST before doing anything else
        mapView.delegate = context.coordinator
        context.coordinator.mapView = mapView
        
        mapView.showsUserLocation = false
        mapView.showsCompass = true
        mapView.showsScale = true
        mapView.mapType = .standard
        
        // Set initial region to show all locations (will be updated when route is calculated)
        let allLocations = [pickupLocation] + waypoints + [dropoffLocation]
        let validLocations = allLocations.filter { isValidCoordinate($0.latitude, $0.longitude) }
        
        if validLocations.count >= 2 {
            let lats = validLocations.map { $0.latitude }
            let lons = validLocations.map { $0.longitude }
            let minLat = lats.min() ?? 0
            let maxLat = lats.max() ?? 0
            let minLon = lons.min() ?? 0
            let maxLon = lons.max() ?? 0
            
            let centerLat = (minLat + maxLat) / 2
            let centerLon = (minLon + maxLon) / 2
            let latDelta = max(abs(maxLat - minLat) * 2.5, 0.1)
            let lonDelta = max(abs(maxLon - minLon) * 2.5, 0.1)
            
            let initialRegion = MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: centerLat, longitude: centerLon),
                span: MKCoordinateSpan(
                    latitudeDelta: latDelta,
                    longitudeDelta: lonDelta
                )
            )
            mapView.setRegion(initialRegion, animated: false)
        }
        
        // Add annotations and calculate route
        updateMapView(mapView, context: context)
        
        return mapView
    }
    
    func updateUIView(_ mapView: MKMapView, context: Context) {
        // Ensure delegate is set (in case it was lost)
        if mapView.delegate == nil {
            mapView.delegate = context.coordinator
            context.coordinator.mapView = mapView
        }
        
        // Update annotations and route when locations change
        updateMapView(mapView, context: context)
    }
    
    private func updateMapView(_ mapView: MKMapView, context: Context) {
        // Validate coordinates
        guard isValidCoordinate(pickupLocation.latitude, pickupLocation.longitude),
              isValidCoordinate(dropoffLocation.latitude, dropoffLocation.longitude) else {
            return
        }
        
        // Clear existing annotations and overlays
        mapView.removeAnnotations(mapView.annotations)
        mapView.removeOverlays(mapView.overlays)
        
        // Add pickup annotation
        let pickupAnnotation = MKPointAnnotation()
        pickupAnnotation.coordinate = CLLocationCoordinate2D(
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude
        )
        pickupAnnotation.title = "Pickup"
        pickupAnnotation.subtitle = pickupLocation.address
        mapView.addAnnotation(pickupAnnotation)
        
        // Add waypoint annotations
        for (index, waypoint) in waypoints.enumerated() {
            if isValidCoordinate(waypoint.latitude, waypoint.longitude) {
                let waypointAnnotation = MKPointAnnotation()
                waypointAnnotation.coordinate = CLLocationCoordinate2D(
                    latitude: waypoint.latitude,
                    longitude: waypoint.longitude
                )
                waypointAnnotation.title = "Stop \(index + 1)"
                waypointAnnotation.subtitle = waypoint.address
                mapView.addAnnotation(waypointAnnotation)
            }
        }
        
        // Add dropoff annotation
        let dropoffAnnotation = MKPointAnnotation()
        dropoffAnnotation.coordinate = CLLocationCoordinate2D(
            latitude: dropoffLocation.latitude,
            longitude: dropoffLocation.longitude
        )
        dropoffAnnotation.title = "Dropoff"
        dropoffAnnotation.subtitle = dropoffLocation.address
        mapView.addAnnotation(dropoffAnnotation)
        
        // Calculate and display route
        Task {
            await calculateRoute(for: mapView)
        }
    }
    
    private func isValidCoordinate(_ latitude: Double, _ longitude: Double) -> Bool {
        return latitude != 0.0 && longitude != 0.0 &&
               latitude >= -90 && latitude <= 90 &&
               longitude >= -180 && longitude <= 180 &&
               !latitude.isNaN && !longitude.isNaN &&
               !latitude.isInfinite && !longitude.isInfinite
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }
    
    private func calculateRoute(for mapView: MKMapView) async {
        
        // Ensure delegate is set
        guard mapView.delegate != nil else {
            await fallbackToRegion(mapView)
            return
        }
        
        let pickupPlacemark = MKPlacemark(coordinate: CLLocationCoordinate2D(
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude
        ))
        let pickupMapItem = MKMapItem(placemark: pickupPlacemark)
        pickupMapItem.name = pickupLocation.address
        
        let dropoffPlacemark = MKPlacemark(coordinate: CLLocationCoordinate2D(
            latitude: dropoffLocation.latitude,
            longitude: dropoffLocation.longitude
        ))
        let dropoffMapItem = MKMapItem(placemark: dropoffPlacemark)
        dropoffMapItem.name = dropoffLocation.address
        
        // Create waypoint map items
        let waypointMapItems = waypoints.compactMap { waypoint -> MKMapItem? in
            guard isValidCoordinate(waypoint.latitude, waypoint.longitude) else {
                return nil
            }
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
        let allStops = [pickupMapItem] + waypointMapItems + [dropoffMapItem]
        var allPolylines: [MKPolyline] = []
        var allRects: [MKMapRect] = []
        
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
                
                guard let route = response.routes.first,
                      route.polyline.pointCount > 0 else {
                    continue // Skip this segment if it fails
                }
                
                allPolylines.append(route.polyline)
                allRects.append(route.polyline.boundingMapRect)
            } catch {
                // Continue with other segments if one fails
                continue
            }
        }
        
        // If we have at least one route segment, display them
        guard !allPolylines.isEmpty else {
            await fallbackToRegion(mapView)
            return
        }
        
        await MainActor.run {
            // Ensure delegate is still set
            guard mapView.delegate != nil else {
                return
            }
            
            // Remove any existing route overlays first
            let existingPolylines = mapView.overlays.filter { $0 is MKPolyline }
            if !existingPolylines.isEmpty {
                mapView.removeOverlays(existingPolylines)
            }
            
            // Add all route segments
            for polyline in allPolylines {
                mapView.addOverlay(polyline, level: .aboveRoads)
            }
            
            // Force map to refresh
            mapView.setNeedsDisplay()
            
            // Fit map to show all locations and routes
            if let firstRect = allRects.first {
                let combinedRect = allRects.reduce(firstRect) { $0.union($1) }
                let padding = UIEdgeInsets(top: 50, left: 50, bottom: 50, right: 50)
                mapView.setVisibleMapRect(combinedRect, edgePadding: padding, animated: true)
            }
        }
    }
    
    /// Draws a direct line between pickup and dropoff when route calculation fails
    private func drawDirectLine(_ mapView: MKMapView) async {
        await MainActor.run {
            let coordinates = [
                CLLocationCoordinate2D(
                    latitude: pickupLocation.latitude,
                    longitude: pickupLocation.longitude
                ),
                CLLocationCoordinate2D(
                    latitude: dropoffLocation.latitude,
                    longitude: dropoffLocation.longitude
                )
            ]
            
            let polyline = MKPolyline(coordinates: coordinates, count: coordinates.count)
            mapView.addOverlay(polyline, level: .aboveRoads)
        }
    }
    
    private func fallbackToRegion(_ mapView: MKMapView) async {
        await MainActor.run {
            let coordinates = [
                CLLocationCoordinate2D(
                    latitude: pickupLocation.latitude,
                    longitude: pickupLocation.longitude
                ),
                CLLocationCoordinate2D(
                    latitude: dropoffLocation.latitude,
                    longitude: dropoffLocation.longitude
                )
            ]
            
            // Calculate region that fits both points
            let minLat = min(pickupLocation.latitude, dropoffLocation.latitude)
            let maxLat = max(pickupLocation.latitude, dropoffLocation.latitude)
            let minLon = min(pickupLocation.longitude, dropoffLocation.longitude)
            let maxLon = max(pickupLocation.longitude, dropoffLocation.longitude)
            
            let centerLat = (minLat + maxLat) / 2
            let centerLon = (minLon + maxLon) / 2
            
            // Add padding to span
            let latDelta = max((maxLat - minLat) * 2.5, 0.01) // Minimum 0.01 degree
            let lonDelta = max((maxLon - minLon) * 2.5, 0.01) // Minimum 0.01 degree
            
            let region = MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: centerLat, longitude: centerLon),
                span: MKCoordinateSpan(latitudeDelta: latDelta, longitudeDelta: lonDelta)
            )
            
            mapView.setRegion(region, animated: true)
        }
    }
    
    class Coordinator: NSObject, MKMapViewDelegate {
        weak var mapView: MKMapView?
        
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            
            if let polyline = overlay as? MKPolyline {
                let renderer = MKPolylineRenderer(polyline: polyline)
                renderer.strokeColor = UIColor.systemBlue
                renderer.lineWidth = 8.0 // Increased for better visibility
                renderer.alpha = 1.0
                renderer.lineCap = .round
                renderer.lineJoin = .round
                renderer.lineDashPattern = nil // Solid line
                
                // Force the map to redraw
                DispatchQueue.main.async {
                    mapView.setNeedsDisplay()
                }
                
                return renderer
            }
            
            return MKOverlayRenderer(overlay: overlay)
        }
        
        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            // Don't customize user location annotation
            if annotation is MKUserLocation {
                return nil
            }
            
            guard let pointAnnotation = annotation as? MKPointAnnotation else {
                return nil
            }
            
            let identifier = "RideAnnotation"
            var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: identifier) as? MKMarkerAnnotationView
            
            if annotationView == nil {
                annotationView = MKMarkerAnnotationView(annotation: pointAnnotation, reuseIdentifier: identifier)
                annotationView?.canShowCallout = true
            } else {
                annotationView?.annotation = pointAnnotation
            }
            
            // Customize marker based on type
            if let markerView = annotationView {
                if pointAnnotation.title == "Pickup" {
                    markerView.markerTintColor = UIColor.systemGreen
                    markerView.glyphImage = UIImage(systemName: "mappin.circle.fill")
                } else if pointAnnotation.title == "Dropoff" {
                    markerView.markerTintColor = UIColor.systemRed
                    markerView.glyphImage = UIImage(systemName: "flag.fill")
                }
            }
            
            return annotationView
        }
    }
}

