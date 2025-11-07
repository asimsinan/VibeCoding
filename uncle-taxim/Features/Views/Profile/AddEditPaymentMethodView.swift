import SwiftUI
import FirebaseAuth
import FirebaseFunctions
import StripePaymentSheet
import UIKit

struct AddEditPaymentMethodView: View {
    @ObservedObject var viewModel: PaymentMethodsViewModel
    var paymentMethod: PaymentMethod?
    @Binding var isPresented: Bool
    
    @State private var isDefault: Bool = false
    @State private var isProcessing: Bool = false
    @State private var processingError: String?
    @State private var showPaymentSheet: Bool = false
    @State private var paymentSheet: PaymentSheet?
    @State private var currentSetupIntentId: String?
    
    private let paymentService = PaymentService.shared
    
    var isEditing: Bool { paymentMethod != nil }
    
    private var trailingToolbarButton: some View {
        Button("Done") {
            isPresented = false
        }
        .disabled(isProcessing)
        .opacity(isEditing ? 0 : 1)
        .allowsHitTesting(!isEditing)
    }
    
    @ViewBuilder
    private var paymentSheetView: some View {
        if let sheet = paymentSheet {
            PaymentSheetViewController(
                paymentSheet: sheet,
                setupIntentId: currentSetupIntentId
            ) { result in
                handlePaymentSheetResult(result)
            }
        } else {
            EmptyView()
        }
    }
    
    init(viewModel: PaymentMethodsViewModel, paymentMethod: PaymentMethod? = nil, isPresented: Binding<Bool>) {
        self.viewModel = viewModel
        self.paymentMethod = paymentMethod
        self._isPresented = isPresented
        
        if let method = paymentMethod {
            _isDefault = State(initialValue: method.isDefault)
        }
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Payment Method")) {
                    if isEditing, let method = paymentMethod {
                        // Show existing payment method details
                        HStack {
                            Image(systemName: "creditcard.fill")
                                .foregroundColor(AppColors.accentBlue)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(method.displayName)
                                    .font(AppTypography.headline(.semibold))
                                
                                if let expiry = method.formattedExpiry {
                                    Text("Expires \(expiry)")
                                        .font(AppTypography.footnote())
                                        .foregroundColor(AppColors.brandTextSecondary)
                                }
                            }
                            
                            Spacer()
                        }
                        .padding(.vertical, 8)
                    } else {
                        // Show button to add new payment method
                        Button(action: {
                            presentPaymentSheet()
                        }) {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                    .foregroundColor(AppColors.accentBlue)
                                
                                Text("Add Payment Method")
                                    .font(AppTypography.body(.semibold))
                                    .foregroundColor(AppColors.brandTextPrimary)
                                
                                Spacer()
                                
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14))
                                    .foregroundColor(AppColors.brandTextSecondary)
                            }
                            .padding(.vertical, 8)
                        }
                    }
                }
                
                if !isEditing {
                    Section {
                        Toggle("Set as Default", isOn: $isDefault)
                            .font(AppTypography.body())
                    }
                } else {
                    Section {
                        Toggle("Set as Default", isOn: $isDefault)
                            .font(AppTypography.body())
                            .onChange(of: isDefault) { newValue in
                                if newValue, let method = paymentMethod {
                                    Task {
                                        await viewModel.setDefaultPaymentMethod(method)
                                    }
                                }
                            }
                    }
                }
                
                if isProcessing {
                    Section {
                        HStack {
                            Spacer()
                            ProgressView()
                                .padding()
                            Spacer()
                        }
                    }
                }
                
                if let error = processingError {
                    Section {
                        Text(error)
                            .font(AppTypography.caption1())
                            .foregroundColor(AppColors.error)
                    }
                }
            }
            .navigationTitle(isEditing ? "Payment Method" : "Add Payment Method")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    trailingToolbarButton
                }
            }
        }
        .navigationViewStyle(.stack)
        .sheet(isPresented: $showPaymentSheet) {
            paymentSheetView
        }
    }
    
    private func presentPaymentSheet() {
        guard Auth.auth().currentUser != nil else {
            processingError = "User not authenticated"
            return
        }
        
        isProcessing = true
        processingError = nil
        
        Task {
            do {
                // Create a setup intent to collect payment method details without charging
                let setupIntent = try await paymentService.createSetupIntent()
                
                // Configure PaymentSheet
                var configuration = PaymentSheet.Configuration()
                configuration.merchantDisplayName = "UncleTaxim"
                configuration.allowsDelayedPaymentMethods = true
                
                // Create PaymentSheet with setup intent
                let sheet = PaymentSheet(
                    setupIntentClientSecret: setupIntent.clientSecret,
                    configuration: configuration
                )
                
                await MainActor.run {
                    self.paymentSheet = sheet
                    self.currentSetupIntentId = setupIntent.setupIntentId
                    self.showPaymentSheet = true
                    self.isProcessing = false
                }
            } catch let paymentError as PaymentError {
                await MainActor.run {
                    processingError = paymentError.localizedDescription ?? "Failed to initialize payment"
                    isProcessing = false
                }
            } catch {
                await MainActor.run {
                    // Check for common Firebase Functions errors
                    let errorMessage: String
                    if let nsError = error as NSError? {
                        if nsError.domain == "FIRFunctionsErrorDomain" {
                            if nsError.code == 8 { // NOT_FOUND
                                errorMessage = "Firebase Functions not deployed. Please deploy functions first. See STRIPE_SETUP_GUIDE.md"
                            } else if nsError.code == 3 { // INVALID_ARGUMENT
                                errorMessage = "Invalid configuration. Please check Stripe secret key is set in Firebase Functions."
                            } else {
                                errorMessage = nsError.localizedDescription
                            }
                        } else {
                            errorMessage = error.localizedDescription
                        }
                    } else {
                        errorMessage = error.localizedDescription
                    }
                    processingError = "Failed to initialize payment: \(errorMessage)"
                    isProcessing = false
                }
            }
        }
    }
    
    private func handlePaymentSheetResult(_ result: PaymentSheetResult) {
        // Always dismiss the sheet first
        Task { @MainActor in
            showPaymentSheet = false
        }
        
        switch result {
        case .completed(let setupIntentId):
            // Setup intent was completed, retrieve payment method ID
            retrievePaymentMethodFromSetupIntent(setupIntentId: setupIntentId)
        case .canceled:
            // User canceled - sheet already dismissed
            Task { @MainActor in
                isProcessing = false
            }
        case .failed(let error):
            Task { @MainActor in
                processingError = "Payment failed: \(error.localizedDescription)"
                isProcessing = false
            }
        }
    }
    
    private func retrievePaymentMethodFromSetupIntent(setupIntentId: String) {
        // The setup intent contains the payment method ID
        // We need to retrieve it from the setup intent via Firebase Function
        // For now, we'll call createPaymentMethod with the setup intent ID
        // The Firebase Function will retrieve the payment method from the setup intent
        
        guard let userId = Auth.auth().currentUser?.uid else {
            processingError = "User not authenticated"
            return
        }
        
        isProcessing = true
        processingError = nil
        
        Task {
            do {
                // Call Firebase Function to get payment method details from setup intent
                let function = Functions.functions().httpsCallable("createPaymentMethod")
                let data: [String: Any] = [
                    "setupIntentId": setupIntentId
                ]
                
                let result = try await function.call(data)
                guard let resultData = result.data as? [String: Any],
                      let success = resultData["success"] as? Bool,
                      success == true,
                      let paymentMethodId = resultData["paymentMethodId"] as? String else {
                    throw PaymentError.invalidResponse
                }
                
                // Create PaymentMethod model
                let newPaymentMethod = PaymentMethod(
                    id: paymentMethod?.id,
                    userId: userId,
                    type: PaymentMethod.PaymentMethodType.creditCard,
                    last4: resultData["last4"] as? String,
                    brand: (resultData["brand"] as? String)?.capitalized,
                    expiryMonth: resultData["expiryMonth"] as? Int,
                    expiryYear: resultData["expiryYear"] as? Int,
                    isDefault: isDefault,
                    stripePaymentMethodId: paymentMethodId,
                    createdAt: paymentMethod?.createdAt ?? Date(),
                    updatedAt: Date()
                )
                
                if isEditing {
                    await viewModel.updatePaymentMethod(newPaymentMethod)
                } else {
                    await viewModel.addPaymentMethod(newPaymentMethod)
                }
                
                await MainActor.run {
                    isProcessing = false
                    isPresented = false
                }
            } catch {
                await MainActor.run {
                    processingError = "Failed to save payment method: \(error.localizedDescription)"
                    isProcessing = false
                    // Don't dismiss the view on error so user can see the error message
                }
            }
        }
    }
}

