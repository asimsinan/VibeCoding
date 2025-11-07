import SwiftUI
import MapKit
import CoreLocation

struct TripSummaryMapView: UIViewRepresentable {
    let pickupAddress: String
    let dropoffAddress: String
    let routePoints: [RoutePoint]
    
    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        context.coordinator.mapView = mapView
        
        mapView.showsUserLocation = false
        mapView.showsCompass = true
        mapView.showsScale = true
        mapView.mapType = .standard
        
        updateMapView(mapView, context: context)
        
        return mapView
    }
    
    func updateUIView(_ mapView: MKMapView, context: Context) {
        if mapView.delegate == nil {
            mapView.delegate = context.coordinator
            context.coordinator.mapView = mapView
        }
        updateMapView(mapView, context: context)
    }
    
    private func updateMapView(_ mapView: MKMapView, context: Context) {
        // Clear existing annotations and overlays
        mapView.removeAnnotations(mapView.annotations)
        mapView.removeOverlays(mapView.overlays)
        
        // If we have route points, use them to draw the route
        if !routePoints.isEmpty {
            let coordinates = routePoints.map { point in
                CLLocationCoordinate2D(latitude: point.latitude, longitude: point.longitude)
            }
            
            // Add polyline for the route
            let polyline = MKPolyline(coordinates: coordinates, count: coordinates.count)
            mapView.addOverlay(polyline)
            
            // Add pickup and dropoff annotations
            if let firstPoint = routePoints.first {
                let pickupAnnotation = MKPointAnnotation()
                pickupAnnotation.coordinate = CLLocationCoordinate2D(
                    latitude: firstPoint.latitude,
                    longitude: firstPoint.longitude
                )
                pickupAnnotation.title = "Pickup"
                pickupAnnotation.subtitle = pickupAddress
                mapView.addAnnotation(pickupAnnotation)
            }
            
            if let lastPoint = routePoints.last {
                let dropoffAnnotation = MKPointAnnotation()
                dropoffAnnotation.coordinate = CLLocationCoordinate2D(
                    latitude: lastPoint.latitude,
                    longitude: lastPoint.longitude
                )
                dropoffAnnotation.title = "Dropoff"
                dropoffAnnotation.subtitle = dropoffAddress
                mapView.addAnnotation(dropoffAnnotation)
            }
            
            // Fit map to show entire route with padding
            let boundingRect = boundingMapRectForCoordinates(coordinates)
            let padding = UIEdgeInsets(top: 50, left: 50, bottom: 50, right: 50)
            mapView.setVisibleMapRect(boundingRect, edgePadding: padding, animated: false)
        } else {
            // No route points: Try to geocode addresses and calculate route
            Task {
                await geocodeAndShowRoute(mapView: mapView)
            }
        }
    }
    
    private func addAnnotationsForCoordinates(
        mapView: MKMapView,
        pickup: CLLocationCoordinate2D,
        dropoff: CLLocationCoordinate2D
    ) {
        let pickupAnnotation = MKPointAnnotation()
        pickupAnnotation.coordinate = pickup
        pickupAnnotation.title = "Pickup"
        pickupAnnotation.subtitle = pickupAddress
        mapView.addAnnotation(pickupAnnotation)
        
        let dropoffAnnotation = MKPointAnnotation()
        dropoffAnnotation.coordinate = dropoff
        dropoffAnnotation.title = "Dropoff"
        dropoffAnnotation.subtitle = dropoffAddress
        mapView.addAnnotation(dropoffAnnotation)
        
        // Set region to show both points
        let region = regionForCoordinates([pickup, dropoff])
        mapView.setRegion(region, animated: false)
    }
    
    private func regionForCoordinates(_ coordinates: [CLLocationCoordinate2D]) -> MKCoordinateRegion {
        guard !coordinates.isEmpty else {
            return MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: 0, longitude: 0),
                span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
            )
        }
        
        let latitudes = coordinates.map { $0.latitude }
        let longitudes = coordinates.map { $0.longitude }
        
        let minLat = latitudes.min()!
        let maxLat = latitudes.max()!
        let minLon = longitudes.min()!
        let maxLon = longitudes.max()!
        
        let centerLat = (minLat + maxLat) / 2
        let centerLon = (minLon + maxLon) / 2
        let latDelta = max((maxLat - minLat) * 1.5, 0.01)
        let lonDelta = max((maxLon - minLon) * 1.5, 0.01)
        
        return MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: centerLat, longitude: centerLon),
            span: MKCoordinateSpan(latitudeDelta: latDelta, longitudeDelta: lonDelta)
        )
    }
    
    private func boundingMapRectForCoordinates(_ coordinates: [CLLocationCoordinate2D]) -> MKMapRect {
        guard !coordinates.isEmpty else {
            return MKMapRect.world
        }
        
        var minX = Double.infinity
        var minY = Double.infinity
        var maxX = -Double.infinity
        var maxY = -Double.infinity
        
        for coordinate in coordinates {
            let point = MKMapPoint(coordinate)
            minX = min(minX, point.x)
            minY = min(minY, point.y)
            maxX = max(maxX, point.x)
            maxY = max(maxY, point.y)
        }
        
        return MKMapRect(
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        )
    }
    
    private func calculateRoute(
        mapView: MKMapView,
        pickup: CLLocationCoordinate2D,
        dropoff: CLLocationCoordinate2D
    ) async {
        let pickupPlacemark = MKPlacemark(coordinate: pickup)
        let pickupMapItem = MKMapItem(placemark: pickupPlacemark)
        pickupMapItem.name = pickupAddress
        
        let dropoffPlacemark = MKPlacemark(coordinate: dropoff)
        let dropoffMapItem = MKMapItem(placemark: dropoffPlacemark)
        dropoffMapItem.name = dropoffAddress
        
        let directionsRequest = MKDirections.Request()
        directionsRequest.source = pickupMapItem
        directionsRequest.destination = dropoffMapItem
        directionsRequest.transportType = .automobile
        
        let directions = MKDirections(request: directionsRequest)
        
        do {
            let response = try await directions.calculate()
            guard let route = response.routes.first else { return }
            
            await MainActor.run {
                mapView.addOverlay(route.polyline)
                
                // Fit map to show entire route with padding
                let rect = route.polyline.boundingMapRect
                let padding = UIEdgeInsets(top: 50, left: 50, bottom: 50, right: 50)
                mapView.setVisibleMapRect(rect, edgePadding: padding, animated: false)
            }
        } catch {
            // Route calculation failed - annotations are already added
        }
    }
    
    private func geocodeAndShowRoute(mapView: MKMapView) async {
        let geocoder = CLGeocoder()
        
        do {
            let pickupPlacemarks = try await geocoder.geocodeAddressString(pickupAddress)
            let dropoffPlacemarks = try await geocoder.geocodeAddressString(dropoffAddress)
            
            guard let pickupPlacemark = pickupPlacemarks.first,
                  let dropoffPlacemark = dropoffPlacemarks.first else {
                return
            }
            
            let pickupCoord = pickupPlacemark.location?.coordinate
            let dropoffCoord = dropoffPlacemark.location?.coordinate
            
            guard let pickup = pickupCoord, let dropoff = dropoffCoord else {
                return
            }
            
            await MainActor.run {
                addAnnotationsForCoordinates(
                    mapView: mapView,
                    pickup: pickup,
                    dropoff: dropoff
                )
            }
            
            await calculateRoute(mapView: mapView, pickup: pickup, dropoff: dropoff)
        } catch {
            // Geocoding failed
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }
    
    class Coordinator: NSObject, MKMapViewDelegate {
        var mapView: MKMapView?
        
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let polyline = overlay as? MKPolyline {
                let renderer = MKPolylineRenderer(polyline: polyline)
                renderer.strokeColor = AppColors.accentBlue.uiColor
                renderer.lineWidth = 4.0
                renderer.lineCap = .round
                renderer.lineJoin = .round
                return renderer
            }
            return MKOverlayRenderer(overlay: overlay)
        }
        
        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            guard !(annotation is MKUserLocation) else { return nil }
            
            let identifier = "TripPoint"
            var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: identifier)
            
            if annotationView == nil {
                annotationView = MKMarkerAnnotationView(annotation: annotation, reuseIdentifier: identifier)
                annotationView?.canShowCallout = true
            } else {
                annotationView?.annotation = annotation
            }
            
            if let markerView = annotationView as? MKMarkerAnnotationView {
                if annotation.title == "Pickup" {
                    markerView.markerTintColor = AppColors.success.uiColor
                } else if annotation.title == "Dropoff" {
                    markerView.markerTintColor = AppColors.error.uiColor
                } else {
                    markerView.markerTintColor = AppColors.accentBlue.uiColor
                }
            }
            
            return annotationView
        }
    }
}

