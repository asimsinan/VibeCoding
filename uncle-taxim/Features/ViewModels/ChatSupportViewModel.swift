import Foundation
import Combine
import SwiftUI
import FirebaseAuth
import FirebaseFirestore

class ChatSupportViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var inputMessage: String = ""
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var bookingSuggestion: RideSuggestion? // For booking responses (deprecated - now we book directly)
    @Published var bookedRideId: String? // ID of the ride that was booked
    @Published var bookedRide: Ride? // The booked ride
    
    private let chatService: ChatSupportServiceProtocol
    private var sessionId: String
    private var cancellables = Set<AnyCancellable>()
    private let dataService = FirebaseDataService()
    private let locationService = LocationService()
    
    init(chatService: ChatSupportServiceProtocol? = nil) {
        let aiGateway = AIGatewayService()
        self.chatService = chatService ?? ChatSupportService(aiGateway: aiGateway)
        self.sessionId = UUID().uuidString
    }
    
    /// Converts messages to conversation history format
    private func getConversationHistory() -> [ConversationMessage] {
        return messages.map { message in
            ConversationMessage(
                role: message.sender == .user ? "user" : "assistant",
                content: message.message,
                timestamp: message.timestamp
            )
        }
    }
    
    @MainActor
    func sendMessage() {
        guard !inputMessage.isEmpty else { return }
        
        let userId = getCurrentUserId() ?? "user123"
        
        // Don't set id explicitly - let it be nil for local messages
        // If saving to Firestore, Firestore will generate the ID
        let userMessage = ChatMessage(
            id: nil, // Don't set ID - this is just for local display
            userId: userId,
            sessionId: sessionId,
            message: inputMessage,
            sender: .user,
            timestamp: Date()
        )
        
        messages.append(userMessage)
        let messageText = inputMessage
        inputMessage = ""
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                // Get conversation history (excluding current message)
                let history = getConversationHistory()
                
                // Get AI response with RAG context (retrieval + generation)
                // RAG retrieves relevant rides/transactions and includes them in the AI context
                let response = try await chatService.processChatMessage(
                    message: messageText,
                    userId: userId,
                    sessionId: sessionId,
                    conversationHistory: history.isEmpty ? nil : history
                )
                
                // Use AI's RAG-generated response directly
                let aiMessage = ChatMessage(
                    id: nil,
                    userId: userId,
                    sessionId: sessionId,
                    message: response.reply,
                    sender: .ai,
                    timestamp: Date()
                )
                
                await MainActor.run {
                    self.messages.append(aiMessage)
                    self.isLoading = false
                }
                
                // Handle booking if intent is book_ride
                if response.intent == "book_ride", let entities = response.entities {
                    await handleBookingResponse(entities: entities, rideSuggestion: response.rideSuggestion, userId: userId)
                }
            } catch {
                await MainActor.run {
                    // Provide user-friendly error messages
                    let errorMessage: String
                    if let networkError = error as? NetworkError {
                        errorMessage = networkError.localizedDescription
                    } else if let decodingError = error as? DecodingError {
                        switch decodingError {
                        case .dataCorrupted(let context):
                            errorMessage = "Invalid response from server: \(context.debugDescription)"
                        case .keyNotFound(let key, let context):
                            errorMessage = "Missing data: \(key.stringValue). \(context.debugDescription)"
                        case .typeMismatch(let type, let context):
                            errorMessage = "Data type mismatch: \(type). \(context.debugDescription)"
                        case .valueNotFound(let type, let context):
                            errorMessage = "Missing value: \(type). \(context.debugDescription)"
                        @unknown default:
                            errorMessage = "Failed to decode response: \(decodingError.localizedDescription)"
                        }
                    } else {
                        errorMessage = error.localizedDescription.isEmpty ? "An error occurred. Please try again." : error.localizedDescription
                    }
                    
                    self.errorMessage = errorMessage
                    self.isLoading = false
                    
                    // Log error for debugging
                    print("❌ [ERROR] ChatSupportViewModel - Error sending message: \(error)")
                    if let nsError = error as NSError? {
                        print("❌ [ERROR] Domain: \(nsError.domain), Code: \(nsError.code), UserInfo: \(nsError.userInfo)")
                    }
                }
            }
        }
    }
    
    func clearInput() {
        inputMessage = ""
    }
    
    private func getCurrentUserId() -> String? {
        return Auth.auth().currentUser?.uid
    }
    
    /// Handles booking response by creating a ride suggestion
    @MainActor
    private func handleBookingResponse(entities: [String: Any], rideSuggestion: RideSuggestionResponse?, userId: String) async {
        guard let dropoffLocationStr = entities["dropoffLocation"] as? String else {
            print("⚠️ [DEBUG] ChatSupportViewModel - Missing dropoff location in booking response")
            return
        }
        
        // Get pickup location - use current GPS location if not specified or is "Current Location"
        let pickupLocationStr = entities["pickupLocation"] as? String ?? "Current Location"
        let waypoints = entities["waypoints"] as? [String] ?? []
        let rideTypeStr = entities["rideType"] as? String ?? "standard"
        
        do {
            // Geocode addresses - use current location if pickup is "Current Location" or not specified
            let pickupLocation: LocationWithAddress
            if pickupLocationStr.lowercased() == "current location" || pickupLocationStr.lowercased() == "my location" || pickupLocationStr.isEmpty {
                // Get current GPS location
                if let currentLocation = try await locationService.getCurrentLocation() {
                    pickupLocation = currentLocation
                    print("✅ [DEBUG] ChatSupportViewModel - Using current GPS location as pickup: \(currentLocation.address)")
                } else {
                    throw NSError(domain: "ChatSupportViewModel", code: -1, userInfo: [NSLocalizedDescriptionKey: "Could not get current location. Please enable location services."])
                }
            } else {
                pickupLocation = try await geocodeAddress(pickupLocationStr)
            }
            
            let dropoffLocation = try await geocodeAddress(dropoffLocationStr)
            
            var waypointLocations: [LocationWithAddress] = []
            for waypointStr in waypoints {
                if let waypoint = try? await geocodeAddress(waypointStr) {
                    waypointLocations.append(waypoint)
                }
            }
            
            // Calculate route with waypoints
            guard let routeInfo = try await locationService.calculateRoute(
                pickup: pickupLocation,
                dropoff: dropoffLocation,
                waypoints: waypointLocations
            ) else {
                throw NSError(domain: "ChatSupportViewModel", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to calculate route"])
            }
            
            // Determine ride type
            let rideType: RideType
            switch rideTypeStr.lowercased() {
            case "premium":
                rideType = .premium
            case "shared":
                rideType = .shared
            default:
                rideType = .standard
            }
            
            // Calculate price using RidePricingService (includes waypoint fees)
            let pricingService = RidePricingService()
            let (calculatedPrice, calculatedDuration) = pricingService.calculateEstimate(
                distance: routeInfo.distance,  // Distance already includes waypoints
                duration: routeInfo.duration,   // Duration already includes waypoints
                rideType: rideType
            )
            // Add waypoint fee ($2 per waypoint)
            let waypointFee = Double(waypointLocations.count) * 2.0
            let finalPrice = calculatedPrice + waypointFee
            
            // Use calculated values, but only use AI values if they're valid (positive)
            // The AI might return placeholder values (0), so we prefer calculated values
            let finalEstimatedPrice: Double
            if let aiPrice = rideSuggestion?.estimatedPrice, aiPrice > 0 {
                finalEstimatedPrice = aiPrice
            } else {
                finalEstimatedPrice = finalPrice
            }
            
            let finalEstimatedDuration: Int
            if let aiDuration = rideSuggestion?.estimatedDuration, aiDuration > 0 {
                finalEstimatedDuration = aiDuration
            } else {
                finalEstimatedDuration = calculatedDuration
            }
            
            let finalEstimatedDistance: Double
            if let aiDistance = rideSuggestion?.estimatedDistance, aiDistance > 0 {
                finalEstimatedDistance = aiDistance
            } else {
                finalEstimatedDistance = routeInfo.distance
            }
            
            print("🔍 [DEBUG] ChatSupportViewModel - Booking ride directly:")
            print("   - Price: \(String(format: "%.2f", finalEstimatedPrice)) ₺ (AI: \(rideSuggestion?.estimatedPrice ?? 0), Calculated: \(finalPrice))")
            print("   - Duration: \(finalEstimatedDuration) min (AI: \(rideSuggestion?.estimatedDuration ?? 0), Calculated: \(calculatedDuration))")
            print("   - Distance: \(String(format: "%.2f", finalEstimatedDistance)) km (AI: \(rideSuggestion?.estimatedDistance ?? 0), Calculated: \(routeInfo.distance))")
            
            // Validate payment method before booking
            let paymentMethods: [PaymentMethod]
            do {
                paymentMethods = try await dataService.getPaymentMethods(userId: userId)
            } catch {
                throw NSError(domain: "ChatSupportViewModel", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to load payment methods: \(error.localizedDescription)"])
            }
            
            // Check if user has any payment methods
            guard !paymentMethods.isEmpty else {
                throw NSError(domain: "ChatSupportViewModel", code: -1, userInfo: [NSLocalizedDescriptionKey: "Please add a payment method before booking a ride"])
            }
            
            // Find a valid (non-expired) payment method
            let validPaymentMethods = paymentMethods.filter { !$0.isExpired }
            
            guard !validPaymentMethods.isEmpty else {
                throw NSError(domain: "ChatSupportViewModel", code: -1, userInfo: [NSLocalizedDescriptionKey: "All payment methods have expired. Please add a new payment method"])
            }
            
            // Get default payment method, or use the first valid one
            let defaultPaymentMethod = validPaymentMethods.first { $0.isDefault } ?? validPaymentMethods.first
            guard let paymentMethodId = defaultPaymentMethod?.id else {
                throw NSError(domain: "ChatSupportViewModel", code: -1, userInfo: [NSLocalizedDescriptionKey: "No valid payment method found"])
            }
            
            // Create ride directly (not a suggestion)
            let now = Date()
            let ride = Ride(
                userId: userId,
                status: .pending,
                pickupLocation: pickupLocation,
                dropoffLocation: dropoffLocation,
                waypoints: waypointLocations,
                estimatedPrice: finalEstimatedPrice,
                estimatedDuration: finalEstimatedDuration,
                estimatedDistance: finalEstimatedDistance,
                rideType: rideType,
                paymentMethodId: paymentMethodId,
                createdAt: now,
                updatedAt: now
            )
            
            // Save ride to Firestore
            let createdRide = try await dataService.createRide(ride)
            
            await MainActor.run {
                self.bookedRide = createdRide
                self.bookedRideId = createdRide.id
                print("✅ [DEBUG] ChatSupportViewModel - Booked ride directly: \(createdRide.id ?? "nil")")
                
                // Add a success message to chat
                guard let userId = getCurrentUserId() else {
                    print("⚠️ [DEBUG] ChatSupportViewModel - Cannot add booking message: user not authenticated")
                    return
                }
                
                let bookingMessage = ChatMessage(
                    userId: userId,
                    sessionId: self.sessionId,
                    message: "Your ride has been booked! Tap below to view your active ride.",
                    sender: .ai,
                    timestamp: Date()
                )
                self.messages.append(bookingMessage)
            }
        } catch {
            print("❌ [ERROR] ChatSupportViewModel - Failed to book ride: \(error)")
            await MainActor.run {
                self.errorMessage = "Failed to book ride: \(error.localizedDescription)"
            }
        }
    }
    
    /// Geocode an address string
    private func geocodeAddress(_ address: String) async throws -> LocationWithAddress {
        if address.lowercased() == "current location" {
            do {
                if let currentLocation = try await locationService.getCurrentLocation() {
                    return currentLocation
                }
            } catch {
                // Fall through to fallback
            }
        }
        
        do {
            if let geocoded = try await locationService.geocodeAddress(address) {
                return geocoded
            }
        } catch {
            // Fall through to fallback
        }
        
        // Fallback: return location with 0,0 coordinates
        return LocationWithAddress(
            latitude: 0.0,
            longitude: 0.0,
            address: address
        )
    }
    
    
    /// Calculate price based on distance, duration, and ride type
    private func calculatePrice(distance: Double, duration: Int, rideType: RideType) -> Double {
        let basePrice = 5.0
        let perKmPrice = 2.0
        let perMinutePrice = 0.5
        
        var price = basePrice + (distance * perKmPrice) + (Double(duration) * perMinutePrice)
        
        // Apply ride type multiplier
        switch rideType {
        case .premium:
            price *= 1.5
        case .shared:
            price *= 0.7
        case .standard:
            break
        }
        
        return price
    }
}

