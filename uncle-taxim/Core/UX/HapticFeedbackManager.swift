import UIKit
import SwiftUI

/// Manager for haptic feedback throughout the app
class HapticFeedbackManager {
    static let shared = HapticFeedbackManager()
    
    private let impactLight = UIImpactFeedbackGenerator(style: .light)
    private let impactMedium = UIImpactFeedbackGenerator(style: .medium)
    private let impactHeavy = UIImpactFeedbackGenerator(style: .heavy)
    private let selection = UISelectionFeedbackGenerator()
    private let notification = UINotificationFeedbackGenerator()
    
    /// Check if running on simulator (haptic feedback doesn't work on simulator)
    private var isSimulator: Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }
    
    private init() {
        // Only prepare generators on real devices
        // On simulator, this causes noisy errors about missing haptic pattern files
        if !isSimulator {
            impactLight.prepare()
            impactMedium.prepare()
            impactHeavy.prepare()
            selection.prepare()
            notification.prepare()
        }
    }
    
    /// Light impact for subtle interactions
    func lightImpact() {
        guard !isSimulator else { return }
        impactLight.impactOccurred()
        impactLight.prepare()
    }
    
    /// Medium impact for standard interactions
    func mediumImpact() {
        guard !isSimulator else { return }
        impactMedium.impactOccurred()
        impactMedium.prepare()
    }
    
    /// Heavy impact for strong interactions
    func heavyImpact() {
        guard !isSimulator else { return }
        impactHeavy.impactOccurred()
        impactHeavy.prepare()
    }
    
    /// Selection feedback for picker changes
    func selectionChanged() {
        guard !isSimulator else { return }
        selection.selectionChanged()
        selection.prepare()
    }
    
    /// Success notification feedback
    func success() {
        guard !isSimulator else { return }
        notification.notificationOccurred(.success)
        notification.prepare()
    }
    
    /// Warning notification feedback
    func warning() {
        guard !isSimulator else { return }
        notification.notificationOccurred(.warning)
        notification.prepare()
    }
    
    /// Error notification feedback
    func error() {
        guard !isSimulator else { return }
        notification.notificationOccurred(.error)
        notification.prepare()
    }
}

/// SwiftUI wrapper for haptic feedback
struct HapticFeedback: ViewModifier {
    let feedbackType: FeedbackType
    
    enum FeedbackType {
        case light
        case medium
        case heavy
        case selection
        case success
        case warning
        case error
    }
    
    func body(content: Content) -> some View {
        content
            .onTapGesture {
                switch feedbackType {
                case .light:
                    HapticFeedbackManager.shared.lightImpact()
                case .medium:
                    HapticFeedbackManager.shared.mediumImpact()
                case .heavy:
                    HapticFeedbackManager.shared.heavyImpact()
                case .selection:
                    HapticFeedbackManager.shared.selectionChanged()
                case .success:
                    HapticFeedbackManager.shared.success()
                case .warning:
                    HapticFeedbackManager.shared.warning()
                case .error:
                    HapticFeedbackManager.shared.error()
                }
            }
    }
}

extension View {
    func hapticFeedback(_ type: HapticFeedback.FeedbackType) -> some View {
        self.modifier(HapticFeedback(feedbackType: type))
    }
}

