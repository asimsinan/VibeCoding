import Foundation

protocol VoiceProcessingServiceProtocol {
    func processVoiceInput(audioData: String, userId: String) async throws -> VoiceProcessResponse
    func extractRideInfo(from response: VoiceProcessResponse) -> RideInfo?
}

class VoiceProcessingService: VoiceProcessingServiceProtocol {
    private let aiGateway: AIGatewayServiceProtocol
    
    init(aiGateway: AIGatewayServiceProtocol) {
        self.aiGateway = aiGateway
    }
    
    /// Processes voice input through Vercel AI Gateway
    func processVoiceInput(audioData: String, userId: String) async throws -> VoiceProcessResponse {
        try validateInput(audioData: audioData, userId: userId)
        
        let request = VoiceProcessRequest(
            audio: audioData,
            userId: userId,
            timestamp: Date()
        )
        
        return try await aiGateway.processVoice(request: request)
    }
    
    /// Extracts ride information from voice response
    func extractRideInfo(from response: VoiceProcessResponse) -> RideInfo? {
        guard let entities = response.entities else { return nil }
        
        return RideInfo(
            pickupLocation: entities.pickupLocation,
            dropoffLocation: entities.dropoffLocation,
            rideType: entities.rideType,
            scheduledTime: entities.scheduledTime
        )
    }
    
    // MARK: - Validation
    
    private func validateInput(audioData: String, userId: String) throws {
        guard !audioData.isEmpty else {
            throw VoiceProcessingError.invalidAudio("Audio data cannot be empty")
        }
        guard !userId.isEmpty else {
            throw VoiceProcessingError.invalidUserId("User ID cannot be empty")
        }
    }
}

struct RideInfo {
    var pickupLocation: String?
    var dropoffLocation: String?
    var rideType: String?
    var scheduledTime: Date?
}

enum VoiceProcessingError: Error, LocalizedError {
    case invalidAudio(String)
    case invalidUserId(String)
    case processingFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidAudio(let message):
            return "Invalid audio: \(message)"
        case .invalidUserId(let message):
            return "Invalid user ID: \(message)"
        case .processingFailed(let message):
            return "Processing failed: \(message)"
        }
    }
}
