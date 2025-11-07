import Foundation
import FirebaseFirestore

struct ChatMessage: Codable, Identifiable {
    // Firestore document ID (managed by @DocumentID)
    // IMPORTANT: Never manually set this property - let Firestore manage it
    // For Identifiable conformance, we use a computed property that returns
    // the Firestore ID if available, or a local ID if not
    @DocumentID private var _firestoreId: String?
    
    // Temporary ID for local messages (not saved to Firestore)
    // This is used for Identifiable conformance when _firestoreId is nil
    private var _localId: String
    
    var userId: String
    var sessionId: String
    var message: String
    var sender: MessageSender
    var intent: String?
    var entities: MessageEntities?
    var aiResponse: String?
    var suggestedActions: [String]
    var rideSuggestionId: String?
    var timestamp: Date
    var createdAt: Date
    
    // Identifiable conformance - use Firestore ID if available, otherwise local ID
    var id: String {
        return _firestoreId ?? _localId
    }
    
    enum CodingKeys: String, CodingKey {
        // Note: '_firestoreId' is excluded - @DocumentID is managed by Firestore
        // '_localId' is also excluded - it's only for local use
        // 'id' is computed, so it's also excluded
        case userId
        case sessionId
        case message
        case sender
        case intent
        case entities
        case aiResponse
        case suggestedActions
        case rideSuggestionId
        case timestamp
        case createdAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // @DocumentID will automatically set _firestoreId during Firestore decoding
        // For local messages, we'll generate a local ID
        self._firestoreId = nil // Will be set by @DocumentID if decoding from Firestore
        self._localId = UUID().uuidString // Generate local ID for Identifiable
        
        self.userId = try container.decode(String.self, forKey: .userId)
        self.sessionId = try container.decode(String.self, forKey: .sessionId)
        self.message = try container.decode(String.self, forKey: .message)
        self.sender = try container.decode(MessageSender.self, forKey: .sender)
        self.intent = try? container.decodeIfPresent(String.self, forKey: .intent)
        self.entities = try? container.decodeIfPresent(MessageEntities.self, forKey: .entities)
        self.aiResponse = try? container.decodeIfPresent(String.self, forKey: .aiResponse)
        self.suggestedActions = try container.decodeIfPresent([String].self, forKey: .suggestedActions) ?? []
        self.rideSuggestionId = try? container.decodeIfPresent(String.self, forKey: .rideSuggestionId)
        self.timestamp = try container.decode(Date.self, forKey: .timestamp)
        self.createdAt = try container.decode(Date.self, forKey: .createdAt)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(userId, forKey: .userId)
        try container.encode(sessionId, forKey: .sessionId)
        try container.encode(message, forKey: .message)
        try container.encode(sender, forKey: .sender)
        try container.encodeIfPresent(intent, forKey: .intent)
        try container.encodeIfPresent(entities, forKey: .entities)
        try container.encodeIfPresent(aiResponse, forKey: .aiResponse)
        try container.encode(suggestedActions, forKey: .suggestedActions)
        try container.encodeIfPresent(rideSuggestionId, forKey: .rideSuggestionId)
        try container.encode(timestamp, forKey: .timestamp)
        try container.encode(createdAt, forKey: .createdAt)
        // Note: _firestoreId and _localId are not encoded - they're managed separately
    }
    
    init(
        id: String? = nil,
        userId: String,
        sessionId: String,
        message: String,
        sender: MessageSender,
        intent: String? = nil,
        entities: MessageEntities? = nil,
        aiResponse: String? = nil,
        suggestedActions: [String] = [],
        rideSuggestionId: String? = nil,
        timestamp: Date = Date(),
        createdAt: Date = Date()
    ) {
        // IMPORTANT: Never set @DocumentID _firestoreId property for new messages
        // Firestore will manage this automatically when saving
        // For messages read from Firestore, _firestoreId will be set by @DocumentID during decoding
        // For local messages, we use _localId for Identifiable conformance
        // We explicitly set _firestoreId to nil for new messages to avoid the Firestore warning
        self._firestoreId = nil // Always nil for new messages - Firestore will set it when reading
        self._localId = UUID().uuidString // Always generate a local ID for Identifiable
        self.userId = userId
        self.sessionId = sessionId
        self.message = message
        self.sender = sender
        self.intent = intent
        self.entities = entities
        self.aiResponse = aiResponse
        self.suggestedActions = suggestedActions
        self.rideSuggestionId = rideSuggestionId
        self.timestamp = timestamp
        self.createdAt = createdAt
    }
    
    // Validation rules
    func validate() throws {
        guard !userId.isEmpty else {
            throw ValidationError.invalidUserId("User ID cannot be empty")
        }
        guard !sessionId.isEmpty else {
            throw ValidationError.invalidSessionId("Session ID cannot be empty")
        }
        guard !message.isEmpty else {
            throw ValidationError.invalidMessage("Message cannot be empty")
        }
    }
    
    // Business logic methods
    func isFromUser() -> Bool {
        return sender == .user
    }
    
    func isFromAI() -> Bool {
        return sender == .ai
    }
    
    func hasRideSuggestion() -> Bool {
        return rideSuggestionId != nil
    }
}

enum MessageSender: String, Codable {
    case user = "user"
    case ai = "ai"
}

struct MessageEntities: Codable {
    var pickupLocation: String?
    var dropoffLocation: String?
    var rideType: String?
    
    init(pickupLocation: String? = nil, dropoffLocation: String? = nil, rideType: String? = nil) {
        self.pickupLocation = pickupLocation
        self.dropoffLocation = dropoffLocation
        self.rideType = rideType
    }
}


