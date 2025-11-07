import Foundation
import FirebaseCore

/// Firebase configuration manager for iOS native app
class FirebaseConfigManager {
    static func configure() {
        // Skip Firebase initialization if already configured
        guard FirebaseApp.app() == nil else {
            return
        }
        
        // Try to use GoogleService-Info.plist first (if available)
        // Check main bundle first, then check all bundles (for test targets)
        var plistPath: String?
        
        // Try main bundle first
        if let mainPath = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
           FileManager.default.fileExists(atPath: mainPath) {
            plistPath = mainPath
        } else {
            // Try test bundle if main bundle doesn't have it
            if let testBundle = Bundle.allBundles.first(where: { bundle in
                bundle.path(forResource: "GoogleService-Info", ofType: "plist") != nil
            }),
            let testPath = testBundle.path(forResource: "GoogleService-Info", ofType: "plist"),
            FileManager.default.fileExists(atPath: testPath) {
                plistPath = testPath
            }
        }
        
        if let plistPath = plistPath {
            // Validate that the plist has required keys
            if let plist = NSDictionary(contentsOfFile: plistPath),
               let googleAppID = plist["GOOGLE_APP_ID"] as? String,
               !googleAppID.isEmpty,
               googleAppID != "foodlens-91ccd" { // Make sure it's not just the project ID
                // Use plist-based configuration
                // Note: If App ID is for web platform, Firebase will warn but may still work
                FirebaseApp.configure()
                return
            }
        }
        
        // Fallback to manual configuration
        let config = FirebaseConfiguration.current
        
        // Create Firebase options with proper App ID format
        // Format: 1:PROJECT_NUMBER:ios:APP_ID (for iOS) or web:APP_ID (for web)
        let googleAppID: String
        if config.appID.hasPrefix("1:") {
            // User provided App ID (could be web or ios)
            googleAppID = config.appID
            // If it's a web App ID, Firebase iOS SDK will warn but may still work for some features
            if googleAppID.contains(":web:") {
                print("⚠️ Warning: Using web App ID for iOS app. Some Firebase features may not work.")
                print("⚠️ Consider adding an iOS app to Firebase project for full functionality.")
            }
        } else {
            // Construct a valid App ID format
            // Note: This is a fallback - actual App ID should come from Firebase Console
            googleAppID = "1:\(config.messagingSenderID):ios:\(config.projectID)"
        }
        
        let options = FirebaseOptions(
            googleAppID: googleAppID,
            gcmSenderID: config.messagingSenderID
        )
        options.apiKey = config.apiKey
        options.projectID = config.projectID
        options.storageBucket = config.storageBucket
        // Note: authDomain is web-only, not available in iOS SDK
        
        // Configure Firebase
        // Note: FirebaseApp.configure() doesn't throw, but may log warnings
        // If configuration fails, it will be caught during runtime
        FirebaseApp.configure(options: options)
    }
}

