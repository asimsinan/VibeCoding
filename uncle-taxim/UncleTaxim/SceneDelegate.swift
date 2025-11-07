import UIKit
import SwiftUI
import FirebaseCore

@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    
    override init() {
        super.init()
        // Ensure Firebase is configured early - this runs when SceneDelegate is created
        // Try manager first, then direct call as fallback
        if FirebaseApp.app() == nil {
            FirebaseConfigManager.configure()
            // If still not configured, try direct call
            if FirebaseApp.app() == nil {
                FirebaseApp.configure()
            }
        }
    }
    
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        
        // Ensure Firebase is configured before creating views
        // This is a final check before any views are created
        if FirebaseApp.app() == nil {
            FirebaseConfigManager.configure()
            // Final fallback: direct configure
            if FirebaseApp.app() == nil {
                FirebaseApp.configure()
            }
        }
        
        guard let windowScene = (scene as? UIWindowScene) else {
            return
        }
        
        
        // Create window and set SwiftUI view as root
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
        
        self.window = window
        
        // Verify after a brief delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
        }
    }
    
    func sceneDidBecomeActive(_ scene: UIScene) {
    }
    
    func sceneWillEnterForeground(_ scene: UIScene) {
    }
}
