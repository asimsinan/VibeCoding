import UIKit
import SwiftUI
import FirebaseCore

@main
@objc class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    
    // Configure Firebase as early as possible using static initialization
    // This MUST run before GoogleUtilities tries to swizzle the AppDelegate
    // We call FirebaseConfigManager.configure() directly to ensure it runs immediately
    private static let _firebaseInitializer: Void = {
        // Configure Firebase immediately - this runs when the class is first loaded
        // before GoogleUtilities can check Firebase status
        FirebaseConfigManager.configure()
        
        // Double-check: if still not configured, try direct call as fallback
        if FirebaseApp.app() == nil {
            // Last resort: try direct configure (will use default options if available)
            FirebaseApp.configure()
        }
    }()
    
    override init() {
        super.init()
        // Ensure Firebase is configured (static initializer should have already run)
        if FirebaseApp.app() == nil {
            FirebaseConfigManager.configure()
            // If still not configured after manager call, try direct configure
            if FirebaseApp.app() == nil {
                FirebaseApp.configure()
            }
        }
    }
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Configure Firebase FIRST - before anything else
        // This must happen before any Firebase services are accessed
        // The static initializer should have already configured it, but double-check here
        if FirebaseApp.app() == nil {
            FirebaseConfigManager.configure()
            // If still not configured, try direct call as final fallback
            if FirebaseApp.app() == nil {
                FirebaseApp.configure()
            }
        }
        
        // Check if scenes are available
        for scene in application.connectedScenes {
        }
        
        // If no scenes are available, create window directly (fallback for non-scene lifecycle)
        if application.connectedScenes.isEmpty {
            
            // Wait a moment for any pending scene creation
            DispatchQueue.main.async {
                
                for scene in application.connectedScenes {
                    if let windowScene = scene as? UIWindowScene {
                        for window in windowScene.windows {
                        }
                    }
                }
                
                if application.connectedScenes.isEmpty {
                    
                    let window = UIWindow(frame: UIScreen.main.bounds)
                    
                    // Use VideoSplashView as the initial splash screen
                    // It will transition to AuthenticationRootView after the video completes
                    let rootView = VideoSplashView()
                    
                    let hostingController = UIHostingController(rootView: rootView)
                    hostingController.view.backgroundColor = .black // Black background for video
                    // Ensure the view is interactive
                    hostingController.view.isUserInteractionEnabled = true
                    
                    window.rootViewController = hostingController
                    window.backgroundColor = .black // Black background for video
                    self.window = window
                    window.makeKeyAndVisible()
                    
                } else {
                    // Check if SceneDelegate created a window
                    if let windowScene = application.connectedScenes.first as? UIWindowScene {
                        if let window = windowScene.windows.first {
                        } else {
                            
                            // SceneDelegate didn't create a window, so we'll create it
                            let window = UIWindow(windowScene: windowScene)
                            
                            // Use VideoSplashView as the initial splash screen
                            // It will transition to AuthenticationRootView after the video completes
                            let rootView = VideoSplashView()
                            
                            let hostingController = UIHostingController(rootView: rootView)
                            hostingController.view.backgroundColor = .black // Black background for video
                            // Ensure the view is interactive
                            hostingController.view.isUserInteractionEnabled = true
                            
                            window.rootViewController = hostingController
                            window.backgroundColor = .black // Black background for video
                            window.makeKeyAndVisible()
                            
                            // Store reference to keep it alive
                            self.window = window
                            
                        }
                    }
                }
            }
        } else {
        }
        
        return true
    }
    
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        
        // Create scene configuration with SceneDelegate
        let config = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        
        return config
    }
    
    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
    }
}
