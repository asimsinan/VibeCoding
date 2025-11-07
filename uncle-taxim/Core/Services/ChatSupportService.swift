import Foundation

protocol ChatSupportServiceProtocol {
    func processChatMessage(message: String, userId: String, sessionId: String, conversationHistory: [ConversationMessage]?) async throws -> ChatMessageResponse
}

class ChatSupportService: ChatSupportServiceProtocol {
    private let aiGateway: AIGatewayServiceProtocol
    private let retrievalService: ChatRetrievalService
    
    init(aiGateway: AIGatewayServiceProtocol, retrievalService: ChatRetrievalService? = nil) {
        self.aiGateway = aiGateway
        self.retrievalService = retrievalService ?? ChatRetrievalService()
    }
    
    /// Processes chat message through RAG pipeline: retrieval -> AI generation
    /// RAG retrieves relevant rides/transactions and includes them in the AI context
    func processChatMessage(message: String, userId: String, sessionId: String, conversationHistory: [ConversationMessage]? = nil) async throws -> ChatMessageResponse {
        try validateInput(message: message, userId: userId, sessionId: sessionId)
        
        // Step 1: Retrieve relevant rides and transactions (RAG retrieval step)
        let retrievedContext = try await retrievalService.retrieveRelevantDocuments(
            userId: userId,
            query: message
        )
        
        // Step 2: Format context for AI prompt
        let contextString = retrievedContext.formatForPrompt()
        
        // Debug: Log what context is being sent
        print("🔍 [DEBUG] ChatSupportService - Retrieved context:")
        print("   - Rides: \(retrievedContext.rides.count)")
        print("   - Transactions: \(retrievedContext.transactions.count)")
        if !contextString.isEmpty {
            print("   - Context preview (first 500 chars): \(String(contextString.prefix(500)))")
        } else {
            print("   - Context is empty")
        }
        
        // Step 3: Send message with context and conversation history to AI Gateway
        let request = ChatMessageRequest(
            message: message,
            userId: userId,
            sessionId: sessionId,
            timestamp: Date(),
            context: contextString.isEmpty ? nil : contextString,
            conversationHistory: conversationHistory
        )
        
        return try await aiGateway.sendChatMessage(request: request)
    }
    
    // MARK: - Validation
    
    private func validateInput(message: String, userId: String, sessionId: String) throws {
        guard !message.isEmpty else {
            throw ChatSupportError.invalidMessage("Message cannot be empty")
        }
        guard !userId.isEmpty else {
            throw ChatSupportError.invalidUserId("User ID cannot be empty")
        }
        guard !sessionId.isEmpty else {
            throw ChatSupportError.invalidSessionId("Session ID cannot be empty")
        }
    }
}

enum ChatSupportError: Error, LocalizedError {
    case invalidMessage(String)
    case invalidUserId(String)
    case invalidSessionId(String)
    case processingFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidMessage(let message):
            return "Invalid message: \(message)"
        case .invalidUserId(let message):
            return "Invalid user ID: \(message)"
        case .invalidSessionId(let message):
            return "Invalid session ID: \(message)"
        case .processingFailed(let message):
            return "Processing failed: \(message)"
        }
    }
}
