import SwiftUI
import UIKit

/// Manager for displaying alert dialogs and error messages
class AlertManager {
    static let shared = AlertManager()
    
    private init() {}
    
    /// Shows an error alert using UIAlertController
    func showError(title: String, message: String, on viewController: UIViewController) {
        let alert = UIAlertController(
            title: title,
            message: message,
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        
        viewController.present(alert, animated: true)
        
        // Haptic feedback for error
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.error)
    }
    
    /// Shows a success alert
    func showSuccess(title: String, message: String, on viewController: UIViewController) {
        let alert = UIAlertController(
            title: title,
            message: message,
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        
        viewController.present(alert, animated: true)
        
        // Haptic feedback for success
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }
    
    /// Shows a confirmation dialog
    func showConfirmation(
        title: String,
        message: String,
        confirmTitle: String = "Confirm",
        cancelTitle: String = "Cancel",
        on viewController: UIViewController,
        onConfirm: @escaping () -> Void
    ) {
        let alert = UIAlertController(
            title: title,
            message: message,
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: cancelTitle, style: .cancel))
        alert.addAction(UIAlertAction(title: confirmTitle, style: .default) { _ in
            onConfirm()
        })
        
        viewController.present(alert, animated: true)
    }
}

/// SwiftUI wrapper for alert dialogs
struct AlertView: ViewModifier {
    @Binding var isPresented: Bool
    let title: String
    let message: String
    let alertType: AlertType
    
    enum AlertType {
        case error
        case success
        case warning
    }
    
    func body(content: Content) -> some View {
        content
            .alert(isPresented: $isPresented) {
                Alert(
                    title: Text(title),
                    message: Text(message),
                    dismissButton: .default(Text("OK"))
                )
            }
    }
}

extension View {
    func alert(
        isPresented: Binding<Bool>,
        title: String,
        message: String,
        type: AlertView.AlertType
    ) -> some View {
        self.modifier(AlertView(
            isPresented: isPresented,
            title: title,
            message: message,
            alertType: type
        ))
    }
}

