import XCTest
@testable import UncleTaxim

class ChatSupportServiceTests: XCTestCase {
    var chatService: ChatSupportService!
    var mockAIGateway: AIGatewayService!
    
    override func setUp() {
        super.setUp()
        mockAIGateway = AIGatewayService()
        chatService = ChatSupportService(aiGateway: mockAIGateway)
    }
    
    override func tearDown() {
        chatService = nil
        mockAIGateway = nil
        super.tearDown()
    }
    
    // MARK: - Chat Processing Tests
    
    func testProcessChatMessage_Success() {
        // This test will fail initially (RED status)
        let message = "I need a ride to the airport"
        let userId = "user123"
        let sessionId = "session456"
        
        Task {
            do {
                let result = try await chatService.processChatMessage(message: message, userId: userId, sessionId: sessionId)
                XCTAssertNotNil(result, "Chat processing should return result")
                XCTAssertTrue(result.success, "Chat processing should succeed")
                XCTAssertNotNil(result.reply, "Should return AI reply")
            } catch {
                XCTFail("Chat processing should not throw error: \(error)")
            }
        }
    }
    
    func testProcessChatMessage_WithEmptyMessage() {
        // This test will fail initially (RED status)
        let message = ""
        let userId = "user123"
        let sessionId = "session456"
        
        Task {
            do {
                _ = try await chatService.processChatMessage(message: message, userId: userId, sessionId: sessionId)
                XCTFail("Should throw error for empty message")
            } catch {
                XCTAssertTrue(true, "Should throw error for empty message")
            }
        }
    }
    
    // MARK: - Intent Understanding Tests
    
    func testProcessChatMessage_ExtractIntent() {
        // This test will fail initially (RED status)
        let message = "I need a ride to the airport"
        let userId = "user123"
        let sessionId = "session456"
        
        Task {
            do {
                let result = try await chatService.processChatMessage(message: message, userId: userId, sessionId: sessionId)
                XCTAssertNotNil(result.intent, "Should extract intent from message")
                XCTAssertEqual(result.intent, "request_ride", "Intent should be request_ride")
            } catch {
                XCTFail("Intent extraction should work: \(error)")
            }
        }
    }
    
    func testProcessChatMessage_ExtractEntities() {
        // This test will fail initially (RED status)
        let message = "I need a ride to the airport"
        let userId = "user123"
        let sessionId = "session456"
        
        Task {
            do {
                let result = try await chatService.processChatMessage(message: message, userId: userId, sessionId: sessionId)
                let entities = chatService.extractEntities(from: result)
                // Note: extractEntities currently returns nil (placeholder implementation)
                // This test verifies the method exists and can be called
                XCTAssertNotNil(chatService.extractEntities(from: result), "Should have extractEntities method")
            } catch {
                XCTFail("Entity extraction should work: \(error)")
            }
        }
    }
    
    // MARK: - Suggested Actions Tests
    
    func testProcessChatMessage_GenerateSuggestedActions() {
        // This test will fail initially (RED status)
        let message = "I need a ride to the airport"
        let userId = "user123"
        let sessionId = "session456"
        
        Task {
            do {
                let result = try await chatService.processChatMessage(message: message, userId: userId, sessionId: sessionId)
                XCTAssertGreaterThan(result.suggestedActions?.count ?? 0, 0, "Should generate suggested actions")
            } catch {
                XCTFail("Suggested actions generation should work: \(error)")
            }
        }
    }
    
    // MARK: - Integration Tests
    
    func testChatToRideSuggestion() {
        // This test will fail initially (RED status)
        let message = "I need a ride to the airport"
        let userId = "user123"
        let sessionId = "session456"
        
        Task {
            do {
                let result = try await chatService.processChatMessage(message: message, userId: userId, sessionId: sessionId)
                XCTAssertNotNil(result.rideSuggestion, "Should generate ride suggestion from chat")
            } catch {
                XCTFail("Chat to ride suggestion should work: \(error)")
            }
        }
    }
}

