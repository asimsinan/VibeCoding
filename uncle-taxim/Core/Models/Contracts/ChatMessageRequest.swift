import Foundation

/// Conversation message for history
struct ConversationMessage: Codable {
    var role: String // "user" or "assistant"
    var content: String
    var timestamp: Date?
}

/// Request model for chat message API
struct ChatMessageRequest: Codable {
    var message: String
    var userId: String
    var sessionId: String?
    var timestamp: Date?
    var context: String? // Retrieved context from RAG (rides and transactions)
    var conversationHistory: [ConversationMessage]? // Previous messages for context
    
    enum CodingKeys: String, CodingKey {
        case message
        case userId
        case sessionId
        case timestamp
        case context
        case conversationHistory
    }
    
    init(message: String, userId: String, sessionId: String? = nil, timestamp: Date? = nil, context: String? = nil, conversationHistory: [ConversationMessage]? = nil) {
        self.message = message
        self.userId = userId
        self.sessionId = sessionId
        self.timestamp = timestamp ?? Date()
        self.context = context
        self.conversationHistory = conversationHistory
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(message, forKey: .message)
        try container.encode(userId, forKey: .userId)
        try container.encodeIfPresent(sessionId, forKey: .sessionId)
        try container.encodeIfPresent(context, forKey: .context)
        try container.encodeIfPresent(conversationHistory, forKey: .conversationHistory)
        if let timestamp = timestamp {
            let formatter = ISO8601DateFormatter()
            try container.encode(formatter.string(from: timestamp), forKey: .timestamp)
        }
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        message = try container.decode(String.self, forKey: .message)
        userId = try container.decode(String.self, forKey: .userId)
        sessionId = try? container.decodeIfPresent(String.self, forKey: .sessionId)
        context = try? container.decodeIfPresent(String.self, forKey: .context)
        conversationHistory = try? container.decodeIfPresent([ConversationMessage].self, forKey: .conversationHistory)
        if let timestampString = try? container.decode(String.self, forKey: .timestamp) {
            let formatter = ISO8601DateFormatter()
            timestamp = formatter.date(from: timestampString)
        }
    }
    
    func validate() throws {
        guard !message.isEmpty else {
            throw ValidationError.invalidMessage("Message cannot be empty")
        }
        guard !userId.isEmpty else {
            throw ValidationError.invalidUserId("User ID cannot be empty")
        }
        if let sessionId = sessionId, sessionId.isEmpty {
            throw ValidationError.invalidSessionId("Session ID cannot be empty if provided")
        }
    }
}

