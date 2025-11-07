import XCTest
@testable import UncleTaxim

class RideRankingServiceTests: XCTestCase {
    var rankingService: RideRankingService!
    var userPreferences: UserPreferences!
    
    override func setUp() {
        super.setUp()
        rankingService = RideRankingService()
        userPreferences = UserPreferences(
            userId: "user123",
            ridePreferences: RidePreferences(
                defaultRideType: .standard,
                preferredPaymentMethod: "credit_card"
            )
        )
    }
    
    override func tearDown() {
        rankingService = nil
        userPreferences = nil
        super.tearDown()
    }
    
    // MARK: - ETA Ranking Tests
    
    func testRankByETA_FastestFirst() {
        // This test will fail initially (RED status)
        let suggestion1 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 25.0)
        let suggestion2 = createRideSuggestion(estimatedDuration: 15, estimatedPrice: 30.0)
        let suggestion3 = createRideSuggestion(estimatedDuration: 45, estimatedPrice: 20.0)
        
        let suggestions = [suggestion1, suggestion2, suggestion3]
        let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: userPreferences)
        
        XCTAssertEqual(ranked[0].estimatedDuration, 15, "Fastest ride should be ranked first")
        XCTAssertEqual(ranked[1].estimatedDuration, 30, "Second fastest should be ranked second")
        XCTAssertEqual(ranked[2].estimatedDuration, 45, "Slowest should be ranked last")
    }
    
    func testRankByETA_WeightedScoring() {
        // This test will fail initially (RED status)
        let suggestion1 = createRideSuggestion(estimatedDuration: 20, estimatedPrice: 25.0)
        let suggestion2 = createRideSuggestion(estimatedDuration: 25, estimatedPrice: 20.0)
        
        let suggestions = [suggestion1, suggestion2]
        let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: userPreferences)
        
        // With ETA weighting, faster should rank higher even if slightly more expensive
        XCTAssertEqual(ranked[0].estimatedDuration, 20, "Faster ride should rank first")
    }
    
    // MARK: - Cost Ranking Tests
    
    func testRankByCost_CheapestFirst() {
        // This test will fail initially (RED status)
        let suggestion1 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 30.0)
        let suggestion2 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 20.0)
        let suggestion3 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 25.0)
        
        let suggestions = [suggestion1, suggestion2, suggestion3]
        let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: userPreferences)
        
        XCTAssertEqual(ranked[0].estimatedPrice, 20.0, "Cheapest ride should be ranked first")
        XCTAssertEqual(ranked[1].estimatedPrice, 25.0, "Second cheapest should be ranked second")
        XCTAssertEqual(ranked[2].estimatedPrice, 30.0, "Most expensive should be ranked last")
    }
    
    func testRankByCost_WeightedScoring() {
        // This test will fail initially (RED status)
        let suggestion1 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 25.0)
        let suggestion2 = createRideSuggestion(estimatedDuration: 35, estimatedPrice: 20.0)
        
        let suggestions = [suggestion1, suggestion2]
        let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: userPreferences)
        
        // With cost weighting, cheaper should rank higher even if slightly slower
        XCTAssertEqual(ranked[0].estimatedPrice, 20.0, "Cheaper ride should rank first")
    }
    
    // MARK: - User Preference Ranking Tests
    
    func testRankByUserPreferences_PreferredRideType() {
        // This test will fail initially (RED status)
        var preferences = UserPreferences(
            userId: "user123",
            ridePreferences: RidePreferences(
                defaultRideType: .premium,
                preferredPaymentMethod: "credit_card"
            )
        )
        
        let suggestion1 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 25.0, rideType: .standard)
        let suggestion2 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 30.0, rideType: .premium)
        let suggestion3 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 20.0, rideType: .shared)
        
        let suggestions = [suggestion1, suggestion2, suggestion3]
        let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: preferences)
        
        XCTAssertEqual(ranked[0].rideType, .premium, "Preferred ride type should be ranked first")
    }
    
    func testRankByUserPreferences_WeightedScoring() {
        // This test will fail initially (RED status)
        var preferences = UserPreferences(
            userId: "user123",
            ridePreferences: RidePreferences(
                defaultRideType: .premium,
                preferredPaymentMethod: "credit_card"
            )
        )
        
        let suggestion1 = createRideSuggestion(estimatedDuration: 35, estimatedPrice: 35.0, rideType: .premium)
        let suggestion2 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 25.0, rideType: .standard)
        
        let suggestions = [suggestion1, suggestion2]
        let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: preferences)
        
        // Preferred type should rank higher even if slightly slower/more expensive
        XCTAssertEqual(ranked[0].rideType, .premium, "Preferred ride type should rank first")
    }
    
    // MARK: - Combined Weighted Scoring Tests
    
    func testRankByCombinedWeightedScore_ETAAndCost() {
        // This test will fail initially (RED status)
        let suggestion1 = createRideSuggestion(estimatedDuration: 20, estimatedPrice: 30.0)
        let suggestion2 = createRideSuggestion(estimatedDuration: 25, estimatedPrice: 25.0)
        let suggestion3 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 20.0)
        
        let suggestions = [suggestion1, suggestion2, suggestion3]
        let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: userPreferences)
        
        // Should rank based on combined weighted score
        XCTAssertGreaterThan(ranked.count, 0, "Should return ranked suggestions")
    }
    
    func testRankByCombinedWeightedScore_AllFactors() {
        // This test will fail initially (RED status)
        var preferences = UserPreferences(
            userId: "user123",
            ridePreferences: RidePreferences(
                defaultRideType: .premium,
                preferredPaymentMethod: "credit_card"
            )
        )
        
        let suggestion1 = createRideSuggestion(estimatedDuration: 20, estimatedPrice: 35.0, rideType: .premium)
        let suggestion2 = createRideSuggestion(estimatedDuration: 25, estimatedPrice: 25.0, rideType: .standard)
        let suggestion3 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 20.0, rideType: .shared)
        
        let suggestions = [suggestion1, suggestion2, suggestion3]
        let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: preferences)
        
        // Should rank based on combined weighted score (ETA + cost + preferences)
        XCTAssertGreaterThan(ranked.count, 0, "Should return ranked suggestions")
        XCTAssertEqual(ranked[0].rideType, .premium, "Preferred type with good ETA/cost should rank first")
    }
    
    // MARK: - Edge Cases
    
    func testRankEmptySuggestions() {
        // This test will fail initially (RED status)
        let suggestions: [RideSuggestion] = []
        let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: userPreferences)
        
        XCTAssertEqual(ranked.count, 0, "Empty suggestions should return empty array")
    }
    
    func testRankSingleSuggestion() {
        // This test will fail initially (RED status)
        let suggestion = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 25.0)
        let suggestions = [suggestion]
        let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: userPreferences)
        
        XCTAssertEqual(ranked.count, 1, "Single suggestion should return single item")
        XCTAssertEqual(ranked[0].id, suggestion.id, "Single suggestion should be returned")
    }
    
    func testRankWithEqualScores() {
        // This test will fail initially (RED status)
        let suggestion1 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 25.0)
        let suggestion2 = createRideSuggestion(estimatedDuration: 30, estimatedPrice: 25.0)
        
        let suggestions = [suggestion1, suggestion2]
        let ranked = rankingService.rankRideSuggestions(suggestions, userPreferences: userPreferences)
        
        XCTAssertEqual(ranked.count, 2, "Should return both suggestions")
    }
    
    // MARK: - Helper Methods
    
    private func createRideSuggestion(
        estimatedDuration: Int,
        estimatedPrice: Double,
        rideType: RideType = .standard
    ) -> RideSuggestion {
        let pickup = LocationWithAddress(
            latitude: 40.7128,
            longitude: -74.0060,
            address: "123 Main St"
        )
        let dropoff = LocationWithAddress(
            latitude: 40.7589,
            longitude: -73.9851,
            address: "456 Broadway"
        )
        
        return RideSuggestion(
            userId: "user123",
            pickupLocation: pickup,
            dropoffLocation: dropoff,
            estimatedPrice: estimatedPrice,
            estimatedDuration: estimatedDuration,
            rideType: rideType,
            source: .manual,
            expiresAt: Date().addingTimeInterval(3600)
        )
    }
}

