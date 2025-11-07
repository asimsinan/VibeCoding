import Foundation

/// Request model for voice processing API
struct VoiceProcessRequest: Codable {
    var audio: String
    var userId: String
    var timestamp: Date?
    var language: String? // Language code (e.g., "en", "tr", "auto")
    
    enum CodingKeys: String, CodingKey {
        case audio
        case userId
        case timestamp
        case language
    }
    
    init(audio: String, userId: String, timestamp: Date? = nil, language: String? = nil) {
        self.audio = audio
        self.userId = userId
        self.timestamp = timestamp ?? Date()
        self.language = language
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(audio, forKey: .audio)
        try container.encode(userId, forKey: .userId)
        if let timestamp = timestamp {
            let formatter = ISO8601DateFormatter()
            try container.encode(formatter.string(from: timestamp), forKey: .timestamp)
        }
        if let language = language {
            try container.encode(language, forKey: .language)
        }
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        audio = try container.decode(String.self, forKey: .audio)
        userId = try container.decode(String.self, forKey: .userId)
        if let timestampString = try? container.decode(String.self, forKey: .timestamp) {
            let formatter = ISO8601DateFormatter()
            timestamp = formatter.date(from: timestampString)
        }
        language = try? container.decode(String.self, forKey: .language)
    }
    
    func validate() throws {
        guard !audio.isEmpty else {
            throw ValidationError.emptyValue("Audio cannot be empty")
        }
        guard !userId.isEmpty else {
            throw ValidationError.invalidUserId("User ID cannot be empty")
        }
    }
}

