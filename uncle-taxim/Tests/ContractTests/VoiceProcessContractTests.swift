import XCTest
@testable import UncleTaxim

class VoiceProcessContractTests: XCTestCase {
    
    func testVoiceProcessRequestSchema() {
        // This test will fail initially (RED status)
        // Contract test for VoiceProcessRequest structure
        let request = VoiceProcessRequest(
            audio: "base64_encoded_audio_data",
            userId: "user123",
            timestamp: Date()
        )
        
        XCTAssertNotNil(request, "VoiceProcessRequest should be created")
        XCTAssertEqual(request.userId, "user123", "User ID should match")
        XCTAssertFalse(request.audio.isEmpty, "Audio should not be empty")
    }
    
    func testVoiceProcessResponseSchema() {
        // This test will fail initially (RED status)
        // Contract test for VoiceProcessResponse structure
        let response = VoiceProcessResponse(
            success: true,
            transcript: "I need a ride to the airport",
            intent: "request_ride",
            entities: VoiceProcessEntities(
                pickupLocation: "Current location",
                dropoffLocation: "Airport",
                rideType: "standard",
                scheduledTime: Date()
            ),
            rideSuggestion: nil,
            timestamp: Date()
        )
        
        XCTAssertNotNil(response, "VoiceProcessResponse should be created")
        XCTAssertTrue(response.success, "Success should be true")
        XCTAssertEqual(response.intent, "request_ride", "Intent should match")
    }
    
    func testVoiceProcessRequestValidation() {
        // This test will fail initially (RED status)
        // Contract test for request validation
        let invalidRequest = VoiceProcessRequest(
            audio: "",
            userId: "",
            timestamp: Date()
        )
        
        // This should fail validation
        XCTAssertThrowsError(try invalidRequest.validate(), "Empty request should fail validation")
    }
}

