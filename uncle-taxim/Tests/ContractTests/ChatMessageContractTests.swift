import XCTest
@testable import UncleTaxim

class ChatMessageContractTests: XCTestCase {
    
    func testChatMessageRequestSchema() {
        // This test will fail initially (RED status)
        // Contract test for ChatMessageRequest structure
        let request = ChatMessageRequest(
            message: "I need a ride to the airport",
            userId: "user123",
            sessionId: "session456",
            timestamp: Date()
        )
        
        XCTAssertNotNil(request, "ChatMessageRequest should be created")
        XCTAssertEqual(request.userId, "user123", "User ID should match")
        XCTAssertEqual(request.message, "I need a ride to the airport", "Message should match")
    }
    
    func testChatMessageResponseSchema() {
        // This test will fail initially (RED status)
        // Contract test for ChatMessageResponse structure
        let response = ChatMessageResponse(
            success: true,
            reply: "I can help you book a ride",
            intent: "request_ride",
            suggestedActions: ["Book ride", "View pricing"],
            rideSuggestion: nil,
            timestamp: Date()
        )
        
        XCTAssertNotNil(response, "ChatMessageResponse should be created")
        XCTAssertTrue(response.success, "Success should be true")
        XCTAssertEqual(response.intent, "request_ride", "Intent should match")
        XCTAssertEqual(response.suggestedActions?.count ?? 0, 2, "Should have 2 suggested actions")
    }
    
    func testChatMessageRequestValidation() {
        // This test will fail initially (RED status)
        // Contract test for request validation
        let invalidRequest = ChatMessageRequest(
            message: "",
            userId: "",
            sessionId: "",
            timestamp: Date()
        )
        
        // This should fail validation
        XCTAssertThrowsError(try invalidRequest.validate(), "Empty request should fail validation")
    }
}

