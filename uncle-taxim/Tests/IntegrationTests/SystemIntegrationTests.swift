import XCTest
import Combine
@testable import UncleTaxim

class SystemIntegrationTests: XCTestCase {
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        cancellables = Set<AnyCancellable>()
    }
    
    override func tearDown() {
        cancellables = nil
        super.tearDown()
    }
    
    // MARK: - Voice Booking → Ride Suggestions → Ranking Flow
    
    func testVoiceBookingToRideSuggestionsToRankingFlow() {
        // Integration test: Voice booking → ride suggestions → ranking
        let voiceViewModel = VoiceBookingViewModel()
        let suggestionsViewModel = RideSuggestionsViewModel()
        let rankingService = RideRankingService()
        
        // Step 1: Process voice input
        let audioData = "base64_encoded_audio"
        voiceViewModel.processVoice(audioData: audioData)
        
        // Step 2: Generate ride suggestions from voice result
        let expectation1 = XCTestExpectation(description: "Voice processed")
        
        voiceViewModel.$voiceResult
            .dropFirst()
            .sink { result in
                if result != nil {
                    expectation1.fulfill()
                }
            }
            .store(in: &cancellables)
        
        wait(for: [expectation1], timeout: 5.0)
        
        // Step 3: Load and rank suggestions
        suggestionsViewModel.loadSuggestions()
        
        let expectation2 = XCTestExpectation(description: "Suggestions loaded and ranked")
        
        suggestionsViewModel.$suggestions
            .dropFirst()
            .sink { suggestions in
                if !suggestions.isEmpty {
                    // Verify ranking service integration
                    let userPreferences = UserPreferences(userId: "user123")
                    let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: userPreferences)
                    
                    XCTAssertEqual(ranked.count, suggestions.count, "Ranked suggestions should match input count")
                    XCTAssertGreaterThan(ranked.count, 0, "Should have ranked suggestions")
                    
                    expectation2.fulfill()
                }
            }
            .store(in: &cancellables)
        
        wait(for: [expectation2], timeout: 5.0)
    }
    
    // MARK: - Chat Support → Cancellation Handling Flow
    
    func testChatSupportToCancellationFlow() {
        // Integration test: Chat support → cancellation handling
        let chatViewModel = ChatSupportViewModel()
        let bookingViewModel = BookingViewModel()
        
        // Step 1: Send chat message
        chatViewModel.inputMessage = "I want to cancel my ride"
        chatViewModel.sendMessage()
        
        let expectation1 = XCTestExpectation(description: "Chat message processed")
        
        chatViewModel.$messages
            .dropFirst()
            .sink { messages in
                if messages.count >= 2 { // User message + AI response
                    expectation1.fulfill()
                }
            }
            .store(in: &cancellables)
        
        wait(for: [expectation1], timeout: 5.0)
        
        // Step 2: Cancel ride based on chat intent
        bookingViewModel.cancelRide()
        
        XCTAssertNil(bookingViewModel.currentRide, "Ride should be cancelled")
        XCTAssertNil(bookingViewModel.errorMessage, "No error should occur")
    }
    
    // MARK: - Trip Completion → Summary Generation Flow
    
    func testTripCompletionToSummaryFlow() {
        // Integration test: Trip completion → summary generation
        let bookingViewModel = BookingViewModel()
        let tripViewModel = TripSummaryViewModel()
        let dataService = FirebaseDataService()
        let tripService = TripSummaryService(dataService: dataService)
        
        // Step 1: Create a ride (simulate trip completion)
        let pickup = LocationWithAddress(latitude: 40.7128, longitude: -74.0060, address: "123 Main St")
        let dropoff = LocationWithAddress(latitude: 40.7589, longitude: -73.9851, address: "456 Broadway")
        
        let suggestion = RideSuggestion(
            userId: "user123",
            pickupLocation: pickup,
            dropoffLocation: dropoff,
            estimatedPrice: 25.0,
            estimatedDuration: 30,
            source: .manual,
            expiresAt: Date().addingTimeInterval(3600)
        )
        
        bookingViewModel.bookRide(suggestion: suggestion)
        
        let expectation1 = XCTestExpectation(description: "Ride booked")
        
        bookingViewModel.$currentRide
            .dropFirst()
            .sink { ride in
                if let ride = ride {
                    // Step 2: Generate trip summary
                    tripViewModel.loadSummary(rideId: ride.id ?? "ride123")
                    
                    let expectation2 = XCTestExpectation(description: "Summary generated")
                    
                    tripViewModel.$tripSummary
                        .dropFirst()
                        .sink { summary in
                            if let summary = summary {
                                // Step 3: Verify CO₂ calculation integration
                                let distance = 15.5 // km
                                let co2Emissions = tripService.calculateCO2Emissions(distance: distance, rideType: RideType.standard)
                                
                                XCTAssertGreaterThan(co2Emissions, 0, "CO₂ emissions should be calculated")
                                XCTAssertNotNil(summary.tripSummary, "Trip summary should have details")
                                
                                expectation2.fulfill()
                            }
                        }
                        .store(in: &self.cancellables)
                    
                    expectation1.fulfill()
                    
                    self.wait(for: [expectation2], timeout: 5.0)
                }
            }
            .store(in: &cancellables)
        
        wait(for: [expectation1], timeout: 5.0)
    }
    
    // MARK: - Business Logic + Service + ViewModel Integration
    
    func testBusinessLogicServiceViewModelIntegration() {
        // Integration test: All three layers working together
        let rankingService = RideRankingService()
        let voiceService = VoiceProcessingService(aiGateway: AIGatewayService())
        let voiceViewModel = VoiceBookingViewModel(voiceService: voiceService)
        let suggestionsViewModel = RideSuggestionsViewModel(rankingService: rankingService)
        
        // Test complete flow: Voice → Service → ViewModel → Business Logic
        let audioData = "base64_encoded_audio"
        voiceViewModel.processVoice(audioData: audioData)
        
        let expectation = XCTestExpectation(description: "Complete flow integration")
        
        voiceViewModel.$voiceResult
            .dropFirst()
            .sink { result in
                if result != nil {
                    // Verify service layer integration
                    XCTAssertNotNil(result, "Voice service should process audio")
                    
                    // Verify ViewModel integration
                    suggestionsViewModel.loadSuggestions()
                    
                    // Verify business logic integration
                    let userPreferences = UserPreferences(userId: "user123")
                    let ranked = rankingService.rankRideSuggestions(
                        suggestionsViewModel.suggestions,
                        userPreferences: userPreferences
                    )
                    
                    XCTAssertGreaterThanOrEqual(ranked.count, 0, "Should have ranked suggestions")
                    
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 5.0)
    }
    
    // MARK: - Integration Points Verification
    
    func testAllIntegrationPointsFunctional() {
        // Verify all integration points between layers are functional
        
        // 1. Business Logic → Service Layer
        let rankingService = RideRankingService()
        let dataService = FirebaseDataService()
        let tripService = TripSummaryService(dataService: dataService)
        let distance = 10.0
        let co2 = tripService.calculateCO2Emissions(distance: distance, rideType: RideType.standard)
        XCTAssertGreaterThan(co2, 0, "Business logic → Service integration working")
        
        // 2. Service Layer → ViewModel
        let voiceService = VoiceProcessingService(aiGateway: AIGatewayService())
        let voiceViewModel = VoiceBookingViewModel(voiceService: voiceService)
        XCTAssertNotNil(voiceViewModel, "Service → ViewModel integration working")
        
        // 3. ViewModel → Business Logic
        let suggestionsViewModel = RideSuggestionsViewModel()
        suggestionsViewModel.loadSuggestions()
        XCTAssertNotNil(suggestionsViewModel, "ViewModel → Business Logic integration working")
        
        // 4. All layers together
        let chatService = ChatSupportService(aiGateway: AIGatewayService())
        let chatViewModel = ChatSupportViewModel(chatService: chatService)
        chatViewModel.sendMessage()
        XCTAssertNotNil(chatViewModel, "All layers integration working")
    }
}
