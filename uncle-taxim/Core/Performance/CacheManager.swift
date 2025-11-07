import Foundation
import UIKit

class CacheManager {
    static let shared = CacheManager()
    
    private let imageCache = NSCache<NSString, UIImage>()
    private let dataCache = NSCache<NSString, NSData>()
    
    private init() {
        // Configure image cache
        imageCache.countLimit = 100
        imageCache.totalCostLimit = 50 * 1024 * 1024 // 50MB limit
        
        // Configure data cache
        dataCache.countLimit = 50
        dataCache.totalCostLimit = 10 * 1024 * 1024 // 10MB limit
    }
    
    /// Cache image with key
    func cacheImage(_ image: UIImage, forKey key: String) {
        imageCache.setObject(image, forKey: key as NSString)
    }
    
    /// Retrieve cached image
    func getImage(forKey key: String) -> UIImage? {
        return imageCache.object(forKey: key as NSString)
    }
    
    /// Cache data with key
    func cacheData(_ data: Data, forKey key: String) {
        dataCache.setObject(data as NSData, forKey: key as NSString)
    }
    
    /// Retrieve cached data
    func getData(forKey key: String) -> Data? {
        return dataCache.object(forKey: key as NSString) as Data?
    }
    
    /// Clear all caches
    func clearCache() {
        imageCache.removeAllObjects()
        dataCache.removeAllObjects()
    }
}