// MARK: - PaymentSheet Result
enum PaymentSheetResult {
    case completed(setupIntentId: String)
    case canceled
    case failed(Error)
}

// MARK: - PaymentSheet View Controller Wrapper
struct PaymentSheetViewController: UIViewControllerRepresentable {
    let paymentSheet: PaymentSheet
    let setupIntentId: String?
    let completion: (PaymentSheetResult) -> Void
    
    func makeUIViewController(context: Context) -> UIViewController {
        let viewController = UIViewController()
        viewController.view.backgroundColor = .systemBackground
        
        DispatchQueue.main.async {
            paymentSheet.present(from: viewController) { paymentResult in
                // Dismiss the view controller first
                viewController.dismiss(animated: true) {
                    // Then handle the result
                    switch paymentResult {
                    case .completed:
                        // Use the stored setup intent ID
                        if let setupIntentId = setupIntentId {
                            completion(.completed(setupIntentId: setupIntentId))
                        } else {
                            // Fallback: try to extract from client secret
                            // This is a workaround - ideally we should store the setupIntentId
                            completion(.failed(NSError(domain: "PaymentSheet", code: -1, userInfo: [NSLocalizedDescriptionKey: "Setup intent ID not available"])))
                        }
                    case .canceled:
                        completion(.canceled)
                    case .failed(let error):
                        completion(.failed(error))
                    }
                }
            }
        }
        
        return viewController
    }
    
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
        // No updates needed
    }
}
