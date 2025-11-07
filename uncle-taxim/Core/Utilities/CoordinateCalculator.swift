import Foundation

struct CoordinateCalculator {
    /// Calculates distance between two coordinates using Haversine formula
    /// - Parameters:
    ///   - from: Starting location
    ///   - to: Destination location
    /// - Returns: Distance in kilometers
    static func calculateDistance(from: LocationWithAddress, to: LocationWithAddress) -> Double {
        let lat1 = from.latitude
        let lon1 = from.longitude
        let lat2 = to.latitude
        let lon2 = to.longitude
        
        let R = 6371.0 // Earth radius in km
        let dLat = (lat2 - lat1) * .pi / 180.0
        let dLon = (lon2 - lon1) * .pi / 180.0
        
        let a = sin(dLat / 2) * sin(dLat / 2) +
                cos(lat1 * .pi / 180.0) * cos(lat2 * .pi / 180.0) *
                sin(dLon / 2) * sin(dLon / 2)
        
        let c = 2 * atan2(sqrt(a), sqrt(1 - a))
        let distance = R * c
        
        return distance
    }
}

