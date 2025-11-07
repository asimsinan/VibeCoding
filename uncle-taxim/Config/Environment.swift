import Foundation

enum Environment {
    case development
    case testing
    case production
    
    static var current: Environment {
        #if DEBUG
        return .development
        #else
        return .production
        #endif
    }
    
    var firebaseConfigFile: String {
        switch self {
        case .development:
            return "GoogleService-Info-Dev.plist"
        case .testing:
            return "GoogleService-Info-Test.plist"
        case .production:
            return "GoogleService-Info-Prod.plist"
        }
    }
    
    // MARK: - Firebase Configuration
    
    var firebaseAPIKey: String {
        // API key from GoogleService-Info.plist (iOS app)
        return "AIzaSyBU-VZL2JmLcjL_L4NC48LYJufQTlmyoyU"
    }
    
    var firebaseAuthDomain: String {
        return "foodlens-91ccd.firebaseapp.com"
    }
    
    var firebaseProjectID: String {
        return "foodlens-91ccd"
    }
    
    var firebaseStorageBucket: String {
        // Storage bucket from GoogleService-Info.plist
        return "foodlens-91ccd.firebasestorage.app"
    }
    
    var firebaseMessagingSenderID: String {
        return "332670815128"
    }
    
    var firebaseAppID: String {
        // iOS App ID from GoogleService-Info.plist
        return "1:332670815128:ios:c03bbf81e0cf0d412bf9ed"
    }
    
    // MARK: - Vercel AI Gateway Configuration
    
    var vercelAIGatewayBaseURL: String {
        switch self {
        case .development:
            return "https://ai-gateway.vercel.sh/v1"
        case .testing:
            return "https://ai-gateway.vercel.sh/v1"
        case .production:
            return "https://ai-gateway.vercel.sh/v1"
        }
    }
    
    var vercelAIGatewayAPIKey: String {
        return "vck_1muTKHFDKx6wcc5LZaPvG52mlDQpGBPxrLpe4G4GXdBiXlgecj1rZXw7"
    }
}

// MARK: - Firebase Configuration Struct

struct FirebaseConfiguration {
    let apiKey: String
    let authDomain: String
    let projectID: String
    let storageBucket: String
    let messagingSenderID: String
    let appID: String
    
    static var current: FirebaseConfiguration {
        let env = Environment.current
        return FirebaseConfiguration(
            apiKey: env.firebaseAPIKey,
            authDomain: env.firebaseAuthDomain,
            projectID: env.firebaseProjectID,
            storageBucket: env.firebaseStorageBucket,
            messagingSenderID: env.firebaseMessagingSenderID,
            appID: env.firebaseAppID
        )
    }
}

