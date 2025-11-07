import SwiftUI
import AVKit
import AVFoundation
import Combine

struct VideoSplashView: View {
    @State private var showMainApp = false
    @State private var player: AVPlayer?
    @State private var playerItem: AVPlayerItem?
    @State private var cancellables = Set<AnyCancellable>()
    @State private var videoReady = false
    @State private var hasStartedPlaying = false
    
    var body: some View {
        ZStack {
            if showMainApp {
                // Show main app after video completes
                AuthenticationRootView()
                    .transition(.opacity)
            } else {
                // Show video splash screen
                if let player = player, videoReady {
                    VideoPlayer(player: player)
                        .ignoresSafeArea(.all)
                        .onAppear {
                            setupVideoCompletionListener()
                            // Play video
                            print("🎬 [DEBUG] VideoSplashView - Starting video playback")
                            player.play()
                            hasStartedPlaying = true
                        }
                } else {
                    // Fallback: Show animated splash screen if video can't be loaded
                    AnimatedSplashFallbackView()
                        .onAppear {
                            // If video fails to load, show app after a short delay
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                                withAnimation {
                                    showMainApp = true
                                }
                            }
                        }
                }
            }
        }
        .onAppear {
            loadVideo()
        }
    }
    
    private func setupVideoCompletionListener() {
        guard let playerItem = playerItem else { return }
        
        // Listen for video completion using Combine
        NotificationCenter.default.publisher(
            for: .AVPlayerItemDidPlayToEndTime,
            object: playerItem
        )
        .sink { _ in
            print("✅ [DEBUG] VideoSplashView - Video finished playing, transitioning to main app")
            // Video finished, transition to main app
            DispatchQueue.main.async {
                withAnimation(.easeInOut(duration: 0.5)) {
                    self.showMainApp = true
                }
            }
        }
        .store(in: &cancellables)
    }
    
    private func loadVideo() {
        var videoURL: URL?
        
        // First, try to load video from app bundle (recommended)
        if let bundlePath = Bundle.main.path(forResource: "1", ofType: "mp4") {
            videoURL = URL(fileURLWithPath: bundlePath)
            print("✅ [DEBUG] VideoSplashView - Found video in app bundle")
        } else {
            // Fallback: Try to load from Documents directory or project root (for development)
            // This is useful during development before adding to Xcode project
            let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let documentsURL = documentsPath.appendingPathComponent("1.mp4")
            
            if FileManager.default.fileExists(atPath: documentsURL.path) {
                videoURL = documentsURL
                print("✅ [DEBUG] VideoSplashView - Found video in Documents directory")
            } else {
                // Last resort: Try project root (only works in simulator/development)
                let projectRootURL = URL(fileURLWithPath: "/Users/asimsinanyuksel/Desktop/uncle-taxim/1.mp4")
                if FileManager.default.fileExists(atPath: projectRootURL.path) {
                    videoURL = projectRootURL
                    print("✅ [DEBUG] VideoSplashView - Found video in project root (development only)")
                }
            }
        }
        
        guard let url = videoURL else {
            print("⚠️ [WARNING] VideoSplashView - Video file '1.mp4' not found")
            print("   - Make sure to add '1.mp4' to your Xcode project and include it in the app target")
            print("   - Showing fallback animated splash screen")
            // If video not found, show fallback splash for 2 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                withAnimation {
                    showMainApp = true
                }
            }
            return
        }
        
        let item = AVPlayerItem(url: url)
        let avPlayer = AVPlayer(playerItem: item)
        
        // Configure player
        avPlayer.isMuted = false // Set to true if you want muted playback
        avPlayer.actionAtItemEnd = .none // Don't pause at end, we'll handle it with notification
        
        // Store references
        self.playerItem = item
        self.player = avPlayer
        
        print("✅ [DEBUG] VideoSplashView - Video player created, waiting for video to be ready...")
        
        // Observe player item status to know when video is ready
        item.publisher(for: \.status)
            .sink { status in
                switch status {
                case .readyToPlay:
                    print("✅ [DEBUG] VideoSplashView - Video is ready to play")
                    DispatchQueue.main.async {
                        self.videoReady = true
                    }
                case .failed:
                    print("❌ [ERROR] VideoSplashView - Video failed to load: \(item.error?.localizedDescription ?? "Unknown error")")
                    // Fallback to animated splash if video fails
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                        withAnimation {
                            self.showMainApp = true
                        }
                    }
                case .unknown:
                    print("⚠️ [WARNING] VideoSplashView - Video status unknown, waiting...")
                @unknown default:
                    break
                }
            }
            .store(in: &cancellables)
    }
}

/// Fallback animated splash screen when video is not available
struct AnimatedSplashFallbackView: View {
    @State private var scale: CGFloat = 0.8
    @State private var opacity: Double = 0
    @State private var rotation: Double = 0
    
    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                colors: [
                    Color(red: 0.0, green: 0.0, blue: 0.0),
                    Color(red: 0.15, green: 0.15, blue: 0.15)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 30) {
                // Animated logo/icon
                ZStack {
                    // Outer rotating circle
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [
                                    AppColors.accentBlue.opacity(0.3),
                                    AppColors.accentBlue.opacity(0.1)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 3, lineCap: .round)
                        )
                        .frame(width: 120, height: 120)
                        .rotationEffect(.degrees(rotation))
                    
                    // Inner circle with gradient
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    AppColors.accentBlue.opacity(0.2),
                                    AppColors.accentBlue.opacity(0.05)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 100, height: 100)
                    
                    // App icon or text
                    Text("UT")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundColor(AppColors.accentBlue)
                }
                .scaleEffect(scale)
                .opacity(opacity)
                
                // App name
                Text("UncleTaxim")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .opacity(opacity)
            }
        }
        .onAppear {
            // Animate in
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                scale = 1.0
                opacity = 1.0
            }
            
            // Continuous rotation animation
            withAnimation(.linear(duration: 3.0).repeatForever(autoreverses: false)) {
                rotation = 360
            }
        }
    }
}

