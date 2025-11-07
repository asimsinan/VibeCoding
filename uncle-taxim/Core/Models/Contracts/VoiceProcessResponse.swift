import Foundation

/// Response model for voice processing API
struct VoiceProcessResponse: Codable {
    var success: Bool
    var transcript: String
    var intent: String
    var entities: VoiceProcessEntities?
    var rideSuggestion: RideSuggestionResponse?
    var timestamp: Date?
    
    enum CodingKeys: String, CodingKey {
        case success
        case transcript
        case intent
        case entities
        case rideSuggestion
        case timestamp
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        success = try container.decode(Bool.self, forKey: .success)
        transcript = try container.decode(String.self, forKey: .transcript)
        intent = try container.decode(String.self, forKey: .intent)
        entities = try? container.decodeIfPresent(VoiceProcessEntities.self, forKey: .entities)
        rideSuggestion = try? container.decodeIfPresent(RideSuggestionResponse.self, forKey: .rideSuggestion)
        if let timestampString = try? container.decode(String.self, forKey: .timestamp) {
            let formatter = ISO8601DateFormatter()
            timestamp = formatter.date(from: timestampString)
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(success, forKey: .success)
        try container.encode(transcript, forKey: .transcript)
        try container.encode(intent, forKey: .intent)
        try container.encodeIfPresent(entities, forKey: .entities)
        try container.encodeIfPresent(rideSuggestion, forKey: .rideSuggestion)
        if let timestamp = timestamp {
            let formatter = ISO8601DateFormatter()
            try container.encode(formatter.string(from: timestamp), forKey: .timestamp)
        }
    }
    
    // Memberwise initializer for testing
    init(success: Bool, transcript: String, intent: String, entities: VoiceProcessEntities? = nil, rideSuggestion: RideSuggestionResponse? = nil, timestamp: Date? = nil) {
        self.success = success
        self.transcript = transcript
        self.intent = intent
        self.entities = entities
        self.rideSuggestion = rideSuggestion
        self.timestamp = timestamp
    }
}

/// Entities extracted from voice input
struct VoiceProcessEntities: Codable {
    var pickupLocation: String?
    var dropoffLocation: String?
    var waypoints: [String]? // Intermediate stops (e.g., ["Eskişehir"] for "Ankara -> Eskişehir -> İstanbul")
    var rideType: String?
    var scheduledTime: Date?
    
    enum CodingKeys: String, CodingKey {
        case pickupLocation
        case dropoffLocation
        case waypoints
        case rideType
        case scheduledTime
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        pickupLocation = try? container.decodeIfPresent(String.self, forKey: .pickupLocation)
        dropoffLocation = try? container.decodeIfPresent(String.self, forKey: .dropoffLocation)
        waypoints = try? container.decodeIfPresent([String].self, forKey: .waypoints)
        rideType = try? container.decodeIfPresent(String.self, forKey: .rideType)
        if let scheduledTimeString = try? container.decodeIfPresent(String.self, forKey: .scheduledTime) {
            let formatter = ISO8601DateFormatter()
            scheduledTime = formatter.date(from: scheduledTimeString)
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(pickupLocation, forKey: .pickupLocation)
        try container.encodeIfPresent(dropoffLocation, forKey: .dropoffLocation)
        try container.encodeIfPresent(waypoints, forKey: .waypoints)
        try container.encodeIfPresent(rideType, forKey: .rideType)
        if let scheduledTime = scheduledTime {
            let formatter = ISO8601DateFormatter()
            try container.encode(formatter.string(from: scheduledTime), forKey: .scheduledTime)
        }
    }
    
    // Memberwise initializer for testing
    init(pickupLocation: String? = nil, dropoffLocation: String? = nil, waypoints: [String]? = nil, rideType: String? = nil, scheduledTime: Date? = nil) {
        self.pickupLocation = pickupLocation
        self.dropoffLocation = dropoffLocation
        self.waypoints = waypoints
        self.rideType = rideType
        self.scheduledTime = scheduledTime
    }
}

/// Ride suggestion response from AI Gateway
struct RideSuggestionResponse: Codable {
    var estimatedPrice: Double
    var estimatedDuration: Int
    var estimatedDistance: Double?
    var rideType: String
    var pickupLocation: String?
    var dropoffLocation: String?
}

