import SwiftUI
import FirebaseCore

/// Main SwiftUI app entry point for UncleTaxim
// Temporarily removed @main to use UIKit scene-based lifecycle
struct UncleTaximApp: App {
    // Configure Firebase BEFORE the AppDelegate adaptor is created
    // This ensures Firebase is configured before GoogleUtilities tries to check it
    private static let _firebaseConfig: Void = {
        FirebaseConfigManager.configure()
    }()
    
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    init() {
        // Ensure static initializer has run (accessing it triggers initialization)
        _ = UncleTaximApp._firebaseConfig
        
        // Double-check Firebase is configured
        if FirebaseApp.app() == nil {
            FirebaseConfigManager.configure()
            // Final fallback: direct configure
            if FirebaseApp.app() == nil {
                FirebaseApp.configure()
            }
        }
    }
    
    var body: some Scene {
        // This will be called when SwiftUI needs to create the scene
        
        return WindowGroup {
            VideoSplashView()
        }
    }
}

/// Main content view with navigation structure
struct ContentView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var selectedTab: TabItem = .voiceBooking
    
    enum TabItem: Int, CaseIterable {
        case voiceBooking = 0
        case suggestions = 1
        case support = 2
        case profile = 3
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Home/Booking Tab
            NavigationView {
                VoiceBookingView()
                    .environmentObject(authViewModel)
            }
            .tabItem {
                Label("Voice Book Now", systemImage: "mic.fill")
            }
            .tag(TabItem.voiceBooking)
            
            // Ride Suggestions Tab
            NavigationView {
                RideSuggestionsListView()
                    .environmentObject(authViewModel)
            }
            .tabItem {
                Label("Suggestions", systemImage: "list.bullet")
            }
            .tag(TabItem.suggestions)
            
            // Chat Support Tab
            NavigationView {
                ChatSupportView()
                    .environmentObject(authViewModel)
            }
            .tabItem {
                Label("Support", systemImage: "message.fill")
            }
            .tag(TabItem.support)
            
            // Profile Tab
            NavigationView {
                ProfileView()
                    .environmentObject(authViewModel)
            }
            .tabItem {
                Label("Profile", systemImage: "person.fill")
            }
            .tag(TabItem.profile)
        }
        .accentColor(AppColors.accentBlue)
        .onAppear {
            // Customize tab bar appearance
            let appearance = UITabBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = AppColors.brandSurface.uiColor
            
            // Selected tab item
            appearance.stackedLayoutAppearance.selected.iconColor = AppColors.accentBlue.uiColor
            appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
                .foregroundColor: AppColors.accentBlue.uiColor,
                .font: UIFont.systemFont(ofSize: 12, weight: .semibold)
            ]
            
            // Normal tab item
            appearance.stackedLayoutAppearance.normal.iconColor = AppColors.brandTextSecondary.uiColor
            appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
                .foregroundColor: AppColors.brandTextSecondary.uiColor,
                .font: UIFont.systemFont(ofSize: 12, weight: .regular)
            ]
            
            // Apply shadow
            appearance.shadowColor = AppColors.shadowLight.uiColor
            appearance.shadowImage = UIImage()
            
            UITabBar.appearance().standardAppearance = appearance
            if #available(iOS 15.0, *) {
                UITabBar.appearance().scrollEdgeAppearance = appearance
            }
            
        }
        .onChange(of: selectedTab) { newTab in
            HapticFeedbackManager.shared.lightImpact()
        }
    }
}

// MARK: - Color Extension for UIKit
extension Color {
    var uiColor: UIColor {
        return UIColor(self)
    }
}

/// Simple test view to verify app structure works
struct TestContentView: View {
    @State private var showFullApp = false
    
    var body: some View {
        ZStack {
            // Ensure we have a background - use explicit white
            Color.white
                .ignoresSafeArea(.all)
            
            if showFullApp {
                ContentView()
            } else {
                VStack(spacing: 20) {
                    Text("UncleTaxim")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.black)
                    
                    Text("App is running!")
                        .font(.title2)
                        .foregroundColor(.black)
                    
                    Text("Firebase: \(FirebaseApp.app() != nil ? "✅ OK" : "❌ Failed")")
                        .font(.body)
                        .foregroundColor(.black)
                        .padding()
                    
                    Button("Load Full App") {
                        showFullApp = true
                    }
                    .buttonStyle(.borderedProminent)
                    .padding()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.white) // Explicit background
                .onAppear {
                }
            }
        }
        .background(Color.white) // Additional background layer
        .onAppear {
        }
    }
}

/// Absolute minimal test view - just a red rectangle to verify rendering works
struct MinimalTestView: View {
    var body: some View {
        // Simplest possible view - no GeometryReader, no state
        ZStack {
            Color.red
                .ignoresSafeArea()
            
            VStack {
                Text("RED SCREEN")
                    .font(.system(size: 60, weight: .bold))
                    .foregroundColor(.white)
                
                Text("If you see this, it works!")
                    .font(.title)
                    .foregroundColor(.white)
                    .padding()
            }
        }
        .onAppear {
        }
    }
}

// All views are now implemented in Features/Views directories

