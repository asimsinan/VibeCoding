import Foundation

/// Response model for chat message API
struct ChatMessageResponse: Codable {
    var success: Bool
    var reply: String
    var intent: String
    var suggestedActions: [String]?
    var rideSuggestion: RideSuggestionResponse?
    var entities: [String: Any]? // Extracted entities from the query
    var timestamp: Date?
    
    enum CodingKeys: String, CodingKey {
        case success
        case reply
        case intent
        case suggestedActions
        case rideSuggestion
        case entities
        case timestamp
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        // Decode with defaults for missing fields to prevent decoding errors
        success = (try? container.decode(Bool.self, forKey: .success)) ?? true
        reply = (try? container.decode(String.self, forKey: .reply)) ?? "No response received"
        intent = (try? container.decode(String.self, forKey: .intent)) ?? "general"
        suggestedActions = try? container.decodeIfPresent([String].self, forKey: .suggestedActions)
        rideSuggestion = try? container.decodeIfPresent(RideSuggestionResponse.self, forKey: .rideSuggestion)
        
        // Decode entities as a dictionary
        if let entitiesContainer = try? container.nestedContainer(keyedBy: DynamicCodingKeys.self, forKey: .entities) {
            var entitiesDict: [String: Any] = [:]
            for key in entitiesContainer.allKeys {
                if let stringValue = try? entitiesContainer.decode(String.self, forKey: key) {
                    entitiesDict[key.stringValue] = stringValue
                } else if let intValue = try? entitiesContainer.decode(Int.self, forKey: key) {
                    entitiesDict[key.stringValue] = intValue
                } else if let boolValue = try? entitiesContainer.decode(Bool.self, forKey: key) {
                    entitiesDict[key.stringValue] = boolValue
                }
            }
            entities = entitiesDict.isEmpty ? nil : entitiesDict
        }
        
        if let timestampString = try? container.decode(String.self, forKey: .timestamp) {
            let formatter = ISO8601DateFormatter()
            timestamp = formatter.date(from: timestampString)
        }
    }
    
    struct DynamicCodingKeys: CodingKey {
        var stringValue: String
        var intValue: Int?
        
        init?(stringValue: String) {
            self.stringValue = stringValue
        }
        
        init?(intValue: Int) {
            return nil
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(success, forKey: .success)
        try container.encode(reply, forKey: .reply)
        try container.encode(intent, forKey: .intent)
        try container.encodeIfPresent(suggestedActions, forKey: .suggestedActions)
        try container.encodeIfPresent(rideSuggestion, forKey: .rideSuggestion)
        
        // Encode entities if present
        if let entities = entities {
            var entitiesContainer = container.nestedContainer(keyedBy: DynamicCodingKeys.self, forKey: .entities)
            for (key, value) in entities {
                if let codingKey = DynamicCodingKeys(stringValue: key) {
                    if let stringValue = value as? String {
                        try entitiesContainer.encode(stringValue, forKey: codingKey)
                    } else if let intValue = value as? Int {
                        try entitiesContainer.encode(intValue, forKey: codingKey)
                    } else if let boolValue = value as? Bool {
                        try entitiesContainer.encode(boolValue, forKey: codingKey)
                    }
                }
            }
        }
        
        if let timestamp = timestamp {
            let formatter = ISO8601DateFormatter()
            try container.encode(formatter.string(from: timestamp), forKey: .timestamp)
        }
    }
    
    // Memberwise initializer for testing
    init(success: Bool, reply: String, intent: String, suggestedActions: [String]? = nil, rideSuggestion: RideSuggestionResponse? = nil, entities: [String: Any]? = nil, timestamp: Date? = nil) {
        self.success = success
        self.reply = reply
        self.intent = intent
        self.suggestedActions = suggestedActions
        self.rideSuggestion = rideSuggestion
        self.entities = entities
        self.timestamp = timestamp
    }
}

