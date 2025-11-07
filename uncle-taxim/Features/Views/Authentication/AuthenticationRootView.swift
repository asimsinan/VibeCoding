import SwiftUI

/// Root view that handles authentication flow
struct AuthenticationRootView: View {
    @StateObject private var authViewModel = AuthenticationViewModel()
    
    var body: some View {
        Group {
            if authViewModel.isAuthenticated {
                ContentView()
                    .environmentObject(authViewModel)
            } else {
                NavigationView {
                    LoginView()
                        .environmentObject(authViewModel)
                }
            }
        }
    }
}

